const mongoose = require("mongoose");

const electionSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    description: { type: String, default: "" },
    phase: {
      type: String,
      enum: ["registration", "voting", "completed"],
      default: "registration",
    },
    startTime: { type: Date },
    endTime:   { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Election", electionSchema);
