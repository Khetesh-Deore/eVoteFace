const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Election = require('../models/Election');
const auth = require('../middleware/auth');
const { getElectionContractReadOnly } = require('../utils/blockchain');

// @route   GET /api/voters/elections
// @desc    Get all elections the logged-in voter is registered in
// @access  Private
router.get('/elections', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get election details for each election the user is registered in
    const electionIds = user.elections.map(e => e.electionId);
    
    const elections = await Election.find({
      _id: { $in: electionIds }
    });

    // Combine election data with user's participation data
    const electionsWithStatus = elections.map(election => {
      const userElectionData = user.elections.find(
        e => e.electionId.toString() === election._id.toString()
      );

      return {
        ...election.toObject(),
        userStatus: userElectionData || {}
      };
    });

    res.json(electionsWithStatus);
  } catch (error) {
    console.error('Get voter elections error:', error);
    res.status(500).json({ message: 'Server error fetching elections' });
  }
});

// @route   GET /api/voters/elections/:electionId/status
// @desc    Get voter's status for specific election
// @access  Private
router.get('/elections/:electionId/status', auth, async (req, res) => {
  try {
    const { electionId } = req.params;

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Find user's participation in this election
    const electionData = user.elections.find(
      e => e.electionId.toString() === electionId
    );

    if (!electionData) {
      return res.json({
        isRegistered: false,
        message: 'You are not registered for this election'
      });
    }

    // Check on-chain registration status if wallet is set
    let isRegisteredOnChain = electionData.isRegisteredOnChain;
    
    if (electionData.walletAddress && !isRegisteredOnChain) {
      try {
        const contract = getElectionContractReadOnly(election.contractAddress);
        const voterStatus = await contract.getVoterStatus(electionData.walletAddress);
        isRegisteredOnChain = voterStatus[0]; // First return value is isRegistered
        
        // Update local status if it changed
        if (isRegisteredOnChain !== electionData.isRegisteredOnChain) {
          electionData.isRegisteredOnChain = isRegisteredOnChain;
          await user.save();
        }
      } catch (error) {
        console.error('Error checking on-chain status:', error);
      }
    }

    res.json({
      isRegistered: true,
      isVerified: electionData.isVerified,
      walletAddress: electionData.walletAddress,
      walletConnected: !!electionData.walletAddress,
      facePhotoUrl: electionData.facePhotoUrl,
      faceRequired: !electionData.facePhotoUrl,
      isRegisteredOnChain,
      hasVoted: electionData.hasVoted,
      votedAt: electionData.votedAt,
      electionPhase: election.phase
    });
  } catch (error) {
    console.error('Get voter status error:', error);
    res.status(500).json({ message: 'Server error fetching voter status' });
  }
});

// @route   POST /api/voters/elections/:electionId/wallet
// @desc    Save wallet address for specific election
// @access  Private
router.post('/elections/:electionId/wallet', auth, async (req, res) => {
  try {
    const { electionId } = req.params;
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ message: 'Wallet address is required' });
    }

    // Validate wallet address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ message: 'Invalid wallet address format' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

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

    // Check if wallet is already used by another user in this election
    const existingUser = await User.findOne({
      'elections.electionId': electionId,
      'elections.walletAddress': walletAddress,
      _id: { $ne: user._id }
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'This wallet address is already registered by another voter for this election' 
      });
    }

    // Update wallet address
    electionData.walletAddress = walletAddress;
    await user.save();

    res.json({
      message: 'Wallet address saved successfully',
      walletAddress
    });
  } catch (error) {
    console.error('Save wallet error:', error);
    res.status(500).json({ message: 'Server error saving wallet address' });
  }
});

// @route   GET /api/voters/profile
// @desc    Get voter profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
});

module.exports = router;
