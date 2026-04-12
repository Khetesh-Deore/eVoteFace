const express = require("express");
const router = express.Router({ mergeParams: true });
const User = require("../models/User");
const auth = require("../middleware/auth");
const { electionContext } = require("../middleware/electionContext");
const blockchainService = require("../utils/blockchain");

// Apply election context to all routes
router.use(electionContext);

/**
 * @route   GET /api/elections/:electionId/voters/status
 * @desc    Get voter status for this election
 * @access  Voter only
 */
router.get("/status", auth, async (req, res) => {
  try {
    const election = req.election;
    const voter = await User.findOne({
      _id: req.user._id,
      electionId: election._id,
    }).select("-password -faceEncoding");

    if (!voter) {
      return res.json({
        registered: false,
        message: "You are not registered for this election",
      });
    }

    // Check blockchain registration status (only if contract deployed)
    let onChainStatus = null;
    if (voter.walletAddress && election.contractAddress) {
      try {
        const contract = blockchainService.getElectionContractReadOnly(
          election.contractAddress
        );
        const status = await contract.getVoterStatus(voter.walletAddress);
        onChainStatus = {
          isRegistered: status.isRegistered,
          hasVoted: status.hasVoted,
          votedAt: status.votedAt > 0 ? Number(status.votedAt) : null,
        };
      } catch (error) {
        // Silently fail - this is expected for elections with invalid/undeployed contracts
        // Uncomment below for debugging:
        // console.warn(`Failed to fetch on-chain status for voter ${voter._id}:`, error.message);
      }
    }

    return res.json({
      registered: true,
      voter: {
        _id: voter._id,
        fullName: voter.fullName,
        email: voter.email,
        voterID: voter.voterID,
        walletAddress: voter.walletAddress,
        isVerified: voter.isVerified,
        hasVoted: voter.hasVoted,
        votedAt: voter.votedAt,
        faceRegistered: voter.faceEncoding && voter.faceEncoding.length > 0,
      },
      election: {
        _id: election._id,
        title: election.title,
        phase: election.phase,
      },
      onChain: onChainStatus,
    });
  } catch (error) {
    console.error("Failed to fetch voter status:", error);
    return res.status(500).json({
      message: "Failed to fetch voter status",
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/elections/:electionId/voters/wallet
 * @desc    Register wallet address for voter
 * @access  Voter only
 */
router.post("/wallet", auth, async (req, res) => {
  try {
    const { walletAddress } = req.body;

    if (!walletAddress) {
      return res.status(400).json({ message: "Wallet address is required" });
    }

    const election = req.election;
    const voter = await User.findOne({
      _id: req.user._id,
      electionId: election._id,
    });

    if (!voter) {
      return res
        .status(404)
        .json({ message: "You are not registered for this election" });
    }

    // Check if wallet is already registered by another voter
    const existingWallet = await User.findOne({
      electionId: election._id,
      walletAddress: walletAddress,
      _id: { $ne: voter._id },
    });

    if (existingWallet) {
      return res.status(400).json({
        message: "This wallet address is already registered by another voter",
      });
    }

    voter.walletAddress = walletAddress;
    await voter.save();

    return res.json({
      message: "Wallet address saved successfully",
      walletAddress: voter.walletAddress,
    });
  } catch (error) {
    console.error("Failed to save wallet address:", error);
    return res.status(500).json({
      message: "Failed to save wallet address",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/elections/:electionId/voters/profile
 * @desc    Get voter profile for this election
 * @access  Voter only
 */
router.get("/profile", auth, async (req, res) => {
  try {
    const voter = await User.findOne({
      _id: req.user._id,
      electionId: req.election._id,
    }).select("-password -faceEncoding");

    if (!voter) {
      return res
        .status(404)
        .json({ message: "You are not registered for this election" });
    }

    return res.json({
      voter,
      election: {
        _id: req.election._id,
        title: req.election.title,
        phase: req.election.phase,
      },
    });
  } catch (error) {
    console.error("Failed to fetch voter profile:", error);
    return res.status(500).json({
      message: "Failed to fetch voter profile",
      error: error.message,
    });
  }
});

module.exports = router;
