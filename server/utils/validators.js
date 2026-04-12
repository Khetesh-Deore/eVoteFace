const { ethers } = require('ethers');

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Ethereum address
 */
const isValidEthereumAddress = (address) => {
  try {
    return ethers.isAddress(address);
  } catch {
    return false;
  }
};

/**
 * Validate transaction hash
 */
const isValidTxHash = (hash) => {
  return /^0x[a-fA-F0-9]{64}$/.test(hash);
};

/**
 * Validate MongoDB ObjectId
 */
const isValidObjectId = (id) => {
  return /^[a-f\d]{24}$/i.test(id);
};

/**
 * Validate Indian phone number
 */
const isValidIndianPhone = (phone) => {
  // Remove spaces and dashes
  const cleaned = phone.replace(/[-\s]/g, '');
  
  // Check formats: 10 digits starting with 6-9, or +91 followed by 10 digits
  return /^(\+91)?[6-9]\d{9}$/.test(cleaned);
};

/**
 * Normalize phone number to standard format
 */
const normalizePhoneNumber = (phone) => {
  const cleaned = phone.replace(/[-\s]/g, '');
  
  if (cleaned.startsWith('+91')) {
    return cleaned;
  }
  
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  
  return cleaned;
};

/**
 * Validate Aadhar number
 */
const isValidAadhar = (aadhar) => {
  return /^\d{12}$/.test(aadhar);
};

/**
 * Validate Indian pincode
 */
const isValidPincode = (pincode) => {
  return /^\d{6}$/.test(pincode);
};

/**
 * Validate voter ID format
 */
const isValidVoterId = (voterId) => {
  return /^[A-Z0-9]{5,20}$/.test(voterId);
};

/**
 * Validate strong password
 */
const isStrongPassword = (password) => {
  // Min 8 chars, at least one uppercase, lowercase, number, special char
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  return strongRegex.test(password);
};

/**
 * Validate election phase
 */
const isValidPhase = (phase) => {
  const validPhases = ['registration', 'voting', 'completed'];
  return validPhases.includes(phase?.toLowerCase());
};

/**
 * Validate date range
 */
const isValidDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return false;
  }
  
  return end > start;
};

/**
 * Validate date is not in past
 */
const isNotPastDate = (date) => {
  const inputDate = new Date(date);
  const now = new Date();
  
  if (isNaN(inputDate.getTime())) {
    return false;
  }
  
  return inputDate >= now;
};

/**
 * Sanitize HTML from string
 */
const sanitizeHtml = (str) => {
  if (typeof str !== 'string') return str;
  
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'");
};

/**
 * Sanitize SQL injection attempts
 */
const sanitizeSql = (str) => {
  if (typeof str !== 'string') return str;
  
  const sqlKeywords = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER',
    'EXEC', 'EXECUTE', 'UNION', 'DECLARE', '--', '/*', '*/', 'xp_', 'sp_'
  ];
  
  let sanitized = str;
  sqlKeywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    sanitized = sanitized.replace(regex, '');
  });
  
  return sanitized;
};

/**
 * Validate file upload
 */
const isValidImageFile = (file) => {
  if (!file) return false;
  
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return { valid: false, error: 'Only JPEG and PNG images are allowed' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }
  
  return { valid: true };
};

/**
 * Validate base64 image
 */
const isValidBase64Image = (base64String) => {
  if (!base64String || typeof base64String !== 'string') {
    return false;
  }
  
  // Check if it's a valid base64 string
  const base64Regex = /^data:image\/(jpeg|jpg|png);base64,/;
  if (!base64Regex.test(base64String)) {
    return false;
  }
  
  // Check size (approximate, base64 is ~33% larger than binary)
  const sizeInBytes = (base64String.length * 3) / 4;
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  return sizeInBytes <= maxSize;
};

/**
 * Validate OTP code
 */
const isValidOtp = (otp) => {
  return /^\d{6}$/.test(otp);
};

/**
 * Validate age
 */
const isValidAge = (age) => {
  const numAge = parseInt(age, 10);
  return !isNaN(numAge) && numAge >= 18 && numAge <= 150;
};

/**
 * Validate gender
 */
const isValidGender = (gender) => {
  const validGenders = ['Male', 'Female', 'Other'];
  return validGenders.includes(gender);
};

/**
 * Validate candidate ID
 */
const isValidCandidateId = (id) => {
  const numId = parseInt(id, 10);
  return !isNaN(numId) && numId >= 0;
};

/**
 * Validate URL
 */
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate image URL
 */
const isValidImageUrl = (url) => {
  if (!isValidUrl(url)) return false;
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const urlLower = url.toLowerCase();
  
  return imageExtensions.some(ext => urlLower.includes(ext));
};

/**
 * Normalize string (trim, lowercase)
 */
const normalizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str.trim().toLowerCase();
};

/**
 * Validate array length
 */
const isValidArrayLength = (arr, min = 0, max = Infinity) => {
  if (!Array.isArray(arr)) return false;
  return arr.length >= min && arr.length <= max;
};

/**
 * Remove duplicates from array
 */
const removeDuplicates = (arr) => {
  return [...new Set(arr)];
};

/**
 * Validate object depth (prevent deeply nested objects)
 */
const getObjectDepth = (obj, currentDepth = 0, maxDepth = 10) => {
  if (currentDepth > maxDepth) {
    throw new Error('Object nesting too deep');
  }
  
  if (typeof obj !== 'object' || obj === null) {
    return currentDepth;
  }
  
  let maxChildDepth = currentDepth;
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const childDepth = getObjectDepth(obj[key], currentDepth + 1, maxDepth);
      maxChildDepth = Math.max(maxChildDepth, childDepth);
    }
  }
  
  return maxChildDepth;
};

/**
 * Whitelist object properties
 */
const whitelistProperties = (obj, allowedProps) => {
  const whitelisted = {};
  
  allowedProps.forEach(prop => {
    if (obj.hasOwnProperty(prop)) {
      whitelisted[prop] = obj[prop];
    }
  });
  
  return whitelisted;
};

/**
 * Validate JWT token format
 */
const isValidJwtFormat = (token) => {
  if (!token || typeof token !== 'string') return false;
  
  const parts = token.split('.');
  return parts.length === 3;
};

/**
 * Checksum Ethereum address (EIP-55)
 */
const checksumAddress = (address) => {
  try {
    return ethers.getAddress(address);
  } catch {
    return address;
  }
};

module.exports = {
  isValidEmail,
  isValidEthereumAddress,
  isValidTxHash,
  isValidObjectId,
  isValidIndianPhone,
  normalizePhoneNumber,
  isValidAadhar,
  isValidPincode,
  isValidVoterId,
  isStrongPassword,
  isValidPhase,
  isValidDateRange,
  isNotPastDate,
  sanitizeHtml,
  sanitizeSql,
  isValidImageFile,
  isValidBase64Image,
  isValidOtp,
  isValidAge,
  isValidGender,
  isValidCandidateId,
  isValidUrl,
  isValidImageUrl,
  normalizeString,
  isValidArrayLength,
  removeDuplicates,
  getObjectDepth,
  whitelistProperties,
  isValidJwtFormat,
  checksumAddress,
};
