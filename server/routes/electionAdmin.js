const express = require("express");
const router = express.Router({ mergeParams: true });
const Candidate = require("../models/Candidate");
const User = require("../models/User");
const adminAuth = require("../middleware/adminAuth");
const { electionContext, requirePhase, requireElectionOwnership } = require("../middleware/electionContext");
const blockchainService = require("../utils/blockchain");
const multer = require("multer");
const axios = require("axios");

// Apply election context to all routes
router.use(electionContext);

// Apply ownership check to all admin routes
router.use(adminAuth, requireElectionOwnership);

/**
 * @route   GET /api/elections/:electionId/admin
 * @desc    Get election admin dashboard data
 * @access  Admin only (must own election)
 */
router.get("/", async (req, res) => {
  try {
    const election = req.election;

    // Get on-chain stats (only if contract deployed)
    let onChainStats = null;
    if (election.contractAddress) {
      try {
        const contract = blockchainService.getElectionContractReadOnly(
          election.contractAddress
        );
        onChainStats = await contract.getElectionStats();
      } catch (error) {
        // Silently fail - this is expected for elections with invalid/undeployed contracts
        // Uncomment below for debugging:
        // console.warn(`Failed to fetch on-chain stats for election ${election._id}:`, error.message);
      }
    }

    // Get off-chain stats
    const totalUsers = await User.countDocuments({ electionId: election._id });
    const verifiedUsers = await User.countDocuments({
      electionId: election._id,
      isVerified: true,
    });
    const votedUsers = await User.countDocuments({
      electionId: election._id,
      hasVoted: true,
    });
    const totalCandidates = await Candidate.countDocuments({
      electionId: election._id,
    });

    return res.json({
      election,
      stats: {
        offChain: {
          totalUsers,
          verifiedUsers,
          votedUsers,
          totalCandidates,
        },
        onChain: onChainStats ? {
          electionId: Number(onChainStats.id),
          phase: onChainStats.phase,
          numCandidates: Number(onChainStats.numCandidates),
          numVoters: Number(onChainStats.numVoters),
          numVotes: Number(onChainStats.numVotes),
        } : null,
      },
    });
  } catch (error) {
    console.error("Failed to fetch admin dashboard:", error);
    return res.status(500).json({
      message: "Failed to fetch admin dashboard",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/elections/:electionId/admin/candidates
 * @desc    Add candidate to election
 * @access  Admin only (registration phase only)
 */
router.post(
  "/candidates",
  requirePhase("registration"),
  async (req, res) => {
    try {
      const { name, partyName, partySymbol } = req.body;
      const election = req.election;

      if (!name || !partyName) {
        return res
          .status(400)
          .json({ message: "Candidate name and party name are required" });
      }

      // Check if election has a contract deployed
      if (!election.contractAddress) {
        return res.status(400).json({
          message: "Election contract not deployed yet. Please deploy the election contract first.",
        });
      }

      // Add candidate to blockchain
      const contract = blockchainService.getElectionContract(
        election.contractAddress
      );
      const tx = await contract.addCandidate(name, partyName, partySymbol || "");
      const receipt = await tx.wait();

      // Get the candidate ID from blockchain
      const candidates = await contract.getAllCandidates();
      const newCandidate = candidates[candidates.length - 1];

      // Store in MongoDB
      const candidate = await Candidate.create({
        electionId: election._id,
        name,
        partyName,
        partySymbol: partySymbol || "",
        onChainId: Number(newCandidate.id),
        contractAddress: election.contractAddress,
      });

      return res.status(201).json({
        message: "Candidate added successfully",
        candidate,
        txHash: receipt.hash,
      });
    } catch (error) {
      console.error("Failed to add candidate:", error);
      return res.status(500).json({
        message: "Failed to add candidate",
        error: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/elections/:electionId/admin/candidates
 * @desc    Get all candidates for election
 * @access  Admin only
 */
router.get("/candidates", async (req, res) => {
  try {
    const candidates = await Candidate.find({
      electionId: req.election._id,
    }).sort({ onChainId: 1 });

    return res.json({
      count: candidates.length,
      candidates,
    });
  } catch (error) {
    console.error("Failed to fetch candidates:", error);
    return res.status(500).json({
      message: "Failed to fetch candidates",
      error: error.message,
    });
  }
});

/**
 * @route   DELETE /api/elections/:electionId/admin/candidates/:candidateId
 * @desc    Remove candidate from election
 * @access  Admin only (registration phase only)
 */
router.delete(
  "/candidates/:candidateId",
  requirePhase("registration"),
  async (req, res) => {
    try {
      const candidate = await Candidate.findOne({
        _id: req.params.candidateId,
        electionId: req.election._id,
      });

      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }

      // Remove from blockchain
      const contract = blockchainService.getElectionContract(
        req.election.contractAddress
      );
      const tx = await contract.removeCandidate(candidate.onChainId);
      await tx.wait();

      // Remove from MongoDB
      await candidate.deleteOne();

      return res.json({
        message: "Candidate removed successfully",
      });
    } catch (error) {
      console.error("Failed to remove candidate:", error);
      return res.status(500).json({
        message: "Failed to remove candidate",
        error: error.message,
      });
    }
  }
);

/**
 * @route   GET /api/elections/:electionId/admin/voters
 * @desc    Get all voters for election
 * @access  Admin only
 */
router.get("/voters", async (req, res) => {
  try {
    const { page = 1, limit = 20, isVerified, hasVoted } = req.query;

    const filter = { electionId: req.election._id };
    if (isVerified !== undefined) filter.isVerified = isVerified === "true";
    if (hasVoted !== undefined) filter.hasVoted = hasVoted === "true";

    const voters = await User.find(filter)
      .select("-password -faceEncoding")
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    return res.json({
      voters,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch voters:", error);
    return res.status(500).json({
      message: "Failed to fetch voters",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/elections/:electionId/admin/voters/:voterId/approve
 * @desc    Approve voter
 * @access  Admin only
 */
router.post("/voters/:voterId/approve", async (req, res) => {
  try {
    const voter = await User.findOne({
      _id: req.params.voterId,
      electionId: req.election._id,
    });

    if (!voter) {
      return res.status(404).json({ message: "Voter not found" });
    }

    voter.isVerified = true;
    await voter.save();

    return res.json({
      message: "Voter approved successfully",
      voter: {
        _id: voter._id,
        fullName: voter.fullName,
        email: voter.email,
        isVerified: voter.isVerified,
      },
    });
  } catch (error) {
    console.error("Failed to approve voter:", error);
    return res.status(500).json({
      message: "Failed to approve voter",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/elections/:electionId/admin/voters/:voterId/register-onchain
 * @desc    Register voter wallet on blockchain
 * @access  Admin only (registration phase only)
 */
router.post(
  "/voters/:voterId/register-onchain",
  requirePhase("registration"),
  async (req, res) => {
    try {
      const { walletAddress } = req.body;

      if (!walletAddress) {
        return res.status(400).json({ message: "Wallet address is required" });
      }

      const voter = await User.findOne({
        _id: req.params.voterId,
        electionId: req.election._id,
      });

      if (!voter) {
        return res.status(404).json({ message: "Voter not found" });
      }

      if (!voter.isVerified) {
        return res
          .status(403)
          .json({ message: "Voter must be verified before blockchain registration" });
      }

      // Register on blockchain
      const contract = blockchainService.getElectionContract(
        req.election.contractAddress
      );
      const tx = await contract.registerVoter(walletAddress);
      const receipt = await tx.wait();

      // Update MongoDB
      voter.walletAddress = walletAddress;
      await voter.save();

      return res.json({
        message: "Voter registered on blockchain successfully",
        walletAddress,
        txHash: receipt.hash,
      });
    } catch (error) {
      console.error("Failed to register voter on blockchain:", error);
      return res.status(500).json({
        message: "Failed to register voter on blockchain",
        error: error.message,
      });
    }
  }
);

/**
 * @route   POST /api/elections/:electionId/admin/voters/:voterId/face
 * @desc    Upload and register voter face
 * @access  Admin only
 */
const upload = multer({ storage: multer.memoryStorage() });

router.post(
  "/voters/:voterId/face",
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Face image is required" });
      }

      const voter = await User.findOne({
        _id: req.params.voterId,
        electionId: req.election._id,
      });

      if (!voter) {
        return res.status(404).json({ message: "Voter not found" });
      }

      // Send to Python face service for encoding
      const formData = new FormData();
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      formData.append("image", blob, req.file.originalname);

      const response = await axios.post(
        `${process.env.PYTHON_FACE_API_URL}/encode`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (!response.data.success) {
        return res.status(400).json({
          message: "Face encoding failed",
          error: response.data.message,
        });
      }

      // Store encoding in MongoDB
      voter.faceEncoding = response.data.encoding;
      voter.faceImagePath = `faces/${voter._id}.jpg`; // Placeholder
      await voter.save();

      return res.json({
        message: "Face registered successfully",
        confidence: response.data.confidence || null,
      });
    } catch (error) {
      console.error("Failed to register face:", error);
      return res.status(500).json({
        message: "Failed to register face",
        error: error.message,
      });
    }
  }
);

/**
 * @route   POST /api/elections/:electionId/admin/phase
 * @desc    Change election phase
 * @access  Admin only
 */
router.post("/phase", async (req, res) => {
  try {
    const { phase } = req.body;

    if (!["registration", "voting", "completed"].includes(phase)) {
      return res.status(400).json({ message: "Invalid phase" });
    }

    const election = req.election;

    // Change phase on blockchain
    const contract = blockchainService.getElectionContract(
      election.contractAddress
    );

    const phaseMap = { registration: 0, voting: 1, completed: 2 };
    const tx = await contract.changePhase(phaseMap[phase]);
    await tx.wait();

    // Update MongoDB
    election.phase = phase;
    await election.save();

    return res.json({
      message: "Election phase changed successfully",
      phase: election.phase,
    });
  } catch (error) {
    console.error("Failed to change phase:", error);
    return res.status(500).json({
      message: "Failed to change phase",
      error: error.message,
    });
  }
});

module.exports = router;
