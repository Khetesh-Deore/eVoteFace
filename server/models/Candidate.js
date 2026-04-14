const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  electionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  partyName: {
    type: String,
    required: true,
    trim: true
  },
  partySymbol: {
    type: String,
    required: true
  },
  onChainId: {
    type: Number,
    required: true
  },
  totalVotes: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure unique onChainId per election
candidateSchema.index({ electionId: 1, onChainId: 1 }, { unique: true });

module.exports = mongoose.model('Candidate', candidateSchema);
