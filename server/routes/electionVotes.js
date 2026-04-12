const express = require("express");
const router = express.Router({ mergeParams: true });
const Candidate = require("../models/Candidate");
const User = require("../models/User");
const auth = require("../middleware/auth");
const { electionContext } = require("../middleware/electionContext");
const blockchainService = require("../utils/blockchain");

// Apply election context to all routes
router.use(electionContext);

/**
 * @route   POST /api/elections/:electionId/votes/record
 * @desc    Record vote after blockchain transaction
 * @access  Voter only
 */
router.post("/record", auth, async (req, res) => {
  try {
    const { candidateId, txHash, voteAuthToken } = req.body;

    if (!candidateId || !txHash) {
      return res
        .status(400)
        .json({ message: "Candidate ID and transaction hash are required" });
    }

    const election = req.election;
    
    // Check if contract is deployed
    if (!election.contractAddress) {
      return res.status(400).json({
        message: "Election contract not deployed yet",
        error: "Cannot record votes for undeployed election"
      });
    }
    
    const voter = await User.findOne({
      _id: req.user._id,
      electionId: election._id,
    });

    if (!voter) {
      return res
        .status(403)
        .json({ 
          message: "You are not registered for this election",
          electionId: election._id,
          electionTitle: election.title
        });
    }

    if (voter.hasVoted) {
      return res
        .status(403)
        .json({ message: "You have already voted in this election" });
    }

    // Verify transaction on blockchain
    const receipt = await blockchainService.getTransactionReceipt(txHash);

    if (!receipt) {
      return res
        .status(400)
        .json({ message: "Transaction not found on blockchain" });
    }

    if (receipt.status !== 1) {
      return res.status(400).json({ message: "Transaction failed on blockchain" });
    }

    // Verify transaction was to correct contract
    if (
      receipt.to.toLowerCase() !== election.contractAddress.toLowerCase()
    ) {
      return res
        .status(400)
        .json({ message: "Transaction was not to the correct contract" });
    }

    // Verify transaction was from voter's wallet
    if (
      receipt.from.toLowerCase() !== voter.walletAddress.toLowerCase()
    ) {
      return res
        .status(400)
        .json({ message: "Transaction was not from your registered wallet" });
    }

    // Update voter status
    voter.hasVoted = true;
    voter.votedAt = new Date();
    await voter.save();

    return res.json({
      message: "Vote recorded successfully",
      votedAt: voter.votedAt,
    });
  } catch (error) {
    console.error("Failed to record vote:", error);
    return res.status(500).json({
      message: "Failed to record vote",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/elections/:electionId/votes/results
 * @desc    Get election results
 * @access  Public
 */
router.get("/results", async (req, res) => {
  try {
    const election = req.election;

    // Handle undeployed contract gracefully
    if (!election.contractAddress) {
      return res.status(200).json({
        message: "Election contract is being deployed or not yet deployed",
        status: "pending_deployment",
        election: {
          _id: election._id,
          title: election.title,
          phase: election.phase,
          contractAddress: null,
        },
        results: [],
        winner: null,
        totalVotes: 0,
      });
    }

    // Get results from blockchain with error handling
    try {
      const contract = blockchainService.getElectionContractReadOnly(
        election.contractAddress
      );
      const candidates = await contract.getAllCandidates();

      const results = candidates.map((c) => ({
        id: Number(c.id),
        name: c.name,
        partyName: c.partyName,
        partySymbol: c.partySymbol,
        voteCount: Number(c.voteCount),
      }));

      // Get winner if election is completed
      let winner = null;
      if (election.phase === "completed") {
        try {
          const winnerData = await contract.getWinner();
          winner = {
            id: Number(winnerData.id),
            name: winnerData.name,
            partyName: winnerData.partyName,
            voteCount: Number(winnerData.voteCount),
          };
        } catch (error) {
          // Silently fail
        }
      }

      // Get total votes
      let totalVotes = 0;
      try {
        const stats = await contract.getElectionStats();
        totalVotes = Number(stats.numVotes);
      } catch (error) {
        // Silently fail
      }

      return res.json({
        status: "deployed",
        election: {
          _id: election._id,
          title: election.title,
          phase: election.phase,
          contractAddress: election.contractAddress,
        },
        results,
        winner,
        totalVotes,
      });
      
    } catch (contractError) {
      // Contract exists but is invalid/corrupted
      return res.status(200).json({
        message: "Election contract is invalid or corrupted",
        status: "contract_error",
        election: {
          _id: election._id,
          title: election.title,
          phase: election.phase,
          contractAddress: election.contractAddress,
        },
        results: [],
        winner: null,
        totalVotes: 0,
        error: contractError.message,
      });
    }
  } catch (error) {
    console.error("Failed to fetch results:", error);
    return res.status(500).json({
      message: "Failed to fetch results",
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/elections/:electionId/votes/candidates
 * @desc    Get all candidates for voting
 * @access  Public
 */
router.get("/candidates", async (req, res) => {
  try {
    const election = req.election;

    // Handle undeployed contract gracefully
    if (!election.contractAddress) {
      return res.status(200).json({
        message: "Election contract is being deployed or not yet deployed",
        status: "pending_deployment",
        election: {
          _id: election._id,
          title: election.title,
          phase: election.phase,
          contractAddress: null,
        },
        count: 0,
        candidates: [],
      });
    }

    // Get candidates from blockchain with error handling
    try {
      const contract = blockchainService.getElectionContractReadOnly(
        election.contractAddress
      );
      const onChainCandidates = await contract.getAllCandidates();

      const candidates = onChainCandidates.map((c) => ({
        id: Number(c.id),
        name: c.name,
        partyName: c.partyName,
        partySymbol: c.partySymbol,
        voteCount: Number(c.voteCount),
      }));

      return res.json({
        status: "deployed",
        election: {
          _id: election._id,
          title: election.title,
          phase: election.phase,
          contractAddress: election.contractAddress,
        },
        count: candidates.length,
        candidates,
      });
      
    } catch (contractError) {
      // Contract exists but is invalid/corrupted
      return res.status(200).json({
        message: "Election contract is invalid or corrupted",
        status: "contract_error",
        election: {
          _id: election._id,
          title: election.title,
          phase: election.phase,
          contractAddress: election.contractAddress,
        },
        count: 0,
        candidates: [],
        error: contractError.message,
      });
    }
  } catch (error) {
    console.error("Failed to fetch candidates:", error);
    return res.status(500).json({
      message: "Failed to fetch candidates",
      error: error.message,
    });
  }
});

module.exports = router;
