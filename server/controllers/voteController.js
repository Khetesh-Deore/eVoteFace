import Vote from '../models/Vote.js';
import User from '../models/User.js';
import Candidate from '../models/Candidate.js';
import Election from '../models/Election.js';

export const getCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find().select('name party partySymbol voteCount');
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const castVote = async (req, res) => {
  try {
    const { candidateId } = req.body;
    const userId = req.user.id;

    if (!candidateId) {
      return res.status(400).json({ message: 'Candidate ID required' });
    }

    // Check if user already voted
    const user = await User.findById(userId);
    if (user.hasVoted) {
      return res.status(400).json({ message: 'You have already voted' });
    }

    // Check if candidate exists
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // Check election status
    const election = await Election.findOne({ status: 'active' });
    if (!election) {
      return res.status(400).json({ message: 'No active election' });
    }

    // Create vote record
    const vote = new Vote({
      voterId: userId,
      candidateId,
    });

    await vote.save();

    // Increment vote count
    candidate.voteCount += 1;
    await candidate.save();

    // Mark user as voted
    user.hasVoted = true;
    await user.save();

    res.status(201).json({
      message: 'Vote cast successfully',
      vote: {
        id: vote._id,
        candidateId: vote.candidateId,
        timestamp: vote.timestamp,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getResults = async (req, res) => {
  try {
    const election = await Election.findOne({ status: 'active' });
    if (election) {
      return res.status(400).json({ message: 'Election still active' });
    }

    const candidates = await Candidate.find().select('name party partySymbol voteCount');
    const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0);

    const results = candidates.map((c) => ({
      id: c._id,
      name: c.name,
      party: c.party,
      partySymbol: c.partySymbol,
      voteCount: c.voteCount,
      percentage: totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(2) : 0,
    }));

    res.json({
      totalVotes,
      results: results.sort((a, b) => b.voteCount - a.voteCount),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getLiveResults = async (req, res) => {
  try {
    const candidates = await Candidate.find().select('name party partySymbol voteCount');
    const totalVotes = candidates.reduce((sum, c) => sum + c.voteCount, 0);

    const results = candidates.map((c) => ({
      id: c._id,
      name: c.name,
      party: c.party,
      partySymbol: c.partySymbol,
      voteCount: c.voteCount,
      percentage: totalVotes > 0 ? ((c.voteCount / totalVotes) * 100).toFixed(2) : 0,
    }));

    res.json({
      totalVotes,
      results: results.sort((a, b) => b.voteCount - a.voteCount),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
