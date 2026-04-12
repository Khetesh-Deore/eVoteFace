const { body, param, query, validationResult } = require('express-validator');
const { ethers } = require('ethers');

/**
 * Validation middleware to check for validation errors
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = {};
    errors.array().forEach(error => {
      formattedErrors[error.path || error.param] = error.msg;
    });
    
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: formattedErrors,
    });
  }
  
  next();
};

/**
 * Sanitize string input
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  return str
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\uFEFF/g, '') // Remove BOM
    .replace(/<[^>]*>/g, ''); // Remove HTML tags
};

/**
 * Custom validators
 */
const customValidators = {
  isEthereumAddress: (value) => {
    if (!value) return false;
    return ethers.isAddress(value);
  },
  
  isTransactionHash: (value) => {
    if (!value) return false;
    return /^0x[a-fA-F0-9]{64}$/.test(value);
  },
  
  isMongoId: (value) => {
    if (!value) return false;
    return /^[a-f\d]{24}$/i.test(value);
  },
  
  isValidPhase: (value) => {
    const validPhases = ['registration', 'voting', 'completed'];
    return validPhases.includes(value?.toLowerCase());
  },
  
  isIndianPhone: (value) => {
    if (!value) return false;
    // Accept 10 digits or +91-XXXXXXXXXX format
    return /^(\+91)?[6-9]\d{9}$/.test(value.replace(/[-\s]/g, ''));
  },
  
  isAadhar: (value) => {
    if (!value) return false;
    return /^\d{12}$/.test(value);
  },
  
  isPincode: (value) => {
    if (!value) return false;
    return /^\d{6}$/.test(value);
  },
  
  isVoterId: (value) => {
    if (!value) return false;
    return /^[A-Z0-9]{5,20}$/.test(value);
  },
  
  isStrongPassword: (value) => {
    if (!value) return false;
    // Min 8 chars, at least one uppercase, lowercase, number, special char
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/.test(value);
  },
};

/**
 * Election validation rules
 */
const electionValidation = {
  create: [
    body('title')
      .trim()
      .notEmpty().withMessage('Title is required')
      .isLength({ min: 1, max: 100 }).withMessage('Title must be 1-100 characters')
      .customSanitizer(sanitizeString),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Description must be max 1000 characters')
      .customSanitizer(sanitizeString),
    
    body('startTime')
      .optional()
      .isISO8601().withMessage('Start time must be valid ISO 8601 date'),
    
    body('endTime')
      .optional()
      .isISO8601().withMessage('End time must be valid ISO 8601 date')
      .custom((value, { req }) => {
        if (req.body.startTime && value) {
          const start = new Date(req.body.startTime);
          const end = new Date(value);
          if (end <= start) {
            throw new Error('End time must be after start time');
          }
        }
        return true;
      }),
  ],
  
  update: [
    param('electionId')
      .custom(customValidators.isMongoId).withMessage('Invalid election ID'),
    
    body('title')
      .optional()
      .trim()
      .isLength({ min: 1, max: 100 }).withMessage('Title must be 1-100 characters')
      .customSanitizer(sanitizeString),
    
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Description must be max 1000 characters')
      .customSanitizer(sanitizeString),
    
    body('isActive')
      .optional()
      .isBoolean().withMessage('isActive must be boolean'),
  ],
  
  changePhase: [
    param('electionId')
      .custom(customValidators.isMongoId).withMessage('Invalid election ID'),
    
    body('phase')
      .trim()
      .notEmpty().withMessage('Phase is required')
      .custom(customValidators.isValidPhase).withMessage('Invalid phase'),
  ],
};

/**
 * User/Voter validation rules
 */
const userValidation = {
  register: [
    body('fullName')
      .trim()
      .notEmpty().withMessage('Full name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Full name must be 2-100 characters')
      .customSanitizer(sanitizeString),
    
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Must be valid email')
      .isLength({ max: 255 }).withMessage('Email too long')
      .normalizeEmail(),
    
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 8, max: 128 }).withMessage('Password must be 8-128 characters')
      .custom(customValidators.isStrongPassword)
      .withMessage('Password must contain uppercase, lowercase, number, and special character'),
    
    body('voterId')
      .trim()
      .notEmpty().withMessage('Voter ID is required')
      .custom(customValidators.isVoterId).withMessage('Voter ID must be 5-20 alphanumeric characters')
      .toUpperCase(),
    
    body('aadharNumber')
      .trim()
      .notEmpty().withMessage('Aadhar number is required')
      .custom(customValidators.isAadhar).withMessage('Aadhar must be 12 digits'),
    
    body('age')
      .notEmpty().withMessage('Age is required')
      .isInt({ min: 18, max: 150 }).withMessage('Age must be between 18 and 150'),
    
    body('gender')
      .trim()
      .notEmpty().withMessage('Gender is required')
      .isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other'),
    
    body('address')
      .trim()
      .notEmpty().withMessage('Address is required')
      .isLength({ min: 5, max: 200 }).withMessage('Address must be 5-200 characters')
      .customSanitizer(sanitizeString),
    
    body('state')
      .trim()
      .notEmpty().withMessage('State is required')
      .customSanitizer(sanitizeString),
    
    body('city')
      .trim()
      .notEmpty().withMessage('City is required')
      .customSanitizer(sanitizeString),
    
    body('pincode')
      .trim()
      .notEmpty().withMessage('Pincode is required')
      .custom(customValidators.isPincode).withMessage('Pincode must be 6 digits'),
    
    body('phoneNumber')
      .trim()
      .notEmpty().withMessage('Phone number is required')
      .custom(customValidators.isIndianPhone).withMessage('Invalid Indian phone number'),
  ],
  
  login: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Must be valid email')
      .normalizeEmail(),
    
    body('password')
      .notEmpty().withMessage('Password is required'),
  ],
  
  updateWallet: [
    body('walletAddress')
      .trim()
      .notEmpty().withMessage('Wallet address is required')
      .custom(customValidators.isEthereumAddress).withMessage('Invalid Ethereum address'),
  ],
};

/**
 * Candidate validation rules
 */
const candidateValidation = {
  create: [
    body('name')
      .trim()
      .notEmpty().withMessage('Candidate name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters')
      .customSanitizer(sanitizeString),
    
    body('partyName')
      .trim()
      .notEmpty().withMessage('Party name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Party name must be 2-100 characters')
      .customSanitizer(sanitizeString),
    
    body('partySymbol')
      .optional()
      .trim()
      .isURL().withMessage('Party symbol must be valid URL'),
  ],
};

/**
 * Vote validation rules
 */
const voteValidation = {
  record: [
    body('candidateId')
      .notEmpty().withMessage('Candidate ID is required')
      .isInt({ min: 0 }).withMessage('Candidate ID must be non-negative integer'),
    
    body('txHash')
      .trim()
      .notEmpty().withMessage('Transaction hash is required')
      .custom(customValidators.isTransactionHash).withMessage('Invalid transaction hash'),
    
    body('voteAuthToken')
      .notEmpty().withMessage('Vote auth token is required'),
    
    body('electionId')
      .optional()
      .custom(customValidators.isMongoId).withMessage('Invalid election ID'),
  ],
};

/**
 * OTP validation rules
 */
const otpValidation = {
  send: [
    body('faceVerifiedToken')
      .notEmpty().withMessage('Face verified token is required'),
  ],
  
  verify: [
    body('code')
      .trim()
      .notEmpty().withMessage('OTP code is required')
      .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
      .isNumeric().withMessage('OTP must be numeric'),
  ],
};

/**
 * Admin validation rules
 */
const adminValidation = {
  login: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Must be valid email')
      .normalizeEmail(),
    
    body('password')
      .notEmpty().withMessage('Password is required'),
  ],
  
  approveVoter: [
    param('voterId')
      .custom(customValidators.isMongoId).withMessage('Invalid voter ID'),
  ],
  
  registerOnChain: [
    param('voterId')
      .custom(customValidators.isMongoId).withMessage('Invalid voter ID'),
    
    body('walletAddress')
      .trim()
      .notEmpty().withMessage('Wallet address is required')
      .custom(customValidators.isEthereumAddress).withMessage('Invalid Ethereum address'),
  ],
};

/**
 * Face verification validation
 */
const faceValidation = {
  verify: [
    body('liveImageBase64')
      .notEmpty().withMessage('Live image is required')
      .isString().withMessage('Image must be base64 string'),
  ],
  
  upload: [
    // File validation handled by multer middleware
  ],
};

/**
 * Global request sanitization middleware
 */
const sanitizeRequest = (req, res, next) => {
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    });
  }
  
  // Sanitize body (already handled by validators, but extra safety)
  if (req.body && typeof req.body === 'object') {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    });
  }
  
  next();
};

module.exports = {
  validate,
  sanitizeString,
  sanitizeRequest,
  customValidators,
  electionValidation,
  userValidation,
  candidateValidation,
  voteValidation,
  otpValidation,
  adminValidation,
  faceValidation,
};
