const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName:      { type: String, required: true, trim: true },
    email:         { type: String, required: true, lowercase: true, trim: true },
    password:      { type: String, required: true },
    voterID:       { type: String, required: true, trim: true },
    aadharNumber:  { type: String, required: true, unique: true, trim: true },
    age:           { type: Number, required: true, min: 18 },
    gender:        { type: String, enum: ["Male", "Female", "Other"], required: true },
    address:       { type: String, required: true },
    state:         { type: String, required: true },
    city:          { type: String, required: true },
    pincode:       { type: String, required: true, match: /^\d{6}$/ },
    contactNumber: { type: String, required: true, match: /^\d{10}$/ },
    faceEncoding:  { type: [Number], default: [], select: false }, // 128-float array from Python
    faceImagePath: { type: String, default: "" },
    walletAddress: { type: String },                          // unique sparse index below
    role:          { type: String, enum: ["voter", "admin"], default: "voter" },
    isVerified:    { type: Boolean, default: false },      // admin must approve
    hasVoted:      { type: Boolean, default: false },
    votedAt:       { type: Date },
  },
  { timestamps: true }  // adds createdAt and updatedAt automatically
);

// ── Indexes ──
userSchema.index({ email: 1 },         { unique: true });
userSchema.index({ voterID: 1 },       { unique: true });
userSchema.index({ walletAddress: 1 }, { unique: true, sparse: true }); // sparse: allows multiple empty strings

module.exports = mongoose.model("User", userSchema);
