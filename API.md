# eVoteFace — Complete API Reference

**Base URL:** `http://localhost:5000/api`  
**Auth:** `Authorization: Bearer <JWT_TOKEN>`  
**Content-Type:** `application/json` (unless multipart noted)

---

## Table of Contents

1. [Authentication](#authentication)
2. [Public Elections](#public-elections)
3. [Admin — Elections](#admin--elections)
4. [Admin — Candidates](#admin--candidates)
5. [Admin — Voters](#admin--voters)
6. [Voter Endpoints](#voter-endpoints)
7. [Voting Flow (3-Factor)](#voting-flow-3-factor-authentication)
8. [Results](#results)
9. [Error Reference](#error-responses)

---

## Authentication

### POST `/auth/register`
Register a new voter account.

**Body:**
```json
{
  "fullName": "Alice Johnson",
  "email": "Alice@example.com",
  "password": "password123",
  "voterID": "VTR001",
  "aadharNumber": "123456789012",
  "age": 25,
  "gender": "Male",
  "address": "123 Main Street",
  "state": "Maharashtra",
  "city": "Nashik",
  "pincode": "422001",
  "contactNumber": "9876543210"
}
```

**Response 201:**
```json
{
  "message": "Registration successful. Please wait for admin approval.",
  "user": { "_id": "...", "fullName": "Alice Johnson", "email": "...", "role": "voter" }
}
```

---

### POST `/auth/login`
Voter login using Voter ID.

**Body:**
```json
{ "voterID": "VTR001", "password": "password123" }
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "_id": "...", "fullName": "...", "role": "voter", "elections": [] }
}
```

---

### POST `/auth/admin/login`
Admin login using email.

**Body:**
```json
{ "email": "admin@evoteface.com", "password": "adminpassword" }
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": { "_id": "...", "fullName": "Admin", "email": "...", "role": "admin" }
}
```

---

### GET `/auth/me`
Get current logged-in user/admin profile.

**Auth:** Required

**Response 200:** Full user or admin object (no password)

---

## Public Elections

### GET `/elections`
Get all public elections (registration, voting, upcoming).

**Auth:** Not required

**Response 200:**
```json
[
  {
    "_id": "69dfee3351dd7d56b6016f12",
    "title": "Presidential Election 2025",
    "description": "Annual presidential election",
    "contractAddress": "0x0f53e...",
    "phase": "voting",
    "startTime": "2025-04-18T00:00:00.000Z",
    "endTime": "2025-04-21T00:00:00.000Z"
  }
]
```

---

### GET `/elections/:electionId`
Get election details with candidates and voter count.

**Auth:** Not required

**Response 200:**
```json
{
  "_id": "...",
  "title": "Presidential Election 2025",
  "phase": "voting",
  "contractAddress": "0x...",
  "startTime": "...",
  "endTime": "...",
  "candidates": [
    {
      "_id": "...",
      "name": "Alice Johnson",
      "partyName": "Progressive Party",
      "partySymbol": "https://res.cloudinary.com/...",
      "onChainId": 1
    }
  ],
  "voterCount": 5
}
```

---

## Admin — Elections

### GET `/admin/elections`
Get all elections with stats.

**Auth:** Admin required

**Response 200:**
```json
[
  {
    "_id": "...",
    "title": "...",
    "phase": "registration",
    "stats": { "candidateCount": 3, "voterCount": 10, "votedCount": 0 }
  }
]
```

---

### POST `/admin/elections`
Create new election. Deploys smart contract on Sepolia.

**Auth:** Admin required

**Body:**
```json
{
  "title": "Presidential Election 2025",
  "description": "Annual presidential election",
  "startTime": "2025-04-18T00:00:00.000Z",
  "endTime": "2025-04-21T00:00:00.000Z"
}
```

**Response 201:**
```json
{
  "message": "Election created successfully",
  "election": { "_id": "...", "contractAddress": "0x...", "phase": "registration" },
  "txHash": "0xabc123..."
}
```

---

### POST `/admin/elections/:electionId/phase`
Change election phase.

**Auth:** Admin required

**Phase rules:**
- `registration` → `voting` ✅ (forward)
- `voting` → `completed` ✅ (forward)
- `voting` → `registration` ✅ only if 0 votes cast
- Any other backward transition ❌

**Body:**
```json
{ "phase": "voting" }
```

**Response 200:**
```json
{
  "message": "Phase changed successfully",
  "election": { "phase": "voting" },
  "txHash": "0x..."
}
```

---

### GET `/admin/elections/:electionId/results`
Get election results from blockchain (admin view with stats).

**Auth:** Admin required

**Response 200:**
```json
{
  "election": { "title": "...", "phase": "completed" },
  "candidates": [
    { "id": 1, "name": "Alice Johnson", "party": "Progressive Party", "voteCount": "42" }
  ],
  "winner": { "id": 1, "name": "Alice Johnson", "party": "Progressive Party", "voteCount": "42" },
  "stats": {
    "totalVotesCast": "42",
    "totalVoters": 50,
    "votedCount": 42,
    "turnoutPercentage": "84.00"
  }
}
```

---

## Admin — Candidates

### GET `/admin/elections/:electionId/candidates`
Get all candidates for an election.

**Auth:** Admin required

**Response 200:**
```json
[
  { "_id": "...", "name": "Alice Johnson", "partyName": "Progressive Party", "partySymbol": "https://...", "onChainId": 1 }
]
```

---

### POST `/admin/elections/:electionId/candidates`
Add candidate. Uploads symbol to Cloudinary, registers on blockchain.

**Auth:** Admin required  
**Content-Type:** `multipart/form-data`

**Body (form-data):**
- `name` — Candidate name
- `partyName` — Party name
- `partySymbol` — Image file (jpg/png)

**Response 201:**
```json
{
  "message": "Candidate added successfully",
  "candidate": { "_id": "...", "name": "Alice Johnson", "onChainId": 1 },
  "txHash": "0x..."
}
```

**Note:** Only works during `registration` phase.

---

### DELETE `/admin/elections/:electionId/candidates/:candidateId`
Remove candidate from election and blockchain.

**Auth:** Admin required

**Response 200:**
```json
{ "message": "Candidate removed successfully", "txHash": "0x..." }
```

**Note:** Only works during `registration` phase.

---

## Admin — Voters

### GET `/admin/elections/:electionId/voters`
Get all voters registered for an election.

**Auth:** Admin required

**Response 200:**
```json
[
  {
    "_id": "...",
    "fullName": "Pramod Deore",
    "email": "pramod@example.com",
    "voterID": "VTR001",
    "electionData": {
      "walletAddress": "0xEb65271b8EEB19150dA7940dF3a746ee20c2fAe0",
      "facePhotoUrl": "https://res.cloudinary.com/...",
      "isVerified": true,
      "isRegisteredOnChain": false,
      "hasVoted": false
    }
  }
]
```

---

### POST `/admin/elections/:electionId/voters/:userId/approve`
Approve voter for election.

**Auth:** Admin required

**Response 200:**
```json
{ "message": "Voter approved for election", "user": { "_id": "...", "fullName": "Pramod Deore" } }
```

---

### POST `/admin/elections/:electionId/voters/:userId/register-onchain`
Register voter wallet on blockchain.

**Auth:** Admin required  
**Note:** Election must be in `registration` phase.

**Body:**
```json
{ "walletAddress": "0xEb65271b8EEB19150dA7940dF3a746ee20c2fAe0" }
```

**Response 200:**
```json
{
  "message": "Voter registered on blockchain",
  "txHash": "0x...",
  "walletAddress": "0xEb65271b8EEB19150dA7940dF3a746ee20c2fAe0"
}
```

---

### POST `/admin/elections/:electionId/voters/:userId/face`
Upload voter face photo to Cloudinary.

**Auth:** Admin required  
**Content-Type:** `multipart/form-data`

**Body (form-data):**
- `facePhoto` — Image file

**Response 200:**
```json
{ "message": "Face photo uploaded successfully", "facePhotoUrl": "https://res.cloudinary.com/..." }
```

---

### DELETE `/admin/elections/:electionId/voters/:userId`
Remove voter from election.

**Auth:** Admin required

**Response 200:**
```json
{ "message": "Voter removed from election" }
```

**Error 400:** Cannot remove voter who has already voted.

---

## Voter Endpoints

### GET `/voters/profile`
Get voter profile.

**Auth:** Voter required

**Response 200:** Full voter object with elections array.

---

### GET `/voters/elections`
Get all elections the voter is registered in, with per-election status.

**Auth:** Voter required

**Response 200:**
```json
[
  {
    "_id": "...",
    "title": "Presidential Election 2025",
    "phase": "voting",
    "userStatus": {
      "isVerified": true,
      "walletAddress": "0x...",
      "facePhotoUrl": "https://...",
      "isRegisteredOnChain": true,
      "hasVoted": false
    }
  }
]
```

---

### GET `/voters/elections/:electionId/status`
Get voter's status for a specific election.

**Auth:** Voter required

**Response 200 (registered):**
```json
{
  "isRegistered": true,
  "isVerified": true,
  "walletAddress": "0x...",
  "walletConnected": true,
  "facePhotoUrl": "https://...",
  "faceRequired": false,
  "isRegisteredOnChain": true,
  "hasVoted": false,
  "votedAt": null,
  "electionPhase": "voting"
}
```

**Response 200 (not registered):**
```json
{ "isRegistered": false, "message": "You are not registered for this election" }
```

---

### POST `/voters/elections/:electionId/request-registration`
Request registration for an election. Voter provides their MetaMask wallet address.

**Auth:** Voter required

**Body:**
```json
{ "walletAddress": "0xEb65271b8EEB19150dA7940dF3a746ee20c2fAe0" }
```

**Response 200:**
```json
{
  "message": "Registration request submitted successfully. Waiting for admin approval.",
  "electionId": "...",
  "walletAddress": "0x..."
}
```

**Errors:**
- `400` — Already registered
- `400` — Admin wallet cannot be used
- `400` — Wallet already used by another voter

---

### POST `/voters/elections/:electionId/wallet`
Update wallet address (voter must be approved first).

**Auth:** Voter required

**Body:**
```json
{ "walletAddress": "0x..." }
```

**Response 200:**
```json
{ "message": "Wallet address saved successfully", "walletAddress": "0x..." }
```

---

## Voting Flow (3-Factor Authentication)

### Step 1 — MetaMask (client-side only)
Connect MetaMask wallet via ethers.js. No API call needed.

---

### Step 2 — POST `/face/verify`
Verify voter face using DeepFace AI.

**Auth:** Voter required

**Body:**
```json
{
  "liveImageBase64": "data:image/jpeg;base64,/9j/4AAQ...",
  "electionId": "69dfee3351dd7d56b6016f12"
}
```

**Response 200 (match):**
```json
{
  "success": true,
  "match": true,
  "confidence": 0.92,
  "distance": 0.28,
  "message": "Face verified successfully",
  "faceVerifiedToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response 200 (no match):**
```json
{
  "success": true,
  "match": false,
  "message": "Face does not match registered photo. Please try again in good lighting."
}
```

**Note:** `faceVerifiedToken` expires in 5 minutes.

---

### Step 3a — POST `/otp/send`
Send OTP to voter's email. Requires valid `faceVerifiedToken`.

**Auth:** Voter required

**Body:**
```json
{
  "faceVerifiedToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "electionId": "69dfee3351dd7d56b6016f12"
}
```

**Response 200:**
```json
{
  "message": "OTP sent successfully",
  "email": "pr***@gmail.com",
  "expiresIn": 300
}
```

**Rate limit:** 3 requests per 10 minutes per voter per election.

---

### Step 3b — POST `/otp/verify`
Verify OTP and receive vote authorization token.

**Auth:** Voter required

**Body:**
```json
{ "code": "123456", "electionId": "69dfee3351dd7d56b6016f12" }
```

**Response 200:**
```json
{
  "verified": true,
  "message": "OTP verified successfully",
  "voteAuthToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Note:** `voteAuthToken` expires in 2 minutes.

---

### Step 4 — Blockchain Vote (client-side)
Call `contract.castVote(candidateOnChainId)` via MetaMask using ethers.js.  
Contract address from election data. No API call — direct blockchain transaction.

---

### Step 5 — POST `/votes/record`
Record vote in database after blockchain transaction.

**Auth:** Voter required

**Body:**
```json
{
  "electionId": "69dfee3351dd7d56b6016f12",
  "candidateId": 1,
  "txHash": "0xabc123def456...",
  "voteAuthToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response 200:**
```json
{
  "message": "Vote recorded successfully",
  "txHash": "0xabc123def456...",
  "votedAt": "2025-04-18T10:30:00.000Z"
}
```

---

## Results

### GET `/votes/results/:electionId`
Get live or final election results from blockchain.

**Auth:** Not required

**Response 200:**
```json
{
  "election": {
    "title": "Presidential Election 2025",
    "phase": "completed",
    "startTime": "...",
    "endTime": "..."
  },
  "candidates": [
    { "id": 1, "name": "Alice Johnson", "party": "Progressive Party", "partySymbol": "https://...", "voteCount": "42" },
    { "id": 2, "name": "Bob Smith", "party": "National Party", "partySymbol": "https://...", "voteCount": "28" }
  ],
  "winner": { "id": 1, "name": "Alice Johnson", "party": "Progressive Party", "voteCount": "42" },
  "totalVotesCast": "70"
}
```

---

## Error Responses

All errors follow this format:
```json
{ "message": "Human-readable error description" }
```

| Code | Meaning |
|------|---------|
| 400 | Bad request / validation error |
| 401 | Unauthorized / invalid token |
| 403 | Forbidden / insufficient role |
| 404 | Resource not found |
| 429 | Rate limit exceeded |
| 500 | Server error |
| 503 | External service unavailable (face service / email) |

---

## Quick Reference Table

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | None | Register voter |
| POST | `/auth/login` | None | Voter login |
| POST | `/auth/admin/login` | None | Admin login |
| GET | `/auth/me` | Voter/Admin | Get current user |
| GET | `/elections` | None | List public elections |
| GET | `/elections/:id` | None | Election detail + candidates |
| GET | `/admin/elections` | Admin | All elections with stats |
| POST | `/admin/elections` | Admin | Create election + deploy contract |
| POST | `/admin/elections/:id/phase` | Admin | Change election phase |
| GET | `/admin/elections/:id/results` | Admin | Results from blockchain |
| GET | `/admin/elections/:id/candidates` | Admin | List candidates |
| POST | `/admin/elections/:id/candidates` | Admin | Add candidate |
| DELETE | `/admin/elections/:id/candidates/:cid` | Admin | Remove candidate |
| GET | `/admin/elections/:id/voters` | Admin | List voters |
| POST | `/admin/elections/:id/voters/:uid/approve` | Admin | Approve voter |
| POST | `/admin/elections/:id/voters/:uid/register-onchain` | Admin | Register wallet on blockchain |
| POST | `/admin/elections/:id/voters/:uid/face` | Admin | Upload face photo |
| DELETE | `/admin/elections/:id/voters/:uid` | Admin | Remove voter |
| GET | `/voters/profile` | Voter | Get voter profile |
| GET | `/voters/elections` | Voter | My registered elections |
| GET | `/voters/elections/:id/status` | Voter | Status for specific election |
| POST | `/voters/elections/:id/request-registration` | Voter | Request to join election |
| POST | `/voters/elections/:id/wallet` | Voter | Update wallet address |
| POST | `/face/verify` | Voter | Face verification (Step 2) |
| POST | `/otp/send` | Voter | Send OTP email (Step 3a) |
| POST | `/otp/verify` | Voter | Verify OTP (Step 3b) |
| POST | `/votes/record` | Voter | Record vote after blockchain tx |
| GET | `/votes/results/:id` | None | Public election results |
