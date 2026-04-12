# Error Handling & Logging Guide

## Overview
This document describes the comprehensive error handling and logging system implemented in the eVoteFace application.

## Error Classes

### AppError (Base Class)
Base class for all operational errors.
```javascript
throw new AppError('Something went wrong', 500, 'ERROR_CODE');
```

### ValidationError (422)
For input validation failures.
```javascript
throw new ValidationError('Validation failed', {
  email: 'Invalid email format',
  age: 'Must be between 18 and 150'
});
```

### AuthenticationError (401)
For authentication failures.
```javascript
throw new AuthenticationError('Invalid credentials');
```

### AuthorizationError (403)
For authorization failures.
```javascript
throw new AuthorizationError('You do not have permission');
```

### NotFoundError (404)
For resource not found errors.
```javascript
throw new NotFoundError('Election');
```

### ConflictError (409)
For resource conflicts (duplicates).
```javascript
throw new ConflictError('Email already exists', 'email');
```

### BusinessLogicError (422)
For business logic violations.
```javascript
throw new BusinessLogicError('Cannot vote during registration phase');
```

### ExternalServiceError (503)
For external service failures.
```javascript
throw new ExternalServiceError('Blockchain', 'Transaction failed');
```

## Usage in Routes

### Basic Usage
```javascript
const { asyncHandler, NotFoundError } = require('../middleware/errorHandler');

router.get('/elections/:id', asyncHandler(async (req, res) => {
  const election = await Election.findById(req.params.id);
  
  if (!election) {
    throw new NotFoundError('Election');
  }
  
  res.json({ election });
}));
```

### With Validation
```javascript
const { ValidationError } = require('../middleware/errorHandler');

router.post('/elections', async (req, res, next) => {
  try {
    const { title, description } = req.body;
    
    if (!title) {
      throw new ValidationError('Validation failed', {
        title: 'Title is required'
      });
    }
    
    const election = await Election.create({ title, description });
    res.status(201).json({ election });
  } catch (error) {
    next(error);
  }
});
```

## Logging

### Request Logging
Automatically logs all incoming requests and outgoing responses.
```javascript
// In server.js
const { requestLogger } = require('./utils/logger');
app.use(requestLogger);
```

### Database Query Logging
```javascript
const { logDatabaseQuery } = require('./utils/logger');

const log = logDatabaseQuery('find', 'elections', { phase: 'voting' });
try {
  const elections = await Election.find({ phase: 'voting' });
  log.success();
  return elections;
} catch (error) {
  log.error(error);
  throw error;
}
```

### External Service Logging
```javascript
const { logExternalCall } = require('./utils/logger');

const log = logExternalCall('blockchain', 'deployContract', { title });
try {
  const result = await blockchainService.deployElectionContract(title);
  log.success(result);
  return result;
} catch (error) {
  log.error(error);
  throw new ExternalServiceError('Blockchain', error.message);
}
```

### Security Event Logging
```javascript
const { logSecurityEvent } = require('./utils/logger');

logSecurityEvent('FAILED_LOGIN', {
  email: req.body.email,
  ip: req.ip,
  attemptCount: 5
});
```

### Business Operation Logging
```javascript
const { logBusinessOperation } = require('./utils/logger');

logBusinessOperation('ELECTION_CREATED', {
  electionId: election._id,
  title: election.title,
  adminId: req.admin._id
});
```

## Error Response Format

All errors return a standardized JSON response:

```json
{
  "success": false,
  "message": "User-friendly error message",
  "code": "ERROR_CODE",
  "errorId": "unique-error-id-for-tracking",
  "timestamp": "2021-07-15T12:00:00Z",
  "errors": {
    "field1": "Error message for field1",
    "field2": "Error message for field2"
  }
}
```

## HTTP Status Codes

- **400** - Bad Request (malformed request)
- **401** - Unauthorized (authentication required)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found (resource doesn't exist)
- **409** - Conflict (duplicate resource)
- **422** - Unprocessable Entity (validation/business logic error)
- **429** - Too Many Requests (rate limit exceeded)
- **500** - Internal Server Error (unexpected error)
- **503** - Service Unavailable (external service error)

## Log Files

Logs are stored in `server/logs/`:

- **combined.log** - All logs (info, warn, error)
- **error.log** - Error logs only
- **exceptions.log** - Uncaught exceptions
- **rejections.log** - Unhandled promise rejections

Log files are rotated daily and kept for 30 days.

## Sensitive Data Protection

The logging system automatically redacts:
- Passwords
- JWT tokens
- API keys
- Private keys
- Face encodings
- Email addresses (masked: u***@example.com)
- Wallet addresses (masked: 0x1234...abcd)

## Error Tracking

The `errorTracker` monitors error frequency and patterns:

```javascript
const { errorTracker } = require('./middleware/errorHandler');

// Get error statistics
const stats = errorTracker.getStats();
console.log(stats.topErrors);
console.log(stats.recentErrors);
```

## Monitoring & Alerts

The system automatically:
- Logs all errors with unique tracking IDs
- Alerts when errors occur frequently (10+ times)
- Tracks error patterns and trends
- Provides statistics for monitoring dashboards

## Best Practices

1. **Always use asyncHandler** for async route handlers
2. **Throw specific error types** instead of generic errors
3. **Include context** when logging errors
4. **Never log sensitive data** (passwords, tokens, etc.)
5. **Use error tracking IDs** for debugging
6. **Monitor error frequency** to detect issues early
7. **Test error handling** for all edge cases

## Integration with Monitoring Services

To integrate with external monitoring (Sentry, DataDog, etc.):

```javascript
// In errorHandler.js
if (!isOperationalError(error) || statusCode >= 500) {
  // Send to Sentry
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, {
      tags: { errorId },
      extra: context
    });
  }
}
```

## Testing

Test error handling with:

```javascript
const request = require('supertest');
const app = require('../server');

describe('Error Handling', () => {
  it('should return 404 for non-existent route', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.errorId).toBeDefined();
  });
  
  it('should return 422 for validation errors', async () => {
    const res = await request(app)
      .post('/api/elections')
      .send({ title: '' });
    expect(res.status).toBe(422);
    expect(res.body.errors).toBeDefined();
  });
});
```

## Environment Variables

```env
LOG_LEVEL=info          # debug, info, warn, error
NODE_ENV=production     # development, production, test
SENTRY_DSN=             # Optional: Sentry DSN for error tracking
```

## Summary

This error handling system provides:
- ✅ Standardized error responses
- ✅ Comprehensive logging with rotation
- ✅ Sensitive data protection
- ✅ Error tracking and monitoring
- ✅ Automatic alerts for critical errors
- ✅ Easy integration with monitoring services
- ✅ Developer-friendly debugging with error IDs
