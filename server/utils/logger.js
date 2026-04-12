const winston = require('winston');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Sanitize sensitive data from logs
 */
const sanitize = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sanitized = { ...data };
  const sensitiveFields = [
    'password', 'token', 'jwt', 'secret', 'privateKey', 
    'apiKey', 'accessToken', 'refreshToken', 'faceEncoding'
  ];
  
  for (const key in sanitized) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (key === 'email' && typeof sanitized[key] === 'string') {
      // Mask email: user@example.com -> u***@example.com
      sanitized[key] = sanitized[key].replace(/^(.)(.*)(@.*)$/, '$1***$3');
    } else if (key === 'walletAddress' && typeof sanitized[key] === 'string') {
      // Mask wallet: 0x1234...abcd
      const addr = sanitized[key];
      sanitized[key] = `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitize(sanitized[key]);
    }
  }
  
  return sanitized;
};

/**
 * Custom log format
 */
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const sanitizedMeta = sanitize(meta);
    return JSON.stringify({
      timestamp,
      level,
      service: service || 'evoteface',
      message,
      ...sanitizedMeta,
    });
  })
);

/**
 * Create logger instance
 */
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'evoteface' },
  transports: [
    // Console transport (development)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      silent: process.env.NODE_ENV === 'test',
    }),
    
    // File transport - all logs
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 30,
      tailable: true,
    }),
    
    // File transport - errors only
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 30,
      tailable: true,
    }),
  ],
  
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/exceptions.log'),
    }),
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/rejections.log'),
    }),
  ],
});

/**
 * Request logger middleware
 */
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  const requestId = uuidv4();
  
  // Attach request ID to request object
  req.requestId = requestId;
  
  // Log request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    path: req.path,
    query: sanitize(req.query),
    body: sanitize(req.body),
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: req.user?._id || req.user?.id,
    adminId: req.admin?._id || req.admin?.id,
  });
  
  // Log response
  const originalSend = res.send;
  res.send = function (data) {
    const duration = Date.now() - startTime;
    
    logger.info('Outgoing response', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userId: req.user?._id || req.user?.id,
      adminId: req.admin?._id || req.admin?.id,
    });
    
    originalSend.call(this, data);
  };
  
  next();
};

/**
 * Database query logger
 */
const logDatabaseQuery = (operation, collection, query, result) => {
  const startTime = Date.now();
  
  return {
    success: () => {
      const duration = Date.now() - startTime;
      logger.debug('Database query', {
        operation,
        collection,
        query: sanitize(query),
        resultCount: Array.isArray(result) ? result.length : 1,
        duration,
      });
    },
    error: (error) => {
      const duration = Date.now() - startTime;
      logger.error('Database query failed', {
        operation,
        collection,
        query: sanitize(query),
        error: error.message,
        duration,
      });
    },
  };
};

/**
 * External service call logger
 */
const logExternalCall = (service, operation, request) => {
  const startTime = Date.now();
  const callId = uuidv4();
  
  logger.info('External service call', {
    callId,
    service,
    operation,
    request: sanitize(request),
  });
  
  return {
    success: (response) => {
      const duration = Date.now() - startTime;
      logger.info('External service response', {
        callId,
        service,
        operation,
        status: 'success',
        duration,
      });
    },
    error: (error) => {
      const duration = Date.now() - startTime;
      logger.error('External service error', {
        callId,
        service,
        operation,
        error: error.message,
        duration,
      });
    },
  };
};

/**
 * Security event logger
 */
const logSecurityEvent = (event, details) => {
  logger.warn('Security event', {
    event,
    ...sanitize(details),
    timestamp: new Date().toISOString(),
  });
};

/**
 * Business operation logger
 */
const logBusinessOperation = (operation, details) => {
  logger.info('Business operation', {
    operation,
    ...sanitize(details),
    timestamp: new Date().toISOString(),
  });
};

/**
 * Error logger with tracking
 */
const logError = (error, context = {}) => {
  const errorId = uuidv4();
  
  logger.error('Application error', {
    errorId,
    message: error.message,
    code: error.code,
    stack: error.stack,
    ...sanitize(context),
  });
  
  return errorId;
};

module.exports = {
  logger,
  requestLogger,
  logDatabaseQuery,
  logExternalCall,
  logSecurityEvent,
  logBusinessOperation,
  logError,
  sanitize,
};
