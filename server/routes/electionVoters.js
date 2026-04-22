const express = require('express');
const router = express.Router();
const Election = require('../models/Election');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { voterAdminOnly } = require('../middleware/adminAuth');
const { uploadVoterFace } = require('../middleware/uploadCloudinary');
const { getElectionContract } = require('../utils/blockchain');

// @route   GET /api/admin/elections/:electionId/voters
// @desc    Get all voters for specific election
// @access  Private/Admin
router.get('/admin/elections/:electionId/voters', auth, voterAdminOnly, async (req, res) => {
  try {
    const election = await Election.findById(req.params.electionId);

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Find all users who have this election in their elections array
    const voters = await User.find({
      'elections.electionId': election._id
    }).select('-password');

    // Format response with election-specific data
    const votersWithElectionData = voters.map(voter => {
      const electionData = voter.elections.find(
        e => e.electionId.toString() === election._id.toString()
      );

      return {
        _id: voter._id,
        fullName: voter.fullName,
        email: voter.email,
        voterID: voter.voterID,
        age: voter.age,
        gender: voter.gender,
        contactNumber: voter.contactNumber,
        electionData: electionData || {}
      };
    });

    res.json(votersWithElectionData);
  } catch (error) {
    console.error('Get election voters error:', error);
    res.status(500).json({ message: 'Server error fetching voters' });
  }
});

// @route   POST /api/admin/elections/:electionId/voters/:userId/approve
// @desc    Approve voter for specific election
// @access  Private/Admin
router.post('/admin/elections/:electionId/voters/:userId/approve', auth, voterAdminOnly, async (req, res) => {
  try {
    const { electionId, userId } = req.params;

    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already in this election
    const existingElection = user.elections.find(
      e => e.electionId.toString() === electionId
    );

    if (existingElection) {
      // Update existing
      existingElection.isVerified = true;
    } else {
      // Add new election participation
      user.elections.push({
        electionId: election._id,
        isVerified: true
      });
    }

    await user.save();

    res.json({
      message: 'Voter approved for election',
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Approve voter error:', error);
    res.status(500).json({ message: 'Server error approving voter' });
  }
});

// @route   POST /api/admin/elections/:electionId/voters/:userId/register-onchain
// @desc    Register voter's wallet on election contract
// @access  Private/Admin
router.post('/admin/elections/:electionId/voters/:userId/register-onchain', auth, voterAdminOnly, async (req, res) => {
  try {
    const { electionId, userId } = req.params;
    const { walletAddress } = req.body;

    console.log('Register on-chain request:', { electionId, userId, walletAddress });

    if (!walletAddress) {
      return res.status(400).json({ message: 'Wallet address is required' });
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ message: 'Invalid wallet address format' });
    }

    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Check election phase
    if (election.phase !== 'registration') {
      return res.status(400).json({ 
        message: `Cannot register voters during ${election.phase} phase. Please change election phase to "registration" first.`,
        currentPhase: election.phase
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find election participation
    const electionData = user.elections.find(
      e => e.electionId.toString() === electionId
    );

    if (!electionData) {
      return res.status(400).json({ message: 'User not registered for this election' });
    }

    if (!electionData.isVerified) {
      return res.status(400).json({ message: 'User must be approved first' });
    }

    // Check if wallet is already registered on-chain
    const contract = getElectionContract(election.contractAddress);
    
    console.log('Checking voter status on-chain...');
    const voterStatus = await contract.getVoterStatus(walletAddress);
    
    if (voterStatus[0]) {
      console.log('Wallet already registered on-chain');
      // Update local status
      electionData.walletAddress = walletAddress;
      electionData.isRegisteredOnChain = true;
      await user.save();
      
      return res.status(400).json({ message: 'Wallet already registered on blockchain' });
    }

    // Register on blockchain
    console.log('Registering voter on blockchain...');
    const tx = await contract.registerVoter(walletAddress);
    console.log('Transaction sent:', tx.hash);
    
    const receipt = await tx.wait();
    console.log('Transaction confirmed:', receipt.hash);

    // Update user data
    electionData.walletAddress = walletAddress;
    electionData.isRegisteredOnChain = true;
    await user.save();

    res.json({
      message: 'Voter registered on blockchain',
      txHash: receipt.hash,
      walletAddress
    });
  } catch (error) {
    console.error('Register voter on-chain error:', error);
    
    if (error.message && error.message.includes('action not allowed in current phase')) {
      return res.status(400).json({ 
        message: 'Cannot register voters during this phase. Change election to "registration" phase first.',
        hint: 'Go to Overview tab → Set to Registration'
      });
    }
    
    if (error.message && error.message.includes('already registered')) {
      return res.status(400).json({ message: 'Wallet already registered on this election' });
    }
    
    if (error.message && error.message.includes('admin cannot be a voter')) {
      return res.status(400).json({ message: 'Admin wallet cannot be registered as a voter. Please use a different wallet address.' });
    }
    
    if (error.code === 'CALL_EXCEPTION') {
      return res.status(400).json({ 
        message: 'Transaction failed. The wallet address may be invalid or already registered.',
        details: error.message
      });
    }
    
    res.status(500).json({ 
      message: 'Server error registering voter on blockchain',
      details: error.message
    });
  }
});

// @route   POST /api/admin/elections/:electionId/voters/:userId/face
// @desc    Upload voter face photo to Cloudinary
// @access  Private/VoterAdmin (both roles)
router.post('/admin/elections/:electionId/voters/:userId/face', 
  auth, 
  voterAdminOnly, 
  uploadVoterFace.single('facePhoto'),
  async (req, res) => {
    try {
      const { electionId, userId } = req.params;

      if (!req.file) {
        return res.status(400).json({ message: 'Face photo is required' });
      }

      const election = await Election.findById(electionId);
      if (!election) {
        return res.status(404).json({ message: 'Election not found' });
      }

      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Find election participation
      const electionData = user.elections.find(
        e => e.electionId.toString() === electionId
      );

      if (!electionData) {
        return res.status(400).json({ message: 'User not registered for this election' });
      }

      // Store Cloudinary URL
      electionData.facePhotoUrl = req.file.path;
      await user.save();

      res.json({
        message: 'Face photo uploaded successfully',
        facePhotoUrl: req.file.path
      });
    } catch (error) {
      console.error('Upload face photo error:', error);
      res.status(500).json({ message: 'Server error uploading face photo' });
    }
  }
);

// @route   DELETE /api/admin/elections/:electionId/voters/:userId
// @desc    Remove voter from election
// @access  Private/Admin
router.delete('/admin/elections/:electionId/voters/:userId', auth, voterAdminOnly, async (req, res) => {
  try {
    const { electionId, userId } = req.params;

    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if voter has already voted
    const electionData = user.elections.find(
      e => e.electionId.toString() === electionId
    );

    if (electionData && electionData.hasVoted) {
      return res.status(400).json({ 
        message: 'Cannot remove voter who has already cast their vote' 
      });
    }

    // Remove election from user's elections array
    user.elections = user.elections.filter(
      e => e.electionId.toString() !== electionId
    );

    await user.save();

    res.json({
      message: 'Voter removed from election',
      userId: user._id
    });
  } catch (error) {
    console.error('Remove voter error:', error);
    res.status(500).json({ message: 'Server error removing voter' });
  }
});

module.exports = router;
