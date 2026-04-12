const { logError } = require('../utils/logger');

/**
 * Custom error classes
 */
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, errors = {}) {
    super(message, 422, 'VALIDATION_ERROR');
    this.errors = errors;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message, conflictField) {
    super(message, 409, 'CONFLICT_ERROR');
    this.conflictField = conflictField;
  }
}

class BusinessLogicError extends AppError {
  constructor(message) {
    super(message, 422, 'BUSINESS_LOGIC_ERROR');
  }
}

class ExternalServiceError extends AppError {
  constructor(service, message) {
    super(`${service} error: ${message}`, 503, 'EXTERNAL_SERVICE_ERROR');
    this.service = service;
  }
}

/**
 * Error response formatter
 */
const formatErrorResponse = (error, errorId, includeStack = false) => {
  const response = {
    success: false,
    message: error.message || 'An error occurred',
    code: error.code || 'INTERNAL_ERROR',
    errorId,
    timestamp: new Date().toISOString(),
  };

  // Include validation errors if present
  if (error.errors) {
    response.errors = error.errors;
  }

  // Include conflict field if present
  if (error.conflictField) {
    response.conflictField = error.conflictField;
  }

  // Include stack trace in development
  if (includeStack && process.env.NODE_ENV === 'development') {
    response.stack = error.stack;
  }

  return response;
};

/**
 * Determine if error is operational (expected) or programming error
 */
const isOperationalError = (error) => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Handle specific error types
 */
const handleMongooseError = (error) => {
  // Duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return new ConflictError(
      `${field} already exists`,
      field
    );
  }

  // Validation error
  if (error.name === 'ValidationError') {
    const errors = {};
    Object.keys(error.errors).forEach(key => {
      errors[key] = error.errors[key].message;
    });
    return new ValidationError('Validation failed', errors);
  }

  // Cast error (invalid ObjectId)
  if (error.name === 'CastError') {
    return new ValidationError(`Invalid ${error.path}: ${error.value}`);
  }

  return error;
};

const handleJWTError = (error) => {
  if (error.name === 'JsonWebTokenError') {
    return new AuthenticationError('Invalid token');
  }
  
  if (error.name === 'TokenExpiredError') {
    return new AuthenticationError('Token expired');
  }
  
  return error;
};

const handleMulterError = (error) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return new ValidationError('File too large');
  }
  
  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return new ValidationError('Unexpected file field');
  }
  
  return new ValidationError(error.message);
};

/**
 * Centralized error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = err;

  // Handle specific error types
  if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    error = handleMongooseError(error);
  } else if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
    error = handleJWTError(error);
  } else if (error.name === 'MulterError') {
    error = handleMulterError(error);
  }

  // Default to 500 if no status code
  const statusCode = error.statusCode || 500;
  
  // Log error with context
  const errorId = logError(error, {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    body: req.body,
    ip: req.ip,
    userId: req.user?._id || req.user?.id,
    adminId: req.admin?._id || req.admin?.id,
  });

  // Send error response
  const includeStack = process.env.NODE_ENV === 'development';
  const response = formatErrorResponse(error, errorId, includeStack);
  
  res.status(statusCode).json(response);

  // Alert for critical errors
  if (!isOperationalError(error) || statusCode >= 500) {
    console.error(`[CRITICAL ERROR] ${errorId}:`, error);
    // TODO: Send alert to monitoring service
    // TODO: Send email to admin
  }
};

/**
 * Handle 404 errors
 */
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError('Route');
  error.message = `Route ${req.method} ${req.path} not found`;
  next(error);
};

/**
 * Async error wrapper
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Error tracking and monitoring
 */
class ErrorTracker {
  constructor() {
    this.errors = new Map();
    this.errorFrequency = new Map();
    
    // Cleanup old errors every hour
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }

  track(error, context) {
    const key = `${error.code}:${error.message}`;
    const count = this.errorFrequency.get(key) || 0;
    this.errorFrequency.set(key, count + 1);

    this.errors.set(context.errorId, {
      error,
      context,
      timestamp: new Date(),
      count: count + 1,
    });

    // Alert if error occurs too frequently
    if (count + 1 >= 10) {
      this.alertHighFrequency(error, count + 1);
    }
  }

  alertHighFrequency(error, count) {
    console.warn(`[ERROR ALERT] Error occurred ${count} times:`, {
      code: error.code,
      message: error.message,
    });
    // TODO: Send to monitoring service
  }

  getStats() {
    const topErrors = Array.from(this.errorFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([key, count]) => {
        const [code, message] = key.split(':');
        return { code, message, count };
      });

    return {
      totalErrors: this.errors.size,
      topErrors,
      recentErrors: Array.from(this.errors.values())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20)
        .map(e => ({
          errorId: e.context.errorId,
          code: e.error.code,
          message: e.error.message,
          timestamp: e.timestamp,
          count: e.count,
        })),
    };
  }

  cleanup() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    
    for (const [errorId, data] of this.errors.entries()) {
      if (data.timestamp.getTime() < cutoff) {
        this.errors.delete(errorId);
      }
    }
  }
}

const errorTracker = new ErrorTracker();

module.exports = {
  // Error classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BusinessLogicError,
  ExternalServiceError,
  
  // Middleware
  errorHandler,
  notFoundHandler,
  asyncHandler,
  
  // Utilities
  isOperationalError,
  formatErrorResponse,
  errorTracker,
};
