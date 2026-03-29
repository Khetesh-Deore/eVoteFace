import mongoose from 'mongoose';

const electionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['upcoming', 'active', 'closed'],
      default: 'upcoming',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Election', electionSchema);
