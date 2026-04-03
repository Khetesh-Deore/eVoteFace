const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const User = require("../models/User");
const { getContract, getProvider } = require("../utils/blockchain");

// ─────────────────────────────────────────────
// POST /api/votes/record
// Protected — requires voter JWT + voteAuthToken
// Body: { candidateId, txHash, voteAuthToken }
// Flow:
//   1. Verify main JWT (auth middleware)
//   2. Verify voteAuthToken (proves OTP passed)
//   3. Check voter hasn't already voted in MongoDB
//   4. Verify txHash on Ethereum (receipt check)
//   5. Mark hasVoted: true in MongoDB
// ─────────────────────────────────────────────
router.post("/record", auth, async (req, res) => {
  try {
    const { candidateId, txHash, voteAuthToken } = req.body;

    if (!candidateId || !txHash || !voteAuthToken) {
      return res.status(400).json({ message: "candidateId, txHash, and voteAuthToken are required" });
    }

    // Step 1: Verify voteAuthToken — proves OTP was completed
    let votePayload;
    try {
      votePayload = jwt.verify(voteAuthToken, process.env.VOTE_AUTH_TOKEN_SECRET);
    } catch {
      return res.status(401).json({ message: "Vote authorization token is invalid or expired. Please complete OTP verification again." });
    }

    if (!votePayload.otpVerified || votePayload.userId !== req.user._id.toString()) {
      return res.status(401).json({ message: "Invalid vote authorization token" });
    }

    // Step 2: Check MongoDB — already voted?
    const user = await User.findById(req.user._id);
    if (user.hasVoted) {
      return res.status(400).json({ message: "You have already cast your vote" });
    }

    if (!user.walletAddress) {
      return res.status(400).json({ message: "No wallet address registered. Contact admin." });
    }

    // Step 3: Verify transaction on Ethereum
    const provider = getProvider();
    let receipt;
    try {
      receipt = await provider.getTransactionReceipt(txHash);
    } catch {
      return res.status(400).json({ message: "Could not fetch transaction receipt. Please wait and try again." });
    }

    if (!receipt) {
      return res.status(400).json({ message: "Transaction not found on blockchain. It may still be pending." });
    }

    if (receipt.status !== 1) {
      return res.status(400).json({ message: "Transaction failed on blockchain" });
    }

    // Verify tx was sent to the correct contract
    if (receipt.to.toLowerCase() !== process.env.CONTRACT_ADDRESS.toLowerCase()) {
      return res.status(400).json({ message: "Transaction was not sent to the voting contract" });
    }

    // Verify tx was sent from the voter's registered wallet
    if (receipt.from.toLowerCase() !== user.walletAddress.toLowerCase()) {
      return res.status(400).json({ message: "Transaction wallet does not match registered voter wallet" });
    }

    // Step 4: Confirm VoteCast event in logs and verify candidateId matches
    const contract = getContract();
    const voteCastEvent = receipt.logs
      .map((log) => { try { return contract.interface.parseLog(log); } catch { return null; } })
      .find((e) => e && e.name === "VoteCast");

    if (!voteCastEvent) {
      return res.status(400).json({ message: "VoteCast event not found in transaction logs" });
    }

    // Verify the candidateId on-chain matches what was submitted
    const onChainCandidateId = Number(voteCastEvent.args.candidateId);
    if (onChainCandidateId !== Number(candidateId)) {
      return res.status(400).json({ message: "Candidate ID mismatch between submission and blockchain" });
    }

    // Step 5: Update MongoDB
    user.hasVoted = true;
    user.votedAt = new Date();
    await user.save();

    return res.json({
      message: "Vote recorded successfully on blockchain and database",
      txHash,
      votedAt: user.votedAt,
    });
  } catch (error) {
    console.error("Vote record error:", error);
    return res.status(500).json({ message: "Server error during vote recording" });
  }
});

// ─────────────────────────────────────────────
// GET /api/votes/results
// Public — no auth required
// Reads live vote counts from blockchain
// ─────────────────────────────────────────────
router.get("/results", async (req, res) => {
  try {
    const contract = getContract();
    const candidates = await contract.getAllCandidates();

    const formatted = candidates.map((c) => ({
      id: Number(c.id),
      name: c.name,
      partyName: c.partyName,
      partySymbol: c.partySymbol,
      voteCount: Number(c.voteCount),
    }));

    const totalVotes = formatted.reduce((sum, c) => sum + c.voteCount, 0);

    // Try to get winner (only works in Completed phase)
    let winner = null;
    try {
      const w = await contract.getWinner();
      winner = {
        id: Number(w.id),
        name: w.name,
        partyName: w.partyName,
        voteCount: Number(w.voteCount),
      };
    } catch {
      // Not in Completed phase — winner not available yet
    }

    const phase = await contract.getCurrentPhaseString();

    return res.json({ candidates: formatted, totalVotes, winner, phase });
  } catch (error) {
    console.error("Results error:", error);
    return res.status(500).json({ message: "Server error fetching results" });
  }
});

module.exports = router;
