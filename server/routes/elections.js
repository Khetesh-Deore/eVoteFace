const express = require("express");
const router = express.Router();
const Election = require("../models/Election");
const User = require("../models/User");
const Candidate = require("../models/Candidate");
const adminAuth = require("../middleware/adminAuth");
const blockchainService = require("../utils/blockchain");

/**
 * @route   POST /api/elections
 * @desc    Create new election (deploys smart contract via factory)
 * @access  Admin only
 */
router.post("/", adminAuth, async (req, res) => {
  try {
    const { title, description, startTime, endTime } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Election title is required" });
    }

    // Step 1: Deploy smart contract via factory
    console.log("Deploying election contract...");
    const blockchainResult = await blockchainService.deployElectionContract(
      title,
      description || ""
    );

    // Step 2: Save election record to MongoDB
    const election = await Election.create({
      title,
      description: description || "",
      contractAddress: blockchainResult.contractAddress,
      factoryTxHash: blockchainResult.txHash,
      admin: req.admin._id,
      createdBy: req.admin._id,
      isActive: true,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
    });

    console.log(`✅ Election created: ${election._id}`);

    return res.status(201).json({
      message: "Election created successfully",
      election: {
        _id: election._id,
        title: election.title,
        description: election.description,
        phase: election.phase,
        contractAddress: election.contractAddress,
        factoryTxHash: election.factoryTxHash,
        isActive: election.isActive,
        createdAt: election.createdAt,
      },
      blockchain: {
        contractAddress: blockchainResult.contractAddress,
        electionId: blockchainResult.electionId,
        txHash: blockchainResult.txHash,
      },
    });
  } catch (error) {
    console.error("Failed to create election:", error);
    return res.status(500).json({
      message: "Failed to create election",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/elections
 * @desc    Get all elections
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    const { isActive, phase, admin } = req.query;

    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (phase) filter.phase = phase;
    if (admin) filter.admin = admin;

    const elections = await Election.find(filter)
      .populate("admin", "fullName email")
      .sort({ createdAt: -1 });

    return res.json({
      count: elections.length,
      elections,
    });
  } catch (error) {
    console.error("Failed to fetch elections:", error);
    return res.status(500).json({
      message: "Failed to fetch elections",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/elections/:electionId
 * @desc    Get election details with stats
 * @access  Public
 */
router.get("/:electionId", async (req, res) => {
  try {
    const election = await Election.findById(req.params.electionId).populate(
      "admin",
      "fullName email"
    );

    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    // Get on-chain stats
    let onChainStats = null;
    try {
      const contract = blockchainService.getElectionContractReadOnly(
        election.contractAddress
      );
      const stats = await contract.getElectionStats();
      onChainStats = {
        electionId: Number(stats.id),
        title: stats.title,
        description: stats.description,
        phase: stats.phase,
        numCandidates: Number(stats.numCandidates),
        numVoters: Number(stats.numVoters),
        numVotes: Number(stats.numVotes),
      };
    } catch (error) {
      console.warn("Failed to fetch on-chain stats:", error.message);
    }

    // Get off-chain stats
    const userCount = await User.countDocuments({ electionId: election._id });
    const candidateCount = await Candidate.countDocuments({
      electionId: election._id,
    });
    const verifiedVoters = await User.countDocuments({
      electionId: election._id,
      isVerified: true,
    });
    const votedCount = await User.countDocuments({
      electionId: election._id,
      hasVoted: true,
    });

    return res.json({
      election,
      stats: {
        offChain: {
          totalUsers: userCount,
          totalCandidates: candidateCount,
          verifiedVoters,
          votedCount,
        },
        onChain: onChainStats,
      },
    });
  } catch (error) {
    console.error("Failed to fetch election:", error);
    return res.status(500).json({
      message: "Failed to fetch election",
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/elections/:electionId
 * @desc    Update election details (only in registration phase)
 * @access  Admin only
 */
router.put("/:electionId", adminAuth, async (req, res) => {
  try {
    const election = await Election.findById(req.params.electionId);

    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    // Check if admin owns this election
    if (election.admin.toString() !== req.admin._id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to edit this election" });
    }

    // Only allow updates in registration phase
    if (election.phase !== "registration") {
      return res.status(403).json({
        message: "Election can only be edited during registration phase",
      });
    }

    const { title, description, startTime, endTime, isActive } = req.body;

    if (title) election.title = title;
    if (description !== undefined) election.description = description;
    if (startTime) election.startTime = new Date(startTime);
    if (endTime) election.endTime = new Date(endTime);
    if (isActive !== undefined) election.isActive = isActive;

    await election.save();

    return res.json({
      message: "Election updated successfully",
      election,
    });
  } catch (error) {
    console.error("Failed to update election:", error);
    return res.status(500).json({
      message: "Failed to update election",
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/elections/:electionId
 * @desc    Delete election (only if no votes cast and in registration phase)
 * @access  Admin only
 */
router.delete("/:electionId", adminAuth, async (req, res) => {
  try {
    const election = await Election.findById(req.params.electionId);

    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    // Check if admin owns this election
    if (election.admin.toString() !== req.admin._id.toString()) {
      return res
        .status(403)
        .json({ message: "You are not authorized to delete this election" });
    }

    // Only allow deletion in registration phase
    if (election.phase !== "registration") {
      return res.status(403).json({
        message: "Election can only be deleted during registration phase",
      });
    }

    // Check if any votes have been cast
    const votedCount = await User.countDocuments({
      electionId: election._id,
      hasVoted: true,
    });

    if (votedCount > 0) {
      return res.status(403).json({
        message: "Cannot delete election with votes already cast",
      });
    }

    // Delete related data
    await User.deleteMany({ electionId: election._id });
    await Candidate.deleteMany({ electionId: election._id });
    await election.deleteOne();

    return res.json({
      message: "Election and related data deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete election:", error);
    return res.status(500).json({
      message: "Failed to delete election",
      error: error.message,
    });
  }
});

module.exports = router;
