const mongoose = require("mongoose");

const candidateSchema = new mongoose.Schema(
  {
    electionId:   { type: mongoose.Schema.Types.ObjectId, ref: "Election", required: true },
    name:         { type: String, required: true, trim: true },
    partyName:    { type: String, required: true, trim: true },
    partySymbol:  { type: String, default: "" },   // URL or path to party logo
    onChainId:    { type: Number },                // candidate ID in smart contract
    contractAddress: { type: String },             // specific contract for this election
    totalVotes:   { type: Number, default: 0 },    // cached from blockchain for display
    isLegacy:     { type: Boolean, default: false }, // migration flag
  },
  { timestamps: true }  // createdAt added automatically
);

// ── Indexes ──
candidateSchema.index({ electionId: 1, onChainId: 1 }, { unique: true, sparse: true });
candidateSchema.index({ contractAddress: 1 });

module.exports = mongoose.model("Candidate", candidateSchema);
