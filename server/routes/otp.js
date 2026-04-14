const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const OTP = require('../models/OTP');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendOTPEmail } = require('../utils/mailer');

// Rate limiting map (in production, use Redis)
const otpRateLimits = new Map();

// @route   POST /api/otp/send
// @desc    Send OTP to voter's email (after face verification)
// @access  Private
router.post('/send', auth, async (req, res) => {
  try {
    const { faceVerifiedToken, electionId } = req.body;

    // Validate input
    if (!faceVerifiedToken || !electionId) {
      return res.status(400).json({ 
        message: 'Face verification token and election ID are required' 
      });
    }

    // Verify face verification token
    let faceVerified;
    try {
      faceVerified = jwt.verify(faceVerifiedToken, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({ 
        message: 'Invalid or expired face verification token' 
      });
    }

    // Validate token contents
    if (!faceVerified.faceVerified || 
        faceVerified.userId !== req.user.id || 
        faceVerified.electionId !== electionId) {
      return res.status(401).json({ 
        message: 'Invalid face verification token' 
      });
    }

    // Get user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check rate limiting
    const rateLimitKey = `${user._id}-${electionId}`;
    const now = Date.now();
    const windowMs = parseInt(process.env.OTP_RATE_LIMIT_WINDOW_MS) || 600000; // 10 minutes
    const maxAttempts = parseInt(process.env.OTP_RATE_LIMIT_MAX) || 3;

    if (otpRateLimits.has(rateLimitKey)) {
      const { count, firstAttempt } = otpRateLimits.get(rateLimitKey);
      
      if (now - firstAttempt < windowMs) {
        if (count >= maxAttempts) {
          return res.status(429).json({ 
            message: 'Too many OTP requests. Please try again later.' 
          });
        }
        otpRateLimits.set(rateLimitKey, { count: count + 1, firstAttempt });
      } else {
        // Reset window
        otpRateLimits.set(rateLimitKey, { count: 1, firstAttempt: now });
      }
    } else {
      otpRateLimits.set(rateLimitKey, { count: 1, firstAttempt: now });
    }

    // Generate 6-digit OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();

    // Set expiry time (5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Delete any existing unused OTPs for this user and election
    await OTP.deleteMany({ 
      email: user.email,
      used: false
    });

    // Save OTP to database
    const otp = new OTP({
      email: user.email,
      code: otpCode,
      expiresAt,
      used: false
    });

    await otp.save();

    // Send OTP via email
    await sendOTPEmail(user.email, otpCode, user.fullName);

    // Mask email for response
    const emailParts = user.email.split('@');
    const maskedEmail = `${emailParts[0].substring(0, 2)}***@${emailParts[1]}`;

    res.json({
      message: 'OTP sent successfully',
      email: maskedEmail,
      expiresIn: 300 // 5 minutes in seconds
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Server error sending OTP' });
  }
});

// @route   POST /api/otp/verify
// @desc    Verify OTP and issue vote authorization token
// @access  Private
router.post('/verify', auth, async (req, res) => {
  try {
    const { code, electionId } = req.body;

    // Validate input
    if (!code || !electionId) {
      return res.status(400).json({ 
        message: 'OTP code and election ID are required' 
      });
    }

    // Get user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find valid OTP
    const otp = await OTP.findOne({
      email: user.email,
      code: code,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!otp) {
      return res.status(400).json({ 
        message: 'Invalid or expired OTP' 
      });
    }

    // Mark OTP as used
    otp.used = true;
    await otp.save();

    // Issue vote authorization token (short-lived)
    const voteAuthToken = jwt.sign(
      {
        userId: user._id,
        electionId: electionId,
        otpVerified: true
      },
      process.env.VOTE_AUTH_TOKEN_SECRET || process.env.JWT_SECRET,
      { expiresIn: process.env.VOTE_AUTH_TOKEN_EXPIRES_IN || '2m' } // 2 minutes
    );

    res.json({
      verified: true,
      message: 'OTP verified successfully',
      voteAuthToken
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error verifying OTP' });
  }
});

module.exports = router;
