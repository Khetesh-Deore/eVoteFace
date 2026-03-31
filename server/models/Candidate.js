const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    partyName:   { type: String, required: true, trim: true },
    partySymbol: { type: String, default: "" },   // URL or path to party logo
    onChainId:   { type: Number },                // candidate ID in smart contract
    totalVotes:  { type: Number, default: 0 },    // cached from blockchain for display
  },
  { timestamps: true }  // createdAt added automatically
);

// ── Indexes ──
candidateSchema.index({ onChainId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Candidate", candidateSchema);
