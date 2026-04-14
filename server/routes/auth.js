const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth');

// Generate JWT token
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register new voter
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      voterID,
      aadharNumber,
      age,
      gender,
      address,
      state,
      city,
      pincode,
      contactNumber
    } = req.body;

    // Validate required fields
    if (!fullName || !email || !password || !voterID || !aadharNumber || !age || !gender || !address || !state || !city || !pincode || !contactNumber) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email }, { voterID }, { aadharNumber }]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ message: 'Email already registered' });
      }
      if (existingUser.voterID === voterID) {
        return res.status(400).json({ message: 'Voter ID already registered' });
      }
      if (existingUser.aadharNumber === aadharNumber) {
        return res.status(400).json({ message: 'Aadhar number already registered' });
      }
    }

    // Create new user
    const user = new User({
      fullName,
      email,
      password,
      voterID,
      aadharNumber,
      age,
      gender,
      address,
      state,
      city,
      pincode,
      contactNumber,
      role: 'voter'
    });

    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'Registration successful. Please wait for admin approval.',
      user: userResponse
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login voter
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { voterID, password } = req.body;

    // Validate input
    if (!voterID || !password) {
      return res.status(400).json({ message: 'Voter ID and password are required' });
    }

    // Find user
    const user = await User.findOne({ voterID });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user._id, user.role);

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   POST /api/auth/admin/login
// @desc    Login admin
// @access  Public
router.post('/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find admin
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(admin._id, admin.role);

    // Return admin without password
    const adminResponse = admin.toObject();
    delete adminResponse.password;

    res.json({
      token,
      admin: adminResponse
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    let user;

    if (req.user.role === 'admin' || req.user.role === 'superadmin') {
      user = await Admin.findById(req.user.id).select('-password');
    } else {
      user = await User.findById(req.user.id).select('-password');
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
