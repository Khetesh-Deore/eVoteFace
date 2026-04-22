const express = require('express');
const router = express.Router();
const Election = require('../models/Election');
const Candidate = require('../models/Candidate');
const auth = require('../middleware/auth');
const { superAdminOnly, adminAuth } = require('../middleware/adminAuth');
const { uploadPartySymbol } = require('../middleware/uploadCloudinary');
const { getElectionContract } = require('../utils/blockchain');

// @route   POST /api/admin/elections/:electionId/candidates
// @desc    Add candidate to election (upload symbol to Cloudinary, register on contract)
// @access  Private/SuperAdmin
router.post('/admin/elections/:electionId/candidates',
  auth,
  superAdminOnly,
  uploadPartySymbol.single('partySymbol'),
  async (req, res) => {
    try {
      const { electionId } = req.params;
      const { name, partyName } = req.body;

      if (!name || !partyName) {
        return res.status(400).json({ message: 'Name and party name are required' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'Party symbol image is required' });
      }

      const election = await Election.findById(electionId);
      if (!election) {
        return res.status(404).json({ message: 'Election not found' });
      }

      // Check if election is in registration phase
      if (election.phase !== 'registration') {
        return res.status(400).json({ 
          message: 'Candidates can only be added during registration phase' 
        });
      }

      // Get party symbol URL from Cloudinary
      const partySymbolUrl = req.file.path;

      // Add candidate to blockchain
      const contract = getElectionContract(election.contractAddress);
      const tx = await contract.addCandidate(name, partyName, partySymbolUrl);
      const receipt = await tx.wait();

      // Get the candidate ID from the event
      const candidateAddedEvent = receipt.logs.find(
        log => log.fragment && log.fragment.name === 'CandidateAdded'
      );

      if (!candidateAddedEvent) {
        return res.status(500).json({ message: 'Failed to get candidate ID from blockchain' });
      }

      const onChainId = Number(candidateAddedEvent.args[0]);

      // Save candidate to MongoDB
      const candidate = new Candidate({
        electionId: election._id,
        name,
        partyName,
        partySymbol: partySymbolUrl,
        onChainId
      });

      await candidate.save();

      res.status(201).json({
        message: 'Candidate added successfully',
        candidate,
        txHash: receipt.hash
      });
    } catch (error) {
      console.error('Add candidate error:', error);
      res.status(500).json({ message: 'Server error adding candidate' });
    }
  }
);

// @route   GET /api/admin/elections/:electionId/candidates
// @desc    Get all candidates for specific election
// @access  Private/Admin (both roles)
router.get('/admin/elections/:electionId/candidates', auth, adminAuth, async (req, res) => {
  try {
    const { electionId } = req.params;

    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const candidates = await Candidate.find({ electionId: election._id })
      .sort({ onChainId: 1 });

    res.json(candidates);
  } catch (error) {
    console.error('Get candidates error:', error);
    res.status(500).json({ message: 'Server error fetching candidates' });
  }
});

// @route   DELETE /api/admin/elections/:electionId/candidates/:candidateId
// @desc    Remove candidate from election
// @access  Private/SuperAdmin
router.delete('/admin/elections/:electionId/candidates/:candidateId', auth, superAdminOnly, async (req, res) => {
  try {
    const { electionId, candidateId } = req.params;

    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Check if election is in registration phase
    if (election.phase !== 'registration') {
      return res.status(400).json({ 
        message: 'Candidates can only be removed during registration phase' 
      });
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    if (candidate.electionId.toString() !== electionId) {
      return res.status(400).json({ message: 'Candidate does not belong to this election' });
    }

    // Remove from blockchain
    const contract = getElectionContract(election.contractAddress);
    const tx = await contract.removeCandidate(candidate.onChainId);
    const receipt = await tx.wait();

    // Remove from MongoDB
    await Candidate.findByIdAndDelete(candidateId);

    res.json({
      message: 'Candidate removed successfully',
      txHash: receipt.hash
    });
  } catch (error) {
    console.error('Remove candidate error:', error);
    res.status(500).json({ message: 'Server error removing candidate' });
  }
});

module.exports = router;
