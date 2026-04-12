const Election = require("../models/Election");

/**
 * Middleware to load election context from URL parameter
 * Attaches election object to req.election
 */
async function electionContext(req, res, next) {
  try {
    const { electionId } = req.params;

    if (!electionId) {
      return res.status(400).json({ message: "Election ID is required" });
    }

    const election = await Election.findById(electionId);

    if (!election) {
      return res.status(404).json({ message: "Election not found" });
    }

    // Attach election to request object
    req.election = election;
    next();
  } catch (error) {
    console.error("Election context middleware error:", error);
    return res.status(500).json({ message: "Failed to load election context" });
  }
}

/**
 * Middleware to check if election is active
 */
function requireActiveElection(req, res, next) {
  if (!req.election) {
    return res.status(500).json({ message: "Election context not loaded" });
  }

  if (!req.election.isActive) {
    return res.status(403).json({ message: "This election is not active" });
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
      return res.status(500).json({ message: "Election context not loaded" });
    }

    if (!allowedPhases.includes(req.election.phase)) {
      return res.status(403).json({
        message: `This action is only allowed during ${allowedPhases.join(" or ")} phase`,
        currentPhase: req.election.phase,
      });
    }

    next();
  };
}

module.exports = {
  electionContext,
  requireActiveElection,
  requirePhase,
};
