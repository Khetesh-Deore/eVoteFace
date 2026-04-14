const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const electionParticipationSchema = new mongoose.Schema({
  electionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election',
    required: true
  },
  walletAddress: {
    type: String,
    default: null
  },
  facePhotoUrl: {
    type: String,
    default: null
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isRegisteredOnChain: {
    type: Boolean,
    default: false
  },
  hasVoted: {
    type: Boolean,
    default: false
  },
  votedAt: {
    type: Date,
    default: null
  }
}, { _id: false });

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  voterID: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  aadharNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  age: {
    type: Number,
    required: true,
    min: 18
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other']
  },
  address: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  pincode: {
    type: String,
    required: true
  },
  contactNumber: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['voter', 'admin'],
    default: 'voter'
  },
  elections: [electionParticipationSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get election participation
userSchema.methods.getElectionParticipation = function(electionId) {
  return this.elections.find(e => e.electionId.toString() === electionId.toString());
};

// Method to add or update election participation
userSchema.methods.updateElectionParticipation = function(electionId, updates) {
  const index = this.elections.findIndex(e => e.electionId.toString() === electionId.toString());
  
  if (index !== -1) {
    // Update existing
    Object.assign(this.elections[index], updates);
  } else {
    // Add new
    this.elections.push({ electionId, ...updates });
  }
};

module.exports = mongoose.model('User', userSchema);
