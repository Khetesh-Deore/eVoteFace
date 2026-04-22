const express = require('express');
const router = express.Router();
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { superAdminOnly, adminAuth } = require('../middleware/adminAuth');
const { getFactoryContract, getElectionContract, getElectionContractReadOnly, ADMIN_WALLET_ADDRESS } = require('../utils/blockchain');

// @route   POST /api/admin/elections
// @desc    Create new election (deploys contract via factory)
// @access  Private/SuperAdmin
router.post('/admin/elections', auth, superAdminOnly, async (req, res) => {
  try {
    const { title, description, startTime, endTime } = req.body;

    // Validate required fields
    if (!title || !description || !startTime || !endTime) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    if (end <= start) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // Deploy election contract via factory
    const factory = getFactoryContract();
    
    // Use admin wallet address (the wallet that manages all elections)
    const tx = await factory.createElection(
      title,
      description,
      Math.floor(start.getTime() / 1000),
      Math.floor(end.getTime() / 1000),
      ADMIN_WALLET_ADDRESS // Admin wallet address as election admin
    );

    const receipt = await tx.wait();

    // Extract deployed election address from event
    const electionCreatedEvent = receipt.logs.find(
      log => log.fragment && log.fragment.name === 'ElectionCreated'
    );

    if (!electionCreatedEvent) {
      return res.status(500).json({ message: 'Failed to get deployed contract address' });
    }

    const contractAddress = electionCreatedEvent.args[0];

    // Save election to MongoDB
    const election = new Election({
      title,
      description,
      contractAddress,
      adminId: req.user._id, // MongoDB admin ID from auth middleware
      startTime: start,
      endTime: end,
      phase: 'registration'
    });

    await election.save();

    res.status(201).json({
      message: 'Election created successfully',
      election,
      txHash: receipt.hash
    });
  } catch (error) {
    console.error('Create election error:', error);
    res.status(500).json({ message: 'Server error creating election' });
  }
});

// @route   GET /api/admin/elections
// @desc    Get all elections (admin view)
// @access  Private/Admin (both roles)
router.get('/admin/elections', auth, adminAuth, async (req, res) => {
  try {
    const elections = await Election.find()
      .populate('adminId', 'fullName email')
      .sort({ createdAt: -1 });

    // Get stats for each election
    const electionsWithStats = await Promise.all(
      elections.map(async (election) => {
        const candidateCount = await Candidate.countDocuments({ electionId: election._id });
        const voterCount = await User.countDocuments({
          'elections.electionId': election._id
        });
        const votedCount = await User.countDocuments({
          'elections.electionId': election._id,
          'elections.hasVoted': true
        });

        return {
          ...election.toObject(),
          stats: {
            candidateCount,
            voterCount,
            votedCount
          }
        };
      })
    );

    res.json(electionsWithStats);
  } catch (error) {
    console.error('Get admin elections error:', error);
    res.status(500).json({ message: 'Server error fetching elections' });
  }
});

// @route   GET /api/elections
// @desc    Get public list of active/upcoming elections
// @access  Public
router.get('/elections', async (req, res) => {
  try {
    const now = new Date();

    const elections = await Election.find({
      $or: [
        { phase: 'registration' },
        { phase: 'voting' },
        { endTime: { $gte: now } }
      ]
    })
      .select('-adminId')
      .sort({ startTime: 1 });

    res.json(elections);
  } catch (error) {
    console.error('Get public elections error:', error);
    res.status(500).json({ message: 'Server error fetching elections' });
  }
});

// @route   GET /api/elections/:electionId
// @desc    Get election details (public)
// @access  Public
router.get('/elections/:electionId', async (req, res) => {
  try {
    const election = await Election.findById(req.params.electionId);

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Get candidates
    const candidates = await Candidate.find({ electionId: election._id });

    // Get voter count
    const voterCount = await User.countDocuments({
      'elections.electionId': election._id
    });

    res.json({
      ...election.toObject(),
      candidates,
      voterCount
    });
  } catch (error) {
    console.error('Get election detail error:', error);
    res.status(500).json({ message: 'Server error fetching election' });
  }
});

// @route   POST /api/admin/elections/:electionId/phase
// @desc    Change election phase (with reset support)
// @access  Private/SuperAdmin
router.post('/admin/elections/:electionId/phase', auth, superAdminOnly, async (req, res) => {
  try {
    const { phase } = req.body;

    if (!phase || !['registration', 'voting', 'completed'].includes(phase)) {
      return res.status(400).json({ message: 'Invalid phase' });
    }

    const election = await Election.findById(req.params.electionId);

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Get contract instance
    const contract = getElectionContractReadOnly(election.contractAddress);

    // Check current phase on-chain
    const currentPhase = await contract.currentPhase();
    const totalVotesCast = await contract.totalVotesCast();

    console.log('Phase change attempt:', {
      currentPhase: currentPhase.toString(),
      requestedPhase: phase,
      totalVotesCast: totalVotesCast.toString()
    });

    // Phase mapping: 0 = Registration, 1 = Voting, 2 = Completed
    const phaseMap = { registration: 0, voting: 1, completed: 2 };
    const newPhaseValue = phaseMap[phase];

    // Check if this is a forward transition
    if (newPhaseValue === Number(currentPhase) + 1) {
      console.log('Forward transition detected');
    } else if (currentPhase === 1 && newPhaseValue === 0) {
      console.log('Backward transition (voting to registration) detected');
      // Reset from Voting to Registration
      if (totalVotesCast > 0) {
        return res.status(400).json({ 
          message: 'Cannot reset to registration phase after votes have been cast',
          totalVotesCast: totalVotesCast.toString()
        });
      }
    } else if (newPhaseValue < currentPhase) {
      return res.status(400).json({ 
        message: 'Cannot move to a previous phase (except voting to registration with no votes)',
        currentPhase: currentPhase.toString(),
        requestedPhase: newPhaseValue.toString()
      });
    } else if (newPhaseValue === Number(currentPhase)) {
      return res.status(400).json({ 
        message: 'Election is already in this phase',
        currentPhase: phase
      });
    }

    // Change phase on contract
    const contractWithSigner = getElectionContract(election.contractAddress);
    const tx = await contractWithSigner.changePhase(newPhaseValue);
    const receipt = await tx.wait();

    // Update MongoDB
    election.phase = phase;
    await election.save();

    res.json({
      message: 'Phase changed successfully',
      election,
      txHash: receipt.hash
    });
  } catch (error) {
    console.error('Change phase error:', error);
    console.error('Error details:', {
      message: error.message,
      reason: error.reason,
      code: error.code
    });
    
    if (error.message && error.message.includes('action not allowed in current phase')) {
      return res.status(400).json({ 
        message: 'Phase change not allowed. The smart contract rejected this transition.',
        hint: 'This contract may be using old logic. Try creating a new election.'
      });
    }
    
    if (error.message && error.message.includes('Can only advance to the next phase')) {
      return res.status(400).json({ 
        message: 'This election contract is outdated and has restrictive phase logic.',
        solution: 'Please create a new election. The old contract does not support the current phase transition logic.'
      });
    }
    
    if (error.message && error.message.includes('cannot reset phase after votes')) {
      return res.status(400).json({ 
        message: 'Cannot reset to registration phase because votes have already been cast in this election.'
      });
    }
    
    if (error.reason) {
      return res.status(400).json({ 
        message: error.reason,
        hint: 'If this is an old election, create a new one with the updated contract.'
      });
    }
    
    res.status(500).json({ 
      message: 'Server error changing phase',
      details: error.message
    });
  }
});

// @route   GET /api/admin/elections/:electionId/results
// @desc    Get election results (admin view)
// @access  Private/Admin (both roles)
router.get('/admin/elections/:electionId/results', auth, adminAuth, async (req, res) => {
  try {
    const election = await Election.findById(req.params.electionId);

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Get contract instance
    const contract = getElectionContractReadOnly(election.contractAddress);

    // Get all candidates from contract
    const totalCandidates = await contract.totalCandidates();
    const candidates = [];

    for (let i = 1; i <= totalCandidates; i++) {
      const candidate = await contract.getCandidate(i);
      candidates.push({
        id: Number(candidate.id),
        name: candidate.name,
        party: candidate.partyName,
        voteCount: candidate.voteCount.toString()
      });
    }

    // Get winner if phase is completed
    let winner = null;
    const currentPhase = await contract.currentPhase();
    
    if (Number(currentPhase) === 2) { // Completed
      const winnerData = await contract.getWinner();
      winner = {
        id: Number(winnerData.id),
        name: winnerData.name,
        party: winnerData.partyName,
        voteCount: winnerData.voteCount.toString()
      };
    }

    // Get total votes
    const totalVotesCast = await contract.totalVotesCast();

    // Get voter participation stats
    const totalVoters = await User.countDocuments({
      'elections.electionId': election._id
    });

    const votedCount = await User.countDocuments({
      'elections.electionId': election._id,
      'elections.hasVoted': true
    });

    res.json({
      election,
      candidates,
      winner,
      stats: {
        totalVotesCast: totalVotesCast.toString(),
        totalVoters,
        votedCount,
        turnoutPercentage: totalVoters > 0 ? ((votedCount / totalVoters) * 100).toFixed(2) : 0
      }
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ message: 'Server error fetching results' });
  }
});

module.exports = router;
