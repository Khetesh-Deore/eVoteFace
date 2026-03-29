import User from '../models/User.js';
import Candidate from '../models/Candidate.js';
import Election from '../models/Election.js';
import Vote from '../models/Vote.js';

// Voter Management
export const getVoters = async (req, res) => {
  try {
    const voters = await User.find().select('-password -faceEncoding');
    res.json(voters);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const approveVoter = async (req, res) => {
  try {
    const { voterId } = req.params;
    const voter = await User.findByIdAndUpdate(
      voterId,
      { isApproved: true },
      { new: true }
    ).select('-password -faceEncoding');

    if (!voter) {
      return res.status(404).json({ message: 'Voter not found' });
    }

    res.json({ message: 'Voter approved', voter });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectVoter = async (req, res) => {
  try {
    const { voterId } = req.params;
    const voter = await User.findByIdAndRemove(voterId);

    if (!voter) {
      return res.status(404).json({ message: 'Voter not found' });
    }

    res.json({ message: 'Voter rejected and removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Candidate Management
export const addCandidate = async (req, res) => {
  try {
    const { name, party, partySymbol } = req.body;

    if (!name || !party) {
      return res.status(400).json({ message: 'Name and party required' });
    }

    const candidate = new Candidate({
      name,
      party,
      partySymbol,
    });

    await candidate.save();

    res.status(201).json({
      message: 'Candidate added',
      candidate,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCandidate = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { name, party, partySymbol } = req.body;

    const candidate = await Candidate.findByIdAndUpdate(
      candidateId,
      { name, party, partySymbol },
      { new: true }
    );

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    res.json({ message: 'Candidate updated', candidate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCandidate = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const candidate = await Candidate.findByIdAndRemove(candidateId);

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    res.json({ message: 'Candidate deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Election Management
export const startElection = async (req, res) => {
  try {
    const { title, endTime } = req.body;

    if (!title || !endTime) {
      return res.status(400).json({ message: 'Title and end time required' });
    }

    // Close any active election
    await Election.updateMany({ status: 'active' }, { status: 'closed' });

    const election = new Election({
      title,
      startTime: new Date(),
      endTime: new Date(endTime),
      status: 'active',
    });

    await election.save();

    res.status(201).json({
      message: 'Election started',
      election,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const stopElection = async (req, res) => {
  try {
    const election = await Election.findOneAndUpdate(
      { status: 'active' },
      { status: 'closed' },
      { new: true }
    );

    if (!election) {
      return res.status(404).json({ message: 'No active election' });
    }

    res.json({ message: 'Election stopped', election });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getElection = async (req, res) => {
  try {
    const election = await Election.findOne().sort({ createdAt: -1 });
    res.json(election || { message: 'No election found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Dashboard Stats
export const getDashboardStats = async (req, res) => {
  try {
    const totalVoters = await User.countDocuments();
    const approvedVoters = await User.countDocuments({ isApproved: true });
    const totalVotes = await Vote.countDocuments();
    const totalCandidates = await Candidate.countDocuments();
    const election = await Election.findOne().sort({ createdAt: -1 });

    const turnout = totalVoters > 0 ? ((totalVotes / totalVoters) * 100).toFixed(2) : 0;

    res.json({
      totalVoters,
      approvedVoters,
      totalVotes,
      totalCandidates,
      turnout,
      election,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Audit Log
export const getAuditLog = async (req, res) => {
  try {
    const votes = await Vote.find()
      .populate('voterId', 'name voterId email')
      .populate('candidateId', 'name party')
      .sort({ timestamp: -1 });

    res.json(votes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
