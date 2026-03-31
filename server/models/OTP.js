const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email:     { type: String, required: true },
  code:      { type: String, required: true },           // 6-digit OTP
  expiresAt: { type: Date, required: true },             // 5 min from creation
  used:      { type: Boolean, default: false },          // consumed after verify
});

// ── TTL index — MongoDB auto-deletes document when expiresAt is reached ──
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("OTP", otpSchema);
