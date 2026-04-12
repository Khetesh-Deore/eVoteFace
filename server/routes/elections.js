const express = require("express");
const router = express.Router();
const Election = require("../models/Election");
const User = require("../models/User");
const Candidate = require("../models/Candidate");
const adminAuth = require("../middleware/adminAuth");
const blockchainService = require("../utils/blockchain");
const { mapBlockchainError, mapDatabaseError } = require("../utils/errorMapper");

/**
 * @route   POST /api/elections
 * @desc    Create new election (deploys smart contract via factory)
 * @access  Admin only
 */
router.post("/", adminAuth, async (req, res) => {
  let blockchainResult = null;
  
  try {
    const { title, description, startTime, endTime } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Election title is required" });
    }

    // Step 1: Deploy smart contract via factory
    console.log("Deploying election contract...");
    
    try {
      blockchainResult = await blockchainService.deployElectionContract(
        title,
        description || ""
      );
      
      // CRITICAL: Verify deployment actually succeeded
      if (!blockchainResult || !blockchainResult.contractAddress) {
        throw new Error("Contract deployment failed: No contract address returned");
      }
      
      console.log(`✅ Contract deployed at: ${blockchainResult.contractAddress}`);
      
      // CRITICAL: Verify contract is actually deployed and callable
      console.log("Verifying contract deployment...");
      try {
        const contract = blockchainService.getElectionContractReadOnly(
          blockchainResult.contractAddress
        );
        
        // Try to call a read function to verify contract is valid
        const stats = await contract.getElectionStats();
        
        // Verify the contract has the expected data
        if (stats.title !== title) {
          throw new Error(`Contract verification failed: Title mismatch (expected "${title}", got "${stats.title}")`);
        }
        
        // Verify contract is in registration phase
        if (stats.phase !== 0) { // 0 = registration phase
          throw new Error(`Contract verification failed: Expected registration phase, got phase ${stats.phase}`);
        }
        
        console.log(`✅ Contract verified: Title="${stats.title}", Phase=${stats.phase}`);
        
      } catch (verificationError) {
        console.error("❌ Contract verification failed:", verificationError);
        throw new Error(`Contract deployed but verification failed: ${verificationError.message}`);
      }
      
    } catch (blockchainError) {
      console.error("❌ Contract deployment failed:", blockchainError);
      
      // Contract deployment or verification failed - no cleanup needed
      return res.status(500).json({
        message: "Failed to deploy election contract",
        error: mapBlockchainError(blockchainError),
        details: "Election was not created. Please try again.",
      });
    }

    // Step 2: Save election record to MongoDB (only if deployment succeeded)
    // CRITICAL: Wrap DB operation in try-catch to handle atomicity issues
    try {
      const election = await Election.create({
        title,
        description: description || "",
        contractAddress: blockchainResult.contractAddress,
        factoryTxHash: blockchainResult.txHash,
        deploymentStatus: "deployed",
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
          deploymentStatus: "deployed",
          isActive: election.isActive,
          createdAt: election.createdAt,
        },
        blockchain: {
          contractAddress: blockchainResult.contractAddress,
          electionId: blockchainResult.electionId,
          txHash: blockchainResult.txHash,
        },
      });
      
    } catch (dbError) {
      // CRITICAL: Contract deployed but DB save failed
      // This is an orphaned contract situation - log for manual recovery
      console.error("🚨 CRITICAL ATOMICITY FAILURE 🚨");
      console.error("Contract deployed on blockchain but database save failed!");
      console.error({
        contractAddress: blockchainResult.contractAddress,
        factoryTxHash: blockchainResult.txHash,
        electionTitle: title,
        adminId: req.admin._id,
        timestamp: new Date().toISOString(),
        dbError: dbError.message,
        dbStack: dbError.stack,
      });
      
      // Return error with contract details for admin to manually recover
      return res.status(500).json({
        message: "Contract deployed successfully but database save failed",
        error: mapDatabaseError(dbError),
        recovery: {
          contractAddress: blockchainResult.contractAddress,
          factoryTxHash: blockchainResult.txHash,
          electionTitle: title,
          instructions: "Save this information and contact support to recover the election",
        },
        technicalDetails: process.env.NODE_ENV === 'development' ? dbError.message : undefined,
      });
    }
    
  } catch (error) {
    // Unexpected error in outer try block
    console.error("Failed to create election:", error);
    
    // If we have a deployed contract but hit an unexpected error, log it
    if (blockchainResult && blockchainResult.contractAddress) {
      console.error("🚨 CRITICAL: Unexpected error after contract deployment");
      console.error({
        contractAddress: blockchainResult.contractAddress,
        error: error.message,
      });
    }
    
    return res.status(500).json({
      message: "Failed to create election",
      error: error.message,
      contractAddress: blockchainResult?.contractAddress || null,
    });
  }
});

/**
 * @route   GET /api/elections
 * @desc    Get all elections with pagination
 * @access  Public
 */
router.get("/", async (req, res) => {
  try {
    const { isActive, phase, admin, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === "true";
    if (phase) filter.phase = phase;
    if (admin) filter.admin = admin;

    const skip = (page - 1) * limit;
    const total = await Election.countDocuments(filter);

    const elections = await Election.find(filter)
      .populate("admin", "fullName email")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    return res.json({
      count: elections.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
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

    // Get on-chain stats (only if contract deployed)
    let onChainStats = null;
    if (election.contractAddress) {
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
        // Silently fail - this is expected for elections with invalid/undeployed contracts
        // Uncomment below for debugging:
        // console.warn(`Failed to fetch on-chain stats for election ${election._id}:`, error.message);
      }
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

/**
 * @route   POST /api/elections/recover
 * @desc    Recover orphaned contract (when contract deployed but DB save failed)
 * @access  Admin only
 */
router.post("/recover", adminAuth, async (req, res) => {
  try {
    const { title, description, contractAddress, factoryTxHash, startTime, endTime } = req.body;

    if (!title || !contractAddress) {
      return res.status(400).json({ 
        message: "Title and contract address are required for recovery" 
      });
    }

    // Verify contract exists and is valid
    let contractStats;
    try {
      const contract = blockchainService.getElectionContractReadOnly(contractAddress);
      contractStats = await contract.getElectionStats();
      
      console.log(`✅ Contract verified: ${contractStats.title}`);
      
      // Verify contract has expected structure
      if (!contractStats.title || contractStats.title === "") {
        throw new Error("Contract has no title - may not be a valid election contract");
      }
      
      // Warn if title mismatch (but allow recovery)
      if (contractStats.title !== title) {
        console.warn(`⚠️  Title mismatch: DB="${title}", Contract="${contractStats.title}"`);
      }
      
    } catch (error) {
      return res.status(400).json({
        message: "Invalid contract address or contract not found on blockchain",
        error: error.message,
        details: "Please verify the contract address is correct and deployed on the correct network"
      });
    }
    
    // Check if contract already registered
    const existing = await Election.findOne({ contractAddress });
    if (existing) {
      return res.status(400).json({
        message: "This contract is already registered",
        election: existing,
      });
    }

    // Create election record for orphaned contract
    const election = await Election.create({
      title,
      description: description || "",
      contractAddress,
      factoryTxHash: factoryTxHash || null,
      deploymentStatus: "deployed",
      admin: req.admin._id,
      createdBy: req.admin._id,
      isActive: true,
      startTime: startTime ? new Date(startTime) : undefined,
      endTime: endTime ? new Date(endTime) : undefined,
    });

    console.log(`✅ Orphaned contract recovered: ${election._id}`);

    return res.status(201).json({
      message: "Orphaned contract recovered successfully",
      election: {
        _id: election._id,
        title: election.title,
        description: election.description,
        phase: election.phase,
        contractAddress: election.contractAddress,
        factoryTxHash: election.factoryTxHash,
        deploymentStatus: "deployed",
        isActive: election.isActive,
        createdAt: election.createdAt,
      },
    });
  } catch (error) {
    console.error("Failed to recover orphaned contract:", error);
    return res.status(500).json({
      message: "Failed to recover orphaned contract",
      error: error.message,
    });
  }
});

module.exports = router;
