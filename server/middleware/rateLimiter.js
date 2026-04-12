const rateLimit = require("express-rate-limit");

/**
 * Custom rate limit handler with detailed response
 */
const rateLimitHandler = (req, res) => {
  const retryAfter = Math.ceil(req.rateLimit.resetTime.getTime() - Date.now()) / 1000;
  
  res.status(429).json({
    success: false,
    message: "Too many requests, please try again later",
    retryAfter: Math.ceil(retryAfter),
    resetTime: req.rateLimit.resetTime.toISOString(),
    limit: req.rateLimit.limit,
  });
};

/**
 * Skip rate limiting for whitelisted IPs
 */
const skipWhitelistedIPs = (req) => {
  const whitelistedIPs = (process.env.WHITELISTED_IPS || '').split(',').filter(Boolean);
  const clientIP = req.ip || req.connection.remoteAddress;
  return whitelistedIPs.includes(clientIP);
};

/**
 * Global rate limiter - applies to all routes
 * 100 requests per 15 minutes per IP
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { message: "Too many requests from this IP, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipWhitelistedIPs,
  handler: rateLimitHandler,
});

/**
 * Authentication rate limiters
 */
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { message: "Too many authentication attempts. Please try again in 1 hour." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  handler: rateLimitHandler,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { message: "Too many login attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    // Rate limit by email instead of IP for login
    return req.body.email || req.ip;
  },
  handler: rateLimitHandler,
});

/**
 * OTP rate limiters
 */
const otpSendLimiter = rateLimit({
  windowMs: parseInt(process.env.OTP_RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.OTP_RATE_LIMIT_MAX) || 3,
  message: { message: "Too many OTP requests. Please wait before trying again." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by user ID or email
    return req.user?.email || req.body.email || req.ip;
  },
  handler: rateLimitHandler,
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { message: "Too many OTP verification attempts. Please request a new OTP." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?.email || req.ip;
  },
  handler: rateLimitHandler,
});

/**
 * Vote recording rate limiter
 * Strict: 1 vote per user per election
 */
const voteLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 1,
  message: { message: "You have already voted in this election." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Combine user ID and election ID for unique key
    const userId = req.user?._id || req.user?.id;
    const electionId = req.params.electionId || req.body.electionId;
    return `vote:${userId}:${electionId}`;
  },
  handler: rateLimitHandler,
});

/**
 * Results viewing rate limiter
 * 30 requests per minute per IP
 */
const resultsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { message: "Too many requests for results. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Face verification rate limiter
 * 10 attempts per 5 minutes per user
 */
const faceVerifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10,
  message: { message: "Too many face verification attempts. Please wait 5 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user?._id || req.user?.id || req.ip;
  },
  handler: rateLimitHandler,
});

/**
 * Admin face upload rate limiter
 * 5 uploads per hour per admin
 */
const adminFaceUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { message: "Too many face uploads. Please wait before uploading more." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.admin?._id || req.admin?.id || req.ip;
  },
  handler: rateLimitHandler,
});

/**
 * Admin operations rate limiters
 */
const adminWriteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: { message: "Too many admin operations. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.admin?._id || req.admin?.id || req.ip;
  },
  handler: rateLimitHandler,
});

const adminReadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 500,
  message: { message: "Too many admin read requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.admin?._id || req.admin?.id || req.ip;
  },
  handler: rateLimitHandler,
});

/**
 * Candidate management rate limiters
 */
const candidateCreateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: { message: "Too many candidate additions. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.admin?._id || req.admin?.id || req.ip;
  },
  handler: rateLimitHandler,
});

const candidateDeleteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: { message: "Too many candidate deletions. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.admin?._id || req.admin?.id || req.ip;
  },
  handler: rateLimitHandler,
});

/**
 * DDoS detection middleware
 */
const ddosDetection = (() => {
  const requestCounts = new Map();
  const blockedIPs = new Map();
  const VIOLATION_THRESHOLD = 10; // Block after 10 rate limit violations
  const VIOLATION_WINDOW = 5 * 60 * 1000; // 5 minutes
  const BLOCK_DURATION = 30 * 60 * 1000; // 30 minutes

  // Cleanup old entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    
    // Clean up request counts
    for (const [ip, data] of requestCounts.entries()) {
      if (now - data.firstRequest > VIOLATION_WINDOW) {
        requestCounts.delete(ip);
      }
    }
    
    // Clean up blocked IPs
    for (const [ip, blockTime] of blockedIPs.entries()) {
      if (now - blockTime > BLOCK_DURATION) {
        blockedIPs.delete(ip);
        console.log(`[DDoS] Unblocked IP: ${ip}`);
      }
    }
  }, 5 * 60 * 1000);

  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    // Check if IP is blocked
    if (blockedIPs.has(clientIP)) {
      const blockTime = blockedIPs.get(clientIP);
      const remainingTime = Math.ceil((BLOCK_DURATION - (now - blockTime)) / 1000);
      
      return res.status(403).json({
        success: false,
        message: "Your IP has been temporarily blocked due to suspicious activity",
        retryAfter: remainingTime,
        blockedUntil: new Date(blockTime + BLOCK_DURATION).toISOString(),
      });
    }

    // Track rate limit violations
    if (req.rateLimit && req.rateLimit.remaining === 0) {
      const data = requestCounts.get(clientIP) || { count: 0, firstRequest: now };
      data.count++;
      
      if (data.count === 1) {
        data.firstRequest = now;
      }
      
      requestCounts.set(clientIP, data);

      // Block if threshold exceeded
      if (data.count >= VIOLATION_THRESHOLD) {
        blockedIPs.set(clientIP, now);
        requestCounts.delete(clientIP);
        
        console.warn(`[DDoS] Blocked IP due to ${data.count} violations: ${clientIP}`);
        
        return res.status(403).json({
          success: false,
          message: "Your IP has been temporarily blocked due to excessive requests",
          retryAfter: Math.ceil(BLOCK_DURATION / 1000),
          blockedUntil: new Date(now + BLOCK_DURATION).toISOString(),
        });
      }
    }

    next();
  };
})();

/**
 * Progressive backoff for failed login attempts
 */
const loginBackoff = (() => {
  const attempts = new Map();
  const locked = new Map();
  const LOCK_DURATION = 30 * 60 * 1000; // 30 minutes

  // Cleanup every 5 minutes
  setInterval(() => {
    const now = Date.now();
    
    for (const [key, data] of attempts.entries()) {
      if (now - data.lastAttempt > 15 * 60 * 1000) {
        attempts.delete(key);
      }
    }
    
    for (const [key, lockTime] of locked.entries()) {
      if (now - lockTime > LOCK_DURATION) {
        locked.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  return {
    checkLock: (req, res, next) => {
      const key = req.body.email || req.ip;
      
      if (locked.has(key)) {
        const lockTime = locked.get(key);
        const remainingTime = Math.ceil((LOCK_DURATION - (Date.now() - lockTime)) / 1000);
        
        return res.status(429).json({
          success: false,
          message: "Account temporarily locked due to too many failed login attempts",
          retryAfter: remainingTime,
          lockedUntil: new Date(lockTime + LOCK_DURATION).toISOString(),
        });
      }
      
      next();
    },

    recordFailure: (email) => {
      const now = Date.now();
      const data = attempts.get(email) || { count: 0, lastAttempt: now };
      
      data.count++;
      data.lastAttempt = now;
      attempts.set(email, data);

      // Calculate delay based on attempt count
      let delay = 0;
      if (data.count >= 4 && data.count <= 5) delay = 1000;
      else if (data.count >= 6 && data.count <= 7) delay = 5000;
      else if (data.count >= 8 && data.count <= 9) delay = 30000;
      else if (data.count >= 10) {
        locked.set(email, now);
        attempts.delete(email);
        console.warn(`[Auth] Locked account due to failed attempts: ${email}`);
      }

      return { delay, attemptCount: data.count, locked: data.count >= 10 };
    },

    recordSuccess: (email) => {
      attempts.delete(email);
      locked.delete(email);
    },
  };
})();

module.exports = {
  globalLimiter,
  authLimiter,
  loginLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
  voteLimiter,
  resultsLimiter,
  faceVerifyLimiter,
  adminFaceUploadLimiter,
  adminWriteLimiter,
  adminReadLimiter,
  candidateCreateLimiter,
  candidateDeleteLimiter,
  ddosDetection,
  loginBackoff,
  
  // Legacy export
  otpLimiter: otpSendLimiter,
};
