const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth");
const { otpLimiter } = require("../middleware/rateLimiter");
const OTP = require("../models/OTP");
const { sendOTP } = require("../utils/mailer");

// ─────────────────────────────────────────────
// POST /api/otp/send
// Protected — requires voter JWT + faceVerifiedToken
// Rate limited: max 3 requests per 10 minutes
// ─────────────────────────────────────────────
router.post("/send", auth, otpLimiter, async (req, res) => {
  try {
    const { faceVerifiedToken } = req.body;

    // Verify face token — proves voter passed face verification
    if (!faceVerifiedToken) {
      return res.status(400).json({ message: "Face verification required before OTP. Complete face scan first." });
    }

    let facePayload;
    try {
      facePayload = jwt.verify(faceVerifiedToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Face verification token is invalid or expired. Please scan your face again." });
    }

    if (!facePayload.faceVerified || facePayload.userId !== req.user._id.toString()) {
      return res.status(401).json({ message: "Invalid face verification token" });
    }

    if (!req.user.isVerified) {
      return res.status(403).json({ message: "Account not approved by admin" });
    }

    if (req.user.hasVoted) {
      return res.status(400).json({ message: "You have already voted" });
    }

    // Invalidate any existing unused OTPs for this email
    await OTP.deleteMany({ email: req.user.email, used: false });

    // Generate 6-digit OTP
    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await OTP.create({ email: req.user.email, code, expiresAt });

    // Send email
    await sendOTP(req.user.email, code);

    // Mask email for response: k***@gmail.com
    const [localPart, domain] = req.user.email.split("@");
    const maskedEmail = `${localPart[0]}***@${domain}`;

    return res.json({
      message: `OTP sent to ${maskedEmail}`,
      expiresIn: 300, // seconds
    });
  } catch (error) {
    console.error("OTP send error:", error);
    if (error.code === "EAUTH" || error.responseCode === 535) {
      return res.status(500).json({ message: "Email service authentication failed. Contact admin." });
    }
    return res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }
});

// ─────────────────────────────────────────────
// POST /api/otp/verify
// Protected — requires voter JWT
// Body: { code: "123456" }
// Returns: voteAuthToken (2 min) if correct
// ─────────────────────────────────────────────
router.post("/verify", auth, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || code.toString().length !== 6) {
      return res.status(400).json({ message: "A valid 6-digit OTP is required" });
    }

    if (req.user.hasVoted) {
      return res.status(400).json({ message: "You have already voted" });
    }

    // Find latest unused, unexpired OTP for this voter
    const otp = await OTP.findOne({
      email: req.user.email,
      used: false,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!otp) {
      return res.status(400).json({ message: "OTP expired or not found. Please request a new OTP." });
    }

    if (otp.code !== code.toString()) {
      return res.status(400).json({ message: "Incorrect OTP. Please check and try again." });
    }

    // Mark OTP as used
    otp.used = true;
    await otp.save();

    // Issue short-lived voteAuthToken (2 min)
    // Frontend must include this when calling POST /api/votes/record
    const voteAuthToken = jwt.sign(
      { userId: req.user._id.toString(), otpVerified: true },
      process.env.VOTE_AUTH_TOKEN_SECRET,
      { expiresIn: process.env.VOTE_AUTH_TOKEN_EXPIRES_IN || "2m" }
    );

    return res.json({
      verified: true,
      voteAuthToken,
      message: "OTP verified. You may now cast your vote.",
    });
  } catch (error) {
    console.error("OTP verify error:", error);
    return res.status(500).json({ message: "Server error during OTP verification" });
  }
});

module.exports = router;
