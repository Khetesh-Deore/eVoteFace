import mongoose from 'mongoose';

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    party: {
      type: String,
      required: true,
      trim: true,
    },
    partySymbol: {
      type: String,
      default: null,
    },
    voteCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Candidate', candidateSchema);
