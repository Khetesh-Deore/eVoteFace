const rateLimit = require("express-rate-limit");

const otpLimiter = rateLimit({
  windowMs: parseInt(process.env.OTP_RATE_LIMIT_WINDOW_MS) || 600000,
  max: parseInt(process.env.OTP_RATE_LIMIT_MAX) || 3,
  message: { message: "Too many OTP requests. Please wait 10 minutes before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { otpLimiter };
