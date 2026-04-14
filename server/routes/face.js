const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Election = require('../models/Election');
const auth = require('../middleware/auth');

// @route   POST /api/face/verify
// @desc    Verify voter's face using DeepFace via Python service
// @access  Private
router.post('/verify', auth, async (req, res) => {
  try {
    const { liveImageBase64, electionId } = req.body;

    // Validate input
    if (!liveImageBase64 || !electionId) {
      return res.status(400).json({ 
        message: 'Live image and election ID are required' 
      });
    }

    // Get user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get election
    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Find user's participation in this election
    const electionData = user.elections.find(
      e => e.electionId.toString() === electionId
    );

    if (!electionData) {
      return res.status(400).json({ 
        message: 'You are not registered for this election' 
      });
    }

    if (!electionData.isVerified) {
      return res.status(400).json({ 
        message: 'Your registration must be approved by admin first' 
      });
    }

    if (!electionData.facePhotoUrl) {
      return res.status(400).json({ 
        message: 'No face photo registered. Please contact admin.' 
      });
    }

    // Call Python face verification service
    const pythonServiceUrl = process.env.PYTHON_FACE_API_URL || 'http://localhost:8000';
    
    const verificationResponse = await axios.post(
      `${pythonServiceUrl}/verify`,
      {
        liveImage: liveImageBase64,
        photoUrl: electionData.facePhotoUrl
      },
      {
        timeout: 60000 // 60 second timeout
      }
    );

    const { success, match, confidence, distance, message } = verificationResponse.data;

    if (!success) {
      return res.status(400).json({ 
        message: message || 'Face verification failed' 
      });
    }

    // If face matches, issue a short-lived face verification token
    if (match) {
      const faceVerifiedToken = jwt.sign(
        {
          userId: user._id,
          electionId: electionId,
          faceVerified: true
        },
        process.env.JWT_SECRET,
        { expiresIn: '5m' } // 5 minute expiry
      );

      return res.json({
        success: true,
        match: true,
        confidence,
        distance,
        message: 'Face verified successfully',
        faceVerifiedToken
      });
    } else {
      return res.json({
        success: true,
        match: false,
        confidence,
        distance,
        message: 'Face does not match registered photo. Please try again in good lighting.'
      });
    }
  } catch (error) {
    console.error('Face verification error:', error);

    // Handle Python service errors
    if (error.response) {
      return res.status(error.response.status).json({
        message: error.response.data.message || 'Face verification service error'
      });
    }

    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({ 
        message: 'Face verification service is unavailable. Please try again later.' 
      });
    }

    res.status(500).json({ message: 'Server error during face verification' });
  }
});

module.exports = router;
