import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema(
  {
    voterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
    },
    txnHash: {
      type: String,
      default: null,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for unique vote per voter
voteSchema.index({ voterId: 1 }, { unique: true });

export default mongoose.model('Vote', voteSchema);
