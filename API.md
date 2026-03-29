# eVoteFace Backend API Documentation

## Base URL
```
http://localhost:5000/api
```

---

## Authentication Routes

### Register Voter
**POST** `/auth/register`

Register a new voter with credentials and face image.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "voterId": "VOT123456",
  "password": "SecurePassword123",
  "faceImage": "data:image/jpeg;base64,..."
}
```

**Response (201):**
```json
{
  "message": "Voter registered successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "voterId": "VOT123456",
    "isApproved": false
  }
}
```

---

### Voter Login
**POST** `/auth/login`

Login with Voter ID and password.

**Request Body:**
```json
{
  "voterId": "VOT123456",
  "password": "SecurePassword123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "voterId": "VOT123456",
    "hasVoted": false,
    "isApproved": true
  }
}
```

---

### Admin Login
**POST** `/auth/admin/login`

Login as administrator.

**Request Body:**
```json
{
  "username": "admin",
  "password": "AdminPassword123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "_id": "507f1f77bcf86cd799439012",
    "username": "admin",
    "role": "superadmin"
  }
}
```

---

### Get Current User
**GET** `/auth/me`

Get authenticated user details.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "name": "John Doe",
  "email": "john@example.com",
  "voterId": "VOT123456",
  "hasVoted": false,
  "isApproved": true
}
```

---

## Voting Routes

### Get Candidates
**GET** `/vote/candidates`

Fetch all candidates for current election.

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Candidate A",
    "party": "Party A",
    "partySymbol": "🔶",
    "voteCount": 150
  },
  {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Candidate B",
    "party": "Party B",
    "partySymbol": "🔷",
    "voteCount": 200
  }
]
```

---

### Cast Vote
**POST** `/vote/vote`

Cast a vote for a candidate (protected route).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "candidateId": "507f1f77bcf86cd799439013"
}
```

**Response (201):**
```json
{
  "message": "Vote cast successfully",
  "vote": {
    "_id": "507f1f77bcf86cd799439015",
    "voterId": "507f1f77bcf86cd799439011",
    "candidateId": "507f1f77bcf86cd799439013",
    "txnHash": "0x1234567890abcdef...",
    "timestamp": "2026-03-29T10:30:00Z"
  }
}
```

---

### Get Results
**GET** `/vote/results`

Get final election results (only after election closes).

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Candidate A",
    "party": "Party A",
    "voteCount": 150,
    "percentage": 42.86
  },
  {
    "_id": "507f1f77bcf86cd799439014",
    "name": "Candidate B",
    "party": "Party B",
    "voteCount": 200,
    "percentage": 57.14
  }
]
```

---

### Get Live Results
**GET** `/vote/results/live`

Get live results (admin only).

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439013",
    "name": "Candidate A",
    "voteCount": 150
  }
]
```

---

### Verify Face
**POST** `/vote/verify`

Verify voter's face before voting.

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,..."
}
```

**Response (200):**
```json
{
  "verified": true,
  "confidence": 0.95,
  "liveness": true
}
```

---

## Admin Routes

### Get All Voters
**GET** `/admin/voters`

List all registered voters.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "voterId": "VOT123456",
    "isApproved": true,
    "hasVoted": false
  }
]
```

---

### Approve Voter
**PATCH** `/admin/voters/:voterId/approve`

Approve a pending voter registration.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "message": "Voter approved successfully",
  "voter": {
    "_id": "507f1f77bcf86cd799439011",
    "isApproved": true
  }
}
```

---

### Reject Voter
**DELETE** `/admin/voters/:voterId/reject`

Reject or remove a voter.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "message": "Voter rejected successfully"
}
```

---

### Add Candidate
**POST** `/admin/candidates`

Add a new candidate.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "name": "Candidate C",
  "party": "Party C",
  "partySymbol": "🟢"
}
```

**Response (201):**
```json
{
  "message": "Candidate added successfully",
  "candidate": {
    "_id": "507f1f77bcf86cd799439016",
    "name": "Candidate C",
    "party": "Party C",
    "partySymbol": "🟢",
    "voteCount": 0
  }
}
```

---

### Update Candidate
**PATCH** `/admin/candidates/:candidateId`

Update candidate details.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "party": "Updated Party"
}
```

**Response (200):**
```json
{
  "message": "Candidate updated successfully",
  "candidate": {
    "_id": "507f1f77bcf86cd799439016",
    "name": "Updated Name",
    "party": "Updated Party"
  }
}
```

---

### Delete Candidate
**DELETE** `/admin/candidates/:candidateId`

Remove a candidate.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "message": "Candidate deleted successfully"
}
```

---

### Start Election
**POST** `/admin/election/start`

Start a new election.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Request Body:**
```json
{
  "title": "General Elections 2026",
  "endTime": "2026-03-29T18:00:00Z"
}
```

**Response (201):**
```json
{
  "message": "Election started successfully",
  "election": {
    "_id": "507f1f77bcf86cd799439017",
    "title": "General Elections 2026",
    "status": "active",
    "startTime": "2026-03-29T10:00:00Z",
    "endTime": "2026-03-29T18:00:00Z"
  }
}
```

---

### Stop Election
**PATCH** `/admin/election/stop`

Stop the current election.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "message": "Election stopped successfully",
  "election": {
    "_id": "507f1f77bcf86cd799439017",
    "status": "closed"
  }
}
```

---

### Get Dashboard Stats
**GET** `/admin/dashboard`

Get election statistics.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
{
  "totalVoters": 1000,
  "totalVotes": 856,
  "totalCandidates": 5,
  "turnout": 85.6,
  "electionStatus": "active",
  "startTime": "2026-03-29T10:00:00Z",
  "endTime": "2026-03-29T18:00:00Z"
}
```

---

### Get Audit Log
**GET** `/admin/audit-log`

Get all votes with details.

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response (200):**
```json
[
  {
    "_id": "507f1f77bcf86cd799439015",
    "voterId": "VOT123456",
    "candidateName": "Candidate A",
    "txnHash": "0x1234567890abcdef...",
    "timestamp": "2026-03-29T10:30:00Z"
  }
]
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Invalid input",
  "errors": ["Field is required"]
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthorized access"
}
```

### 403 Forbidden
```json
{
  "message": "Access denied"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Internal server error"
}
```

---

## Rate Limiting

- `/auth/*` - 10 requests/minute
- `/vote/vote` - 5 requests/minute
- Global - 100 requests/minute

---

## Authentication

All protected routes require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

Token expires in 1 hour. Use refresh token to get new token.

---

## Health Check

**GET** `/health`

Check backend service status.

**Response (200):**
```json
{
  "status": "ok",
  "service": "eVoteFace Backend",
  "timestamp": "2026-03-29T10:30:00.000Z",
  "uptime": 3600,
  "environment": "development"
}
```
