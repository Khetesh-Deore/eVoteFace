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
    deploymentStatus: {
      type: String,
      enum: ["not_deployed", "deploying", "deployed", "failed"],
      default: "not_deployed",
    },
    deploymentError: { type: String }, // Store error message if deployment fails
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
// Partial index only indexes non-null contractAddress values
// This ensures deployed contracts are unique while allowing unlimited null values
electionSchema.index(
  { contractAddress: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { contractAddress: { $type: "string" } }
  }
);

module.exports = mongoose.model("Election", electionSchema);
