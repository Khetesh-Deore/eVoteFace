const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Admin = require("../models/Admin");
const auth = require("../middleware/auth");

// ── Helper: sign JWT ──
const signToken = (payload, expiresIn) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: expiresIn || process.env.JWT_EXPIRES_IN || "7d",
  });

// ─────────────────────────────────────────────
// POST /api/auth/register
// Public — voter self-registers, isVerified: false until admin approves
// ─────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const {
      fullName, email, password, voterID, aadharNumber,
      age, gender, address, state, city, pincode, contactNumber,
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !password || !voterID || !aadharNumber ||
        !age || !gender || !address || !state || !city || !pincode || !contactNumber) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (age < 18) {
      return res.status(400).json({ message: "Voter must be at least 18 years old" });
    }

    // Check duplicates
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) return res.status(409).json({ message: "Email already registered" });

    const existingVoterID = await User.findOne({ voterID });
    if (existingVoterID) return res.status(409).json({ message: "Voter ID already registered" });

    const existingAadhar = await User.findOne({ aadharNumber });
    if (existingAadhar) return res.status(409).json({ message: "Aadhar number already registered" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      fullName, email, password: hashedPassword, voterID, aadharNumber,
      age, gender, address, state, city, pincode, contactNumber,
      isVerified: false,
    });

    // Return user without password
    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.faceEncoding;

    return res.status(201).json({
      message: "Registration successful. Please wait for admin approval.",
      user: userObj,
    });
  } catch (error) {
    console.error("Register error:", error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({ message: `${field} already exists` });
    }
    return res.status(500).json({ message: "Server error during registration" });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/login
// Voter login with voterID + password
// ─────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { voterID, password } = req.body;

    if (!voterID || !password) {
      return res.status(400).json({ message: "Voter ID and password are required" });
    }

    const user = await User.findOne({ voterID });
    if (!user) return res.status(401).json({ message: "Invalid Voter ID or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid Voter ID or password" });

    const token = signToken({ id: user._id, role: user.role });

    const userObj = user.toObject();
    delete userObj.password;
    delete userObj.faceEncoding;

    return res.status(200).json({
      token,
      user: {
        id: userObj._id,
        fullName: userObj.fullName,
        email: userObj.email,
        voterID: userObj.voterID,
        role: userObj.role,
        isVerified: userObj.isVerified,
        hasVoted: userObj.hasVoted,
        walletAddress: userObj.walletAddress,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error during login" });
  }
});

// ─────────────────────────────────────────────
// POST /api/auth/admin/login
// Admin login with email + password
// ─────────────────────────────────────────────
router.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) return res.status(401).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid email or password" });

    const token = signToken({ id: admin._id, role: admin.role });

    return res.status(200).json({
      token,
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({ message: "Server error during admin login" });
  }
});

// ─────────────────────────────────────────────
// GET /api/auth/me
// Protected — returns current logged-in user or admin
// ─────────────────────────────────────────────
router.get("/me", auth, async (req, res) => {
  try {
    // req.user is set by auth middleware (works for both voter and admin)
    const isAdmin = req.user.role === "admin" || req.user.role === "superadmin";
    if (isAdmin) {
      return res.status(200).json({ user: req.user });
    }
    const user = await User.findById(req.user._id).select("-password -faceEncoding");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ user });
  } catch (error) {
    console.error("Get me error:", error);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
