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
    contractAddress: { type: String, required: false, default: null },
    factoryTxHash:   { type: String },
    admin:       { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    isActive:    { type: Boolean, default: true },
    startTime:   { type: Date },
    endTime:     { type: Date },
    createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    isLegacy:    { type: Boolean, default: false }, // migration flag
  },
  { timestamps: true }
);

// ── Indexes ──
electionSchema.index({ admin: 1 });
electionSchema.index({ isActive: 1 });
// Sparse index allows multiple null values but ensures deployed contracts are unique
electionSchema.index({ contractAddress: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Election", electionSchema);
