const express = require("express");
const router = express.Router();
const adminAuth = require("../middleware/adminAuth");
const upload = require("../middleware/upload");
const User = require("../models/User");
const Candidate = require("../models/Candidate");
const Election = require("../models/Election");
const { getContract } = require("../utils/blockchain");
const { encodeFace } = require("../utils/faceService");

// All routes require admin JWT
router.use(adminAuth);

// ─────────────────────────────────────────────
// GET /api/admin/voters
// Paginated list of all voters
// ─────────────────────────────────────────────
router.get("/voters", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const search = req.query.search || "";

    const query = search
      ? {
          $or: [
            { fullName: { $regex: search, $options: "i" } },
            { voterID: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const total = await User.countDocuments({ ...query, role: "voter" });
    const voters = await User.find({ ...query, role: "voter" })
      .select("-password -faceEncoding")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return res.json({ voters, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Get voters error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/admin/voters/:id
// Remove voter from MongoDB (not from blockchain)
// ─────────────────────────────────────────────
router.delete("/voters/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "Voter not found" });
    return res.json({ message: "Voter removed from database" });
  } catch (error) {
    console.error("Delete voter error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// POST /api/admin/voters/:id/approve
// Set isVerified: true
// ─────────────────────────────────────────────
router.post("/voters/:id/approve", async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    ).select("-password -faceEncoding");

    if (!user) return res.status(404).json({ message: "Voter not found" });
    return res.json({ message: "Voter approved", user });
  } catch (error) {
    console.error("Approve voter error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// POST /api/admin/voters/:id/register-onchain
// Register voter wallet on Ethereum smart contract
// ─────────────────────────────────────────────
router.post("/voters/:id/register-onchain", async (req, res) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) {
      return res.status(400).json({ message: "walletAddress is required" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Voter not found" });
    if (!user.isVerified) {
      return res.status(400).json({ message: "Voter must be approved before registering on-chain" });
    }

    // Call smart contract
    const contract = getContract();
    const tx = await contract.registerVoter(walletAddress);
    const receipt = await tx.wait();

    // Save wallet address to MongoDB
    user.walletAddress = walletAddress;
    await user.save();

    return res.json({
      message: "Voter registered on blockchain",
      txHash: receipt.hash,
      walletAddress,
    });
  } catch (error) {
    console.error("Register on-chain error:", error);
    // Handle contract revert messages
    if (error.reason) {
      return res.status(400).json({ message: error.reason });
    }
    return res.status(500).json({ message: "Blockchain transaction failed", error: error.message });
  }
});

// ─────────────────────────────────────────────
// POST /api/admin/voters/:id/face
// Upload and encode voter face photo
// ─────────────────────────────────────────────
router.post("/voters/:id/face", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "Voter not found" });

    // Send image buffer to Python face service
    const result = await encodeFace(req.file.buffer, req.file.originalname);

    if (!result.success) {
      return res.status(400).json({ message: result.message });
    }

    // Store encoding in MongoDB
    user.faceEncoding = result.encoding;
    user.faceImagePath = `face_${user._id}_${Date.now()}`;
    await user.save();

    return res.json({
      message: "Face registered successfully",
      encodingLength: result.encoding.length,
    });
  } catch (error) {
    console.error("Face upload error:", error);
    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({ message: "Face recognition service is unavailable" });
    }
    return res.status(500).json({ message: "Server error during face registration" });
  }
});

// ─────────────────────────────────────────────
// POST /api/admin/candidates
// Add candidate to contract + MongoDB
// ─────────────────────────────────────────────
router.post("/candidates", async (req, res) => {
  try {
    const { name, partyName, partySymbol } = req.body;
    if (!name || !partyName) {
      return res.status(400).json({ message: "name and partyName are required" });
    }

    const contract = getContract();
    const tx = await contract.addCandidate(name, partyName, partySymbol || "");
    const receipt = await tx.wait();

    // Get the onChainId from emitted event
    const event = receipt.logs
      .map((log) => { try { return contract.interface.parseLog(log); } catch { return null; } })
      .find((e) => e && e.name === "CandidateAdded");

    const onChainId = event ? Number(event.args.candidateId) : null;

    const candidate = await Candidate.create({ name, partyName, partySymbol: partySymbol || "", onChainId });

    return res.status(201).json({
      message: "Candidate added",
      candidate,
      txHash: receipt.hash,
    });
  } catch (error) {
    console.error("Add candidate error:", error);
    if (error.reason) return res.status(400).json({ message: error.reason });
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ─────────────────────────────────────────────
// GET /api/admin/candidates
// ─────────────────────────────────────────────
router.get("/candidates", async (req, res) => {
  try {
    const candidates = await Candidate.find().sort({ onChainId: 1 });
    return res.json({ candidates });
  } catch (error) {
    return res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/admin/candidates/:id
// Remove from contract + MongoDB
// ─────────────────────────────────────────────
router.delete("/candidates/:id", async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: "Candidate not found" });

    const contract = getContract();
    const tx = await contract.removeCandidate(candidate.onChainId);
    const receipt = await tx.wait();

    await Candidate.findByIdAndDelete(req.params.id);

    return res.json({ message: "Candidate removed", txHash: receipt.hash });
  } catch (error) {
    console.error("Delete candidate error:", error);
    if (error.reason) return res.status(400).json({ message: error.reason });
    return res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// POST /api/admin/election/phase
// Advance election phase on contract + MongoDB
// ─────────────────────────────────────────────
router.post("/election/phase", async (req, res) => {
  try {
    const { phase } = req.body; // "voting" or "completed"
    const phaseMap = { voting: 1, completed: 2 };

    if (!phaseMap.hasOwnProperty(phase)) {
      return res.status(400).json({ message: "phase must be 'voting' or 'completed'" });
    }

    const contract = getContract();
    const tx = await contract.changePhase(phaseMap[phase]);
    const receipt = await tx.wait();

    await Election.findOneAndUpdate(
      {},
      { phase },
      { upsert: true, new: true, sort: { createdAt: -1 } }
    );

    return res.json({ message: `Phase changed to ${phase}`, newPhase: phase, txHash: receipt.hash });
  } catch (error) {
    console.error("Change phase error:", error);
    if (error.reason) return res.status(400).json({ message: error.reason });
    return res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// GET /api/admin/election
// ─────────────────────────────────────────────
router.get("/election", async (req, res) => {
  try {
    const election = await Election.findOne().sort({ createdAt: -1 });
    const contract = getContract();
    const stats = await contract.getElectionStats();

    return res.json({
      election,
      onChain: {
        title: stats.title,
        phase: stats.phase,
        totalCandidates: Number(stats.numCandidates),
        totalVoters: Number(stats.numVoters),
        totalVotes: Number(stats.numVotes),
      },
    });
  } catch (error) {
    console.error("Get election error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

// ─────────────────────────────────────────────
// GET /api/admin/results
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

    let winner = null;
    try {
      const w = await contract.getWinner();
      winner = { id: Number(w.id), name: w.name, partyName: w.partyName, voteCount: Number(w.voteCount) };
    } catch {
      // getWinner only works in Completed phase — ignore error
    }

    return res.json({ candidates: formatted, winner, totalVotes });
  } catch (error) {
    console.error("Get results error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
