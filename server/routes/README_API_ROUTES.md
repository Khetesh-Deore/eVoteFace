# API Routes Documentation

## Multi-Election API (New)

### Elections Management
```
POST   /api/elections                          # Create new election (admin)
GET    /api/elections                          # List all elections (public)
GET    /api/elections/:electionId              # Get election details (public)
PUT    /api/elections/:electionId              # Update election (admin, registration phase only)
DELETE /api/elections/:electionId              # Delete election (admin, registration phase only)
```

### Election Admin Routes
```
GET    /api/elections/:electionId/admin                        # Admin dashboard
POST   /api/elections/:electionId/admin/candidates             # Add candidate
GET    /api/elections/:electionId/admin/candidates             # List candidates
DELETE /api/elections/:electionId/admin/candidates/:id         # Remove candidate
GET    /api/elections/:electionId/admin/voters                 # List voters
POST   /api/elections/:electionId/admin/voters/:id/approve     # Approve voter
POST   /api/elections/:electionId/admin/voters/:id/register-onchain  # Register wallet on blockchain
POST   /api/elections/:electionId/admin/voters/:id/face        # Upload face
POST   /api/elections/:electionId/admin/phase                  # Change phase
```

### Election Voting Routes
```
POST   /api/elections/:electionId/votes/record      # Record vote (voter)
GET    /api/elections/:electionId/votes/results     # Get results (public)
GET    /api/elections/:electionId/votes/candidates  # List candidates (public)
```

### Election Voter Routes
```
GET    /api/elections/:electionId/voters/status    # Get voter status (voter)
POST   /api/elections/:electionId/voters/wallet    # Save wallet address (voter)
GET    /api/elections/:electionId/voters/profile   # Get voter profile (voter)
```

## Legacy API (Backward Compatibility)

These routes still work but will be deprecated in future versions:
```
/api/auth/*
/api/voters/*
/api/otp/*
/api/face/*
/api/votes/*
/api/admin/*
```

## Migration Path

### For Frontend
1. Update API calls to use election-scoped routes
2. Add election selector UI
3. Pass electionId in all requests

### Example Migration
```javascript
// OLD
axios.get('/api/votes/results')

// NEW
axios.get(`/api/elections/${electionId}/votes/results`)
```

## Authentication

### Admin Routes
Require `Authorization: Bearer <admin_jwt>` header

### Voter Routes
Require `Authorization: Bearer <voter_jwt>` header

### Public Routes
No authentication required

## Middleware

### electionContext
Loads election from `:electionId` parameter and attaches to `req.election`

### requirePhase
Checks if election is in allowed phase(s)

### requireActiveElection
Checks if election is active

## Error Responses

```json
{
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

## Status Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error
