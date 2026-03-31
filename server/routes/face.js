const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const User = require("../models/User");
const { verifyFace } = require("../utils/faceService");

// ─────────────────────────────────────────────
// POST /api/face/verify
// Protected — voter must be logged in
// Body: { liveImageBase64: "data:image/jpeg;base64,..." }
// Flow: get stored encoding from MongoDB → send to Python → return result
// If match: issue short-lived faceVerifiedToken (5 min) for OTP step
// ─────────────────────────────────────────────
router.post("/verify", auth, async (req, res) => {
  try {
    const { liveImageBase64 } = req.body;

    if (!liveImageBase64) {
      return res.status(400).json({ message: "liveImageBase64 is required" });
    }

    // Get voter with face encoding (excluded by default in auth middleware)
    const user = await User.findById(req.user._id).select("+faceEncoding");

    if (!user.faceEncoding || user.faceEncoding.length !== 128) {
      return res.status(400).json({
        message: "Face not registered for this voter. Contact admin to register your face.",
      });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Account not approved by admin yet" });
    }

    // Forward to Python service — stored encoding never sent to frontend
    const result = await verifyFace(liveImageBase64, user.faceEncoding);

    if (!result.success) {
      return res.status(500).json({ message: result.message || "Face service error" });
    }

    // If face matched, issue a short-lived faceVerifiedToken
    // Frontend must include this token when calling POST /api/otp/send
    let faceVerifiedToken = null;
    if (result.match) {
      faceVerifiedToken = jwt.sign(
        { userId: user._id.toString(), faceVerified: true },
        process.env.JWT_SECRET,
        { expiresIn: "5m" }
      );
    }

    return res.json({
      match: result.match,
      confidence: result.confidence,
      distance: result.distance,
      message: result.message,
      faceVerifiedToken: faceVerifiedToken, // null if no match
    });
  } catch (error) {
    console.error("Face verify error:", error);
    if (error.code === "ECONNREFUSED") {
      return res.status(503).json({ message: "Face recognition service is unavailable. Please try again." });
    }
    return res.status(500).json({ message: "Server error during face verification" });
  }
});

module.exports = router;
