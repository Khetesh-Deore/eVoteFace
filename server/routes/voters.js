const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const User = require("../models/User");
const { getContract } = require("../utils/blockchain");

router.use(auth);

// ─────────────────────────────────────────────
// GET /api/voters/status
// ─────────────────────────────────────────────
router.get("/status", async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("+faceEncoding");

    let isRegisteredOnChain = false;
    let hasVotedOnChain = false;

    if (user.walletAddress) {
      try {
        const contract = getContract();
        const status = await contract.getVoterStatus(user.walletAddress);
        isRegisteredOnChain = status.isRegistered;
        hasVotedOnChain = status.hasVoted;
      } catch {
        // Contract call failed — not critical
      }
    }

    return res.json({
      isVerified: user.isVerified,
      hasVoted: user.hasVoted,
      votedAt: user.votedAt || null,
      walletAddress: user.walletAddress || null,
      isRegisteredOnChain,
      hasVotedOnChain,
      faceRegistered: Array.isArray(user.faceEncoding) && user.faceEncoding.length === 128,
    });
  } catch (error) {
    console.error("Voter status error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// POST /api/voters/wallet
// Save wallet address to MongoDB (off-chain)
// ─────────────────────────────────────────────
router.post("/wallet", async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ message: "walletAddress is required" });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({ message: "Invalid Ethereum wallet address format" });
    }

    // Check not already used by another voter
    const existing = await User.findOne({
      walletAddress: walletAddress.toLowerCase(),
      _id: { $ne: req.user._id },
    });
    if (existing) {
      return res.status(409).json({ message: "Wallet address already registered to another voter" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { walletAddress: walletAddress.toLowerCase() },
      { new: true }
    ).select("-password -faceEncoding");

    return res.json({
      message: "Wallet address saved. Admin will register it on-chain.",
      walletAddress: user.walletAddress,
    });
  } catch (error) {
    console.error("Save wallet error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// GET /api/voters/profile
// ─────────────────────────────────────────────
router.get("/profile", async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "fullName email voterID age gender address state city pincode contactNumber walletAddress isVerified hasVoted votedAt createdAt"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json({ user });
  } catch (error) {
    console.error("Profile error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
