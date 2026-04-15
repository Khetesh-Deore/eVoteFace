const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const auth = require('../middleware/auth');
const { provider, getElectionContractReadOnly } = require('../utils/blockchain');

// @route   POST /api/votes/record
// @desc    Record vote after blockchain transaction
// @access  Private
router.post('/record', auth, async (req, res) => {
  try {
    const { electionId, candidateId, txHash, voteAuthToken } = req.body;

    // Validate input
    if (!electionId || !candidateId || !txHash || !voteAuthToken) {
      return res.status(400).json({ 
        message: 'Election ID, candidate ID, transaction hash, and vote auth token are required' 
      });
    }

    // Verify vote authorization token
    let voteAuth;
    try {
      voteAuth = jwt.verify(
        voteAuthToken, 
        process.env.VOTE_AUTH_TOKEN_SECRET || process.env.JWT_SECRET
      );
    } catch (error) {
      return res.status(401).json({ 
        message: 'Invalid or expired vote authorization token' 
      });
    }

    // Validate token contents
    if (!voteAuth.otpVerified || 
        voteAuth.userId !== req.user.id || 
        voteAuth.electionId !== electionId) {
      return res.status(401).json({ 
        message: 'Invalid vote authorization token' 
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

    // Check if already voted
    if (electionData.hasVoted) {
      return res.status(400).json({ 
        message: 'You have already voted in this election' 
      });
    }

    // Verify transaction on blockchain
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
      return res.status(400).json({ 
        message: 'Transaction not found on blockchain' 
      });
    }

    // Verify transaction was successful
    if (receipt.status !== 1) {
      return res.status(400).json({ 
        message: 'Transaction failed on blockchain' 
      });
    }

    // Verify transaction was to the correct contract
    if (receipt.to.toLowerCase() !== election.contractAddress.toLowerCase()) {
      return res.status(400).json({ 
        message: 'Transaction was not sent to the correct election contract' 
      });
    }

    // Verify transaction was from the voter's registered wallet
    if (receipt.from.toLowerCase() !== electionData.walletAddress.toLowerCase()) {
      return res.status(400).json({ 
        message: 'Transaction was not sent from your registered wallet' 
      });
    }

    // Verify the transaction contains a VoteCast event
    const contract = getElectionContractReadOnly(election.contractAddress);
    const voteCastEvent = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === 'VoteCast';
      } catch {
        return false;
      }
    });

    if (!voteCastEvent) {
      return res.status(400).json({ 
        message: 'Transaction does not contain a valid vote cast event' 
      });
    }

    // Update user's voting status
    electionData.hasVoted = true;
    electionData.votedAt = new Date();
    await user.save();

    // Update candidate vote count in MongoDB (cached from blockchain)
    await Candidate.findOneAndUpdate(
      { electionId: election._id, onChainId: candidateId },
      { $inc: { totalVotes: 1 } }
    );

    res.json({
      message: 'Vote recorded successfully',
      txHash,
      votedAt: electionData.votedAt
    });
  } catch (error) {
    console.error('Record vote error:', error);
    res.status(500).json({ message: 'Server error recording vote' });
  }
});

// @route   GET /api/votes/results/:electionId
// @desc    Get election results (public)
// @access  Public
router.get('/results/:electionId', async (req, res) => {
  try {
    const { electionId } = req.params;

    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Get contract instance
    const contract = getElectionContractReadOnly(election.contractAddress);

    // Get total candidates
    const totalCandidates = await contract.totalCandidates();

    // Get all candidates with vote counts
    const candidates = [];
    for (let i = 1; i <= totalCandidates; i++) {
      const candidate = await contract.getCandidate(i);
      candidates.push({
        id: Number(candidate.id),
        name: candidate.name,
        party: candidate.partyName,
        partySymbol: candidate.partySymbol,
        voteCount: candidate.voteCount.toString()
      });
    }

    // Get total votes cast
    const totalVotesCast = await contract.totalVotesCast();

    // Get winner if election is completed
    let winner = null;
    const currentPhase = await contract.currentPhase();
    
    if (currentPhase === 2) { // Completed phase
      try {
        const winnerData = await contract.getWinner();
        winner = {
          id: Number(winnerData.id),
          name: winnerData.name,
          party: winnerData.party,
          voteCount: winnerData.voteCount.toString()
        };
      } catch (error) {
        console.error('Error getting winner:', error);
      }
    }

    res.json({
      election: {
        title: election.title,
        description: election.description,
        phase: election.phase,
        startTime: election.startTime,
        endTime: election.endTime
      },
      candidates,
      winner,
      totalVotesCast: totalVotesCast.toString()
    });
  } catch (error) {
    console.error('Get results error:', error);
    res.status(500).json({ message: 'Server error fetching results' });
  }
});

module.exports = router;
