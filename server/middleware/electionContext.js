const Election = require("../models/Election");
const mongoose = require("mongoose");

/**
 * Middleware to load election context from URL parameter
 * Attaches election object to req.election
 */
async function electionContext(req, res, next) {
  try {
    const { electionId } = req.params;

    // Validate electionId is provided
    if (!electionId) {
      return res.status(400).json({ 
        message: "Election ID is required",
        error: "Missing electionId parameter in URL"
      });
    }

    // Validate electionId format (MongoDB ObjectId)
    if (!mongoose.Types.ObjectId.isValid(electionId)) {
      return res.status(400).json({ 
        message: "Invalid election ID format",
        error: "Election ID must be a valid MongoDB ObjectId"
      });
    }

    // Fetch election from database
    const election = await Election.findById(electionId);

    if (!election) {
      return res.status(404).json({ 
        message: "Election not found",
        electionId: electionId
      });
    }

    // Attach election to request object
    req.election = election;
    next();
    
  } catch (error) {
    // Handle specific MongoDB errors
    if (error.name === "CastError") {
      return res.status(400).json({ 
        message: "Invalid election ID format",
        error: error.message
      });
    }
    
    // Handle database connection errors
    if (error.name === "MongoNetworkError" || error.name === "MongoTimeoutError") {
      console.error("Database connection error in electionContext:", error);
      return res.status(503).json({ 
        message: "Database temporarily unavailable",
        error: "Please try again in a moment"
      });
    }
    
    // Generic error fallback
    console.error("Election context middleware error:", error);
    return res.status(500).json({ 
      message: "Failed to load election context",
      error: error.message
    });
  }
}

/**
 * Middleware to check if election is active
 */
function requireActiveElection(req, res, next) {
  if (!req.election) {
    return res.status(500).json({ 
      message: "Election context not loaded",
      error: "Internal server error - middleware order issue"
    });
  }

  if (!req.election.isActive) {
    return res.status(403).json({ 
      message: "This election is not active",
      electionId: req.election._id,
      electionTitle: req.election.title
    });
  }

  next();
}

/**
 * Middleware to check election phase
 * @param {string|string[]} allowedPhases - Phase(s) allowed for this route
 */
function requirePhase(...allowedPhases) {
  return (req, res, next) => {
    if (!req.election) {
      return res.status(500).json({ 
        message: "Election context not loaded",
        error: "Internal server error - middleware order issue"
      });
    }

    if (!allowedPhases.includes(req.election.phase)) {
      return res.status(403).json({
        message: `This action is only allowed during ${allowedPhases.join(" or ")} phase`,
        currentPhase: req.election.phase,
        allowedPhases: allowedPhases,
        electionId: req.election._id,
      });
    }

    next();
  };
}

/**
 * Middleware to check if admin owns this election
 * Must be used after adminAuth and electionContext
 */
function requireElectionOwnership(req, res, next) {
  if (!req.election) {
    return res.status(500).json({ 
      message: "Election context not loaded",
      error: "Internal server error - middleware order issue"
    });
  }

  if (!req.admin) {
    return res.status(500).json({ 
      message: "Admin authentication not loaded",
      error: "Internal server error - middleware order issue"
    });
  }

  if (req.election.admin.toString() !== req.admin._id.toString()) {
    return res.status(403).json({
      message: "You are not authorized to modify this election",
      electionId: req.election._id,
      electionTitle: req.election.title,
      electionAdmin: req.election.admin,
      yourAdminId: req.admin._id
    });
  }

  next();
}

module.exports = {
  electionContext,
  requireActiveElection,
  requirePhase,
  requireElectionOwnership,
};
