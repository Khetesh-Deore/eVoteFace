# eVoteFace — Complete Development Roadmap & Technical Implementation Plan

note: do not create extra file without coding part and no extra explanation


> **Project:** Decentralized Online Voting System with Face Recognition + Blockchain  
> **Stack:** MERN (MongoDB, Express, React, Node.js) + Python (Face Recognition) + Ethereum (Solidity)  
> **Deployment:** Vercel (Frontend) + Render (Backend) + Hugging Face Spaces (Python AI) + Hardhat/Alchemy (Blockchain)  
> **Reference Base:** ISE-Voting (IEEE IoT Journal, April 2025) + eVoteFace Project Report (Sanghavi College, 2025-26)

---

## Table of Contents

1. [Project Vision & What You Are Building](#1-project-vision)
2. [Three-Factor Authentication Design](#2-three-factor-authentication)
3. [Full System Architecture](#3-system-architecture)
4. [Technology Stack — Every Tool Explained](#4-technology-stack)
5. [Database Design](#5-database-design)
6. [Smart Contract Design](#6-smart-contract-design)
7. [Python Face Recognition Service Design](#7-python-face-recognition-service)
8. [Backend API Design — All Routes](#8-backend-api-design)
9. [Frontend Pages & Components](#9-frontend-pages--components)
10. [Phase-by-Phase Development Plan](#10-phase-by-phase-development-plan)
11. [Deployment Plan — Free Platforms](#11-deployment-plan)
12. [Environment Variables Reference](#12-environment-variables)
13. [Folder Structure](#13-folder-structure)
14. [Testing Checklist](#14-testing-checklist)
15. [Known Challenges & Solutions](#15-known-challenges--solutions)

---

## 1. Project Vision

### What Problem Are You Solving?

Traditional EVM-based voting requires voters to physically visit polling stations, causes long queues, has high logistics cost, and is vulnerable to impersonation and manipulation. Your project replaces this with a fully online, three-factor secured, blockchain-recorded voting system where:

- Votes are **immutable** — once cast, they cannot be altered or deleted
- Identity is **triple-verified** — wallet address + face + OTP
- Results are **publicly verifiable** — anyone can read the blockchain
- The process is **fully decentralized** — no single authority controls the count

### What You Are Improving Over the Base Paper (ISE-Voting)

The IEEE paper (ISE-Voting) used identity-based ring signatures and secret sharing for a cryptographic voting scheme but **explicitly acknowledged** in its conclusion that it does not address voter authentication using strong mechanisms like biometrics. Your project fills exactly that gap by adding:

- Biometric face recognition (Python + OpenCV + CNN)
- OTP via email (SMTP — Nodemailer)
- MetaMask wallet as first authentication factor

You are building an **improvised version** of the base paper — not a copy. This is your competitive academic argument.

### Core Security Properties Maintained (from Base Paper)

| Property | How Your System Achieves It |
|---|---|
| Unforgeability | Smart contract rejects duplicate wallet addresses; blockchain is immutable |
| Anonymity | Only vote hash stored on-chain; candidate choice not publicly linked to voter |
| Correctness | Smart contract tallies automatically; no human count |
| Verifiability | Anyone can read contract results; admin dashboard shows real-time count |
| Immutability | Ethereum blockchain — blocks cannot be altered |
| Fault Tolerance | Decentralized nodes; MongoDB for off-chain data with backups |

---

## 2. Three-Factor Authentication

This is the **core innovation** of your project. Every voter must pass all three factors before a vote is accepted.

### Factor 1 — MetaMask Wallet (Blockchain Identity)

- Voter connects their MetaMask wallet to the app
- The smart contract checks if that wallet address is registered by the admin
- If the wallet is not on the approved list, voting is blocked
- The wallet address serves as the voter's pseudonymous blockchain identity

### Factor 2 — Face Recognition (Biometric)

- During registration, the admin captures the voter's face image
- The face encoding (128-dimensional vector) is stored in MongoDB
- At vote time, the voter activates their webcam via the browser
- A live image is sent to the Python microservice
- The Python service compares the live face with the stored encoding using Euclidean distance
- Only if the distance is below a threshold (typically 0.6) does it return "verified"
- The React frontend receives this result and only then enables the OTP step

### Factor 3 — OTP via Email

- After face verification passes, the backend generates a 6-digit OTP
- The OTP is sent to the voter's registered email via Nodemailer (SMTP)
- The OTP is stored in MongoDB with a 5-minute expiry (TTL index)
- The voter enters the OTP in the UI
- Backend verifies OTP correctness and expiry
- Only after OTP verification does the backend authorize the MetaMask transaction

### Vote Casting Flow (Combined)

```
Voter Opens Voting Page
        ↓
[MetaMask Connected? Wallet Registered?] → NO → Block, show error
        ↓ YES
[Webcam Opens → Capture Face → Send to Python API]
        ↓
[Face Match >= 90% accuracy?] → NO → Block, show error
        ↓ YES
[Backend sends OTP to registered email]
        ↓
[Voter enters OTP → Backend verifies]
        ↓ WRONG/EXPIRED → Error
        ↓ CORRECT
[Frontend calls Smart Contract via Ethers.js]
        ↓
[MetaMask popup → Voter signs transaction]
        ↓
[Transaction confirmed on Ethereum]
        ↓
[Vote recorded permanently on blockchain]
        ↓
[Backend marks voter as "voted" in MongoDB]
        ↓
Success screen shown
```

---

## 3. System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                   REACT FRONTEND (Vercel)                │
│   Home | Register | Login | Admin | Voter | Results      │
└────────────┬───────────────────────┬────────────────────┘
             │ REST API (HTTP)       │ Ethers.js (Web3)
             ↓                       ↓
┌────────────────────┐    ┌──────────────────────────┐
│  EXPRESS BACKEND   │    │  ETHEREUM BLOCKCHAIN      │
│  (Render)          │    │  (Sepolia Testnet /       │
│                    │    │   Alchemy / Hardhat)      │
│  - Auth (JWT)      │    │                           │
│  - OTP (Nodemailer)│    │  Voting.sol Contract      │
│  - Voter CRUD      │    │  - registerVoter()        │
│  - Admin Routes    │    │  - addCandidate()         │
│  - Face Proxy      │    │  - castVote()             │
└─────────┬──────────┘    │  - getResults()           │
          │               │  - changePhase()          │
          │ HTTP          └──────────────────────────┘
          ↓
┌────────────────────┐    ┌──────────────────────────┐
│  PYTHON FACE API   │    │  MONGODB ATLAS            │
│  (Hugging Face     │    │                           │
│   Spaces / Render) │    │  - users collection       │
│                    │    │  - candidates collection  │
│  - face_recognition│    │  - otps collection        │
│  - OpenCV          │    │  - voters collection      │
│  - Flask REST API  │    │  - elections collection   │
│  - /encode         │    └──────────────────────────┘
│  - /verify         │
└────────────────────┘
```

### Data Flow Between Services

**Registration (Admin registers a voter):**
Admin panel → Express POST /admin/voters → MongoDB stores user data → Admin captures face → Image sent to Python /encode → Face encoding returned → Stored in MongoDB alongside user

**Authentication (Voter logs in):**
Voter enters Voter ID + password → Express POST /auth/login → MongoDB verifies credentials → JWT issued → Returned to browser → Stored in localStorage

**Voting (Three-factor flow):**
Voter page → MetaMask connect → Express GET /voters/me (check wallet registered) → Webcam capture → Image POST to Python /verify → Match result → If pass: Express POST /otp/send → Email sent → Voter enters OTP → Express POST /otp/verify → If pass: Frontend calls contract castVote() → MetaMask signs → TX confirmed → Express POST /votes/record (update MongoDB)

---

## 4. Technology Stack — Every Tool Explained

### Frontend

| Tool | Purpose | Why |
|---|---|---|
| React 18 | UI framework | Component-based, fast, ecosystem |
| React Router v6 | Client-side routing | Multi-page SPA navigation |
| Ethers.js v6 | Ethereum interaction | Connect MetaMask, call contract |
| Axios | HTTP client | API calls to Express backend |
| React Webcam | Camera access in browser | Capture voter face image |
| Tailwind CSS | Styling | Fast, utility-first, responsive |
| React Toastify | Notifications | Show success/error messages |
| Context API | Global state (auth, wallet) | Avoid prop drilling |

### Backend (Node.js + Express)

| Tool | Purpose | Why |
|---|---|---|
| Express.js | HTTP server framework | Lightweight, flexible |
| Mongoose | MongoDB ODM | Schema validation, querying |
| bcryptjs | Password hashing | Secure credential storage |
| jsonwebtoken | JWT auth | Stateless authentication |
| Nodemailer | Email sending | OTP delivery via SMTP |
| multer | File/image upload handling | Receive face images from frontend |
| cors | Cross-origin requests | Allow frontend to call backend |
| dotenv | Environment variable loading | Secrets management |
| ethers.js | Admin signs blockchain tx | Register voters on-chain from server |

### Python Service

| Tool | Purpose | Why |
|---|---|---|
| Flask | REST API framework | Simple, lightweight |
| face_recognition | Face encoding + comparison | Built on dlib, high accuracy |
| OpenCV (cv2) | Image preprocessing | Resize, normalize, decode images |
| Pillow | Image handling | Open/save image formats |
| numpy | Array operations | Face encoding distance calculations |
| gunicorn | Production WSGI server | Deploy Flask on Render/HuggingFace |

### Blockchain

| Tool | Purpose | Why |
|---|---|---|
| Solidity 0.8.x | Smart contract language | Ethereum standard |
| Hardhat | Development + testing | Local blockchain, deploy scripts |
| Ethers.js | Contract interaction | Same library used in frontend |
| Alchemy | Ethereum RPC provider | Free tier for Sepolia testnet |
| MetaMask | Voter wallet | Browser extension, widely used |
| OpenZeppelin | Solidity utilities | Ownable, access control patterns |

### Database

| Tool | Purpose | Why |
|---|---|---|
| MongoDB Atlas | Cloud database | Free M0 tier, flexible schema |
| Mongoose schemas | Data validation | Type-safe collections |

### Deployment

| Platform | What Goes There | Free Tier Limits |
|---|---|---|
| Vercel | React frontend | Unlimited deployments, CDN |
| Render | Express backend | 512MB RAM, sleeps after 15min inactivity |
| Hugging Face Spaces | Python face API | 16GB RAM on CPU Space (enough for face_recognition) |
| MongoDB Atlas | Database | 512MB free M0 cluster |
| Alchemy | Ethereum RPC | 300M compute units/month free |
| Sepolia Testnet | Smart contract | Free test ETH from faucets |

---

## 5. Database Design

### Collection: `users`

Stores all registered voters. Created by admin during voter registration.

```
Field           Type        Description
─────────────────────────────────────────────────────────
_id             ObjectId    Auto-generated MongoDB ID
fullName        String      Voter's full legal name
email           String      Unique, used for OTP delivery
password        String      bcrypt hashed
voterID         String      Unique government voter ID number
aadharNumber    String      Unique national ID (India context)
age             Number      Must be >= 18
gender          String      Male/Female/Other
address         String      Residential address
state           String      State of residence
city            String      City of residence
pincode         String      6-digit postal code
contactNumber   String      10-digit phone
faceEncoding    Array       128-dimensional float array from Python
faceImagePath   String      Path/URL to stored face image
walletAddress   String      Ethereum wallet address (set by voter or admin)
role            String      "voter" or "admin"
isVerified      Boolean     Admin approved this voter
hasVoted        Boolean     Default false, set true after vote cast
votedAt         Date        Timestamp of vote
createdAt       Date        Registration timestamp
```

### Collection: `candidates`

Created by admin. Not stored on-chain for reading, but contract holds authoritative data.

```
Field           Type        Description
─────────────────────────────────────────────────────────
_id             ObjectId    MongoDB ID
name            String      Candidate's full name
partyName       String      Political party name
partySymbol     String      URL/path to party logo image
onChainId       Number      Candidate ID as stored in smart contract
totalVotes      Number      Cached from blockchain (for display)
createdAt       Date        When added
```

### Collection: `otps`

Short-lived records. TTL index set on `expiresAt` for automatic deletion.

```
Field           Type        Description
─────────────────────────────────────────────────────────
_id             ObjectId    MongoDB ID
email           String      Voter email OTP was sent to
code            String      6-digit OTP
expiresAt       Date        5 minutes from creation (TTL index)
used            Boolean     Marks OTP as consumed after verification
```

### Collection: `elections`

Single document that tracks election state.

```
Field           Type        Description
─────────────────────────────────────────────────────────
_id             ObjectId    MongoDB ID
title           String      Election name
description     String      What this election is about
phase           String      "registration" | "voting" | "completed"
startTime       Date        Voting open time
endTime         Date        Voting close time
createdBy       ObjectId    Admin user ID
```

### Collection: `admins`

Separate from users for security isolation.

```
Field           Type        Description
─────────────────────────────────────────────────────────
_id             ObjectId    MongoDB ID
fullName        String      Admin name
email           String      Unique
password        String      bcrypt hashed
role            String      "superadmin" | "admin"
```

### MongoDB Indexes to Create

- `users.email` — unique index
- `users.voterID` — unique index
- `users.walletAddress` — unique sparse index (voter sets after registration)
- `otps.expiresAt` — TTL index (expire documents automatically)
- `candidates.onChainId` — unique index

---

## 6. Smart Contract Design

### Contract: `Voting.sol`

This contract is the single source of truth for votes. No vote exists unless it is in this contract.

### State Variables

```
address public owner              — The admin who deployed the contract
uint public totalCandidates       — Count of registered candidates
uint public totalVoters           — Count of registered voter wallets
uint public totalVotesCast        — Running count of votes

enum Phase { Registration, Voting, Completed }
Phase public currentPhase         — Current election phase

struct Candidate {
    uint id
    string name
    string party
    string partySymbol            — IPFS hash or URL for logo
    uint voteCount
    bool exists
}

struct Voter {
    address walletAddress
    bool isRegistered
    bool hasVoted
    uint votedFor                 — candidate ID
    uint timestamp                — when vote was cast
}

mapping(uint => Candidate) public candidates
mapping(address => Voter) public voters
```

### Functions

**Admin Functions (onlyOwner modifier)**

```
function addCandidate(string name, string party, string symbol)
    — Only callable by owner
    — Adds candidate to mapping
    — Increments totalCandidates
    — Can only be called during Registration phase

function registerVoter(address voterAddress)
    — Only callable by owner
    — Adds wallet to approved voters list
    — Can only be called during Registration phase

function changePhase(Phase newPhase)
    — Only callable by owner
    — Controls election lifecycle
    — Can only move forward: Registration → Voting → Completed

function removeCandidate(uint candidateId)
    — Only callable by owner
    — Only during Registration phase
```

**Voter Functions**

```
function castVote(uint candidateId)
    — Checks: currentPhase == Voting
    — Checks: voters[msg.sender].isRegistered == true
    — Checks: voters[msg.sender].hasVoted == false
    — Checks: candidates[candidateId].exists == true
    — Sets: voters[msg.sender].hasVoted = true
    — Sets: voters[msg.sender].votedFor = candidateId
    — Increments: candidates[candidateId].voteCount
    — Increments: totalVotesCast
    — Emits: VoteCast(msg.sender, candidateId, timestamp)
```

**Public Read Functions**

```
function getCandidate(uint id) returns (Candidate)
function getAllCandidates() returns (Candidate[])
function getVoterStatus(address wallet) returns (bool registered, bool voted)
function getWinner() returns (Candidate)
    — Only callable when phase is Completed
    — Returns candidate with highest voteCount
function getTotalVotes() returns (uint)
```

**Events (for frontend listening)**

```
event VoteCast(address indexed voter, uint indexed candidateId, uint timestamp)
event PhaseChanged(Phase newPhase, uint timestamp)
event CandidateAdded(uint id, string name, string party)
event VoterRegistered(address wallet)
```

### Contract Security Rules

- **onlyOwner** on all admin functions using OpenZeppelin Ownable
- **onlyDuringPhase** modifier wrapping all phase-sensitive functions
- **onlyRegistered** modifier for castVote
- **notAlreadyVoted** modifier for castVote
- No ETH transfers — this is a pure voting contract, no payments
- No selfdestruct — contract must remain accessible after election

---

## 7. Python Face Recognition Service Design

### Why a Separate Python Service?

The `face_recognition` library (built on dlib) is not available in Node.js. Running it as a separate Flask microservice keeps concerns separated, allows independent scaling, and makes deployment to Hugging Face Spaces straightforward.

### Endpoints

**POST `/encode`**

Called by Express backend when admin registers a voter's face.

Request:
```
Content-Type: multipart/form-data
Body: image file (JPEG/PNG, voter face photo)
```

Response (success):
```json
{
  "success": true,
  "encoding": [0.123, -0.456, ...],   ← 128 float values
  "message": "Face encoded successfully"
}
```

Response (failure — no face detected):
```json
{
  "success": false,
  "message": "No face detected in image. Please use a clear frontal photo."
}
```

Response (failure — multiple faces):
```json
{
  "success": false,
  "message": "Multiple faces detected. Please use a photo with only one person."
}
```

**POST `/verify`**

Called by Express backend during voting after webcam capture.

Request:
```json
{
  "liveImage": "base64_encoded_image_string",
  "storedEncoding": [0.123, -0.456, ...]   ← retrieved from MongoDB by Express
}
```

Response (success — match):
```json
{
  "success": true,
  "match": true,
  "distance": 0.42,
  "confidence": 0.85,
  "message": "Face verified successfully"
}
```

Response (success — no match):
```json
{
  "success": true,
  "match": false,
  "distance": 0.71,
  "confidence": 0.29,
  "message": "Face does not match registered voter"
}
```

### Internal Logic

**Encoding flow:**
1. Receive image file from multipart form
2. Use OpenCV to read and convert to RGB
3. Call `face_recognition.face_locations()` to detect faces
4. If not exactly one face found, return error
5. Call `face_recognition.face_encodings()` on detected face
6. Return the 128-float encoding array as JSON

**Verification flow:**
1. Receive base64 live image + stored encoding array
2. Decode base64 to numpy array
3. Convert to RGB
4. Detect face in live image
5. If no face found, return match: false with message
6. Compute encoding of live face
7. Call `face_recognition.compare_faces([storedEncoding], liveEncoding, tolerance=0.6)`
8. Compute Euclidean distance: `face_recognition.face_distance([storedEncoding], liveEncoding)`
9. Return match result, distance, and confidence score

### Preprocessing Steps (Important for Accuracy)

Before encoding, apply these steps to every image:
1. Resize image to max 800x800 (speed optimization)
2. Convert BGR to RGB (OpenCV reads BGR by default)
3. Apply histogram equalization for lighting normalization
4. This is especially important for webcam captures in varying lighting

---

## 8. Backend API Design — All Routes

### Auth Routes — `/api/auth`

```
POST /api/auth/register
    Body: { fullName, email, password, voterID, aadharNumber, age, gender, address, state, city, pincode, contactNumber }
    Logic: Hash password → Save to MongoDB with isVerified: false
    Response: 201 with user object (no password)
    Note: This is PUBLIC registration. Admin then approves.

POST /api/auth/login
    Body: { voterID, password }
    Logic: Find user by voterID → Compare bcrypt hash → Issue JWT
    Response: 200 with { token, user: { id, name, email, role, isVerified } }

POST /api/auth/admin/login
    Body: { email, password }
    Logic: Find in admins collection → Compare hash → Issue JWT with role: "admin"
    Response: 200 with { token, admin }

GET /api/auth/me
    Headers: Authorization: Bearer <token>
    Logic: Decode JWT → Return full user object
    Response: 200 with user
```

### Voter Routes — `/api/voters`

All routes require valid voter JWT unless marked otherwise.

```
GET /api/voters/status
    Logic: Check if walletAddress is registered on-chain (call contract) + check hasVoted in MongoDB
    Response: { isRegistered, hasVoted, faceRequired, walletConnected }

POST /api/voters/wallet
    Body: { walletAddress }
    Logic: Save wallet address to user document in MongoDB
    Note: Wallet is only saved off-chain here. Admin registers it on-chain separately.
    Response: 200 with updated user

GET /api/voters/profile
    Logic: Return voter profile (name, age, voterID, hasVoted, walletAddress)
    Response: 200 with voter profile (no face encoding, no password)
```

### OTP Routes — `/api/otp`

```
POST /api/otp/send
    Headers: Authorization: Bearer <token>
    Logic: 
        1. Verify voter JWT
        2. Check face_verified flag in session (or pass faceVerified: true in body — validate server-side)
        3. Generate crypto.randomInt(100000, 999999) — 6 digits
        4. Save to otps collection with expiresAt: Date.now() + 5min
        5. Send email via Nodemailer
    Response: 200 with { message: "OTP sent to registered email" }
    Rate limit: Max 3 OTP requests per voter per 10 minutes

POST /api/otp/verify
    Body: { code }
    Headers: Authorization: Bearer <token>
    Logic:
        1. Find OTP by voter email where used: false and expiresAt > now
        2. Compare codes
        3. If match: mark used: true, return success token/flag
        4. If mismatch: increment attempt counter, block after 5 failures
    Response: 200 with { verified: true, voteAuthToken: "short-lived-token" }
    Note: The voteAuthToken is a separate short-lived JWT (2 min) that the frontend must present when calling the vote recording endpoint
```

### Face Routes — `/api/face`

```
POST /api/face/verify
    Headers: Authorization: Bearer <token>
    Body: { liveImageBase64 }
    Logic:
        1. Get voter's stored faceEncoding from MongoDB
        2. Forward both to Python service POST /verify
        3. Receive match result
        4. If match: set session/cache flag that face is verified (use Redis or JWT claim)
        5. Return result to frontend
    Response: { match: true/false, confidence: 0.85 }
    Security: Never send the stored encoding to the frontend
```

### Vote Routes — `/api/votes`

```
POST /api/votes/record
    Headers: Authorization: Bearer <token>
    Body: { candidateId, txHash, voteAuthToken }
    Logic:
        1. Verify main JWT
        2. Verify voteAuthToken (short-lived, proves OTP was passed)
        3. Confirm txHash on Ethereum via Alchemy RPC (check tx receipt)
        4. Verify tx was to the correct contract address
        5. Verify tx was called by the voter's registered wallet
        6. If all pass: update MongoDB user hasVoted: true, votedAt: now
        7. If already voted in MongoDB but not on chain: block
    Response: 200 with { message: "Vote recorded" }
    Note: This endpoint is the "backup ledger" — the blockchain is the primary record

GET /api/votes/results
    No auth required (public)
    Logic: Call getAllCandidates() on smart contract via Alchemy RPC
    Response: Array of { name, party, voteCount }
```

### Admin Routes — `/api/admin`

All routes require admin JWT.

```
GET /api/admin/voters
    Logic: Return paginated list of all users with voting status
    Response: { voters: [...], total, page }

POST /api/admin/voters/:id/approve
    Logic: Set user.isVerified = true in MongoDB
    Response: 200 with updated user

POST /api/admin/voters/:id/register-onchain
    Body: { walletAddress }
    Logic:
        1. Admin backend wallet (loaded from env) connects to contract
        2. Call contract.registerVoter(walletAddress)
        3. Wait for tx confirmation
        4. Save walletAddress to user document
    Response: 200 with { txHash }

DELETE /api/admin/voters/:id
    Logic: Remove user from MongoDB (does not remove from blockchain)
    Response: 200

POST /api/admin/candidates
    Body: { name, partyName, partySymbol }
    Logic:
        1. Admin backend wallet calls contract.addCandidate(name, partyName, symbolURL)
        2. Wait for confirmation
        3. Store candidate in MongoDB with onChainId
    Response: 201 with candidate object

GET /api/admin/candidates
    Logic: Read from MongoDB (faster) or directly from contract
    Response: Array of candidates

DELETE /api/admin/candidates/:id
    Logic: Call contract.removeCandidate(id) then remove from MongoDB
    Response: 200

POST /api/admin/election/phase
    Body: { phase: "voting" | "completed" }
    Logic:
        1. Validate phase transition (can only go forward)
        2. Call contract.changePhase(newPhase)
        3. Update election document in MongoDB
    Response: 200 with { newPhase, txHash }

GET /api/admin/election
    Logic: Return current election config + phase from MongoDB
    Response: election object

POST /api/admin/voters/:id/face
    Content-Type: multipart/form-data
    Body: image file
    Logic:
        1. Receive image via multer
        2. POST image to Python /encode endpoint
        3. Receive 128-float encoding
        4. Store encoding + image path in user document
    Response: 200 with { message: "Face registered" }

GET /api/admin/results
    Logic: Call getAllCandidates() on contract + call getWinner()
    Response: { candidates, winner, totalVotes }
```

---

## 9. Frontend Pages & Components

### Pages

**`/` — Home Page**
- Hero section with project description and three-factor auth explanation
- Login and Register buttons
- How it works (3 steps visual)
- Project stats (total candidates, phase status, total votes — public)

**`/register` — Voter Registration**
- Form fields: Full name, age, gender, Voter ID, Aadhar number, email, contact, address, state, city, pincode, password
- Submit → creates account with isVerified: false
- Show message: "Registration submitted. Please wait for admin approval."

**`/login` — Voter Login**
- Voter ID + password fields
- On success: store JWT in localStorage, redirect to /dashboard
- Link to register
- Link to admin login

**`/admin/login` — Admin Login**
- Email + password
- On success: store admin JWT, redirect to /admin/dashboard

**`/dashboard` — Voter Dashboard**
- Shows voter profile (name, voter ID, address)
- Current election info (phase, candidates count)
- Voting status (not yet voted / voted on [date])
- Wallet connection status
- "Connect MetaMask" button if not connected
- "Cast Your Vote" button — only active if: phase is voting + wallet connected + not yet voted
- Link to results

**`/vote` — Voting Page (Protected)**
Access guard: must have JWT + wallet connected + isVerified + phase must be "voting"

Step 1 — Wallet Verification:
- Show connected wallet address
- Backend confirms it is registered on-chain
- Show: "Wallet verified ✓" or "Wallet not registered — contact admin"

Step 2 — Face Verification:
- React Webcam component activates camera
- "Scan Face" button
- Captures frame as base64 JPEG
- POST to Express /api/face/verify
- Show: "Face Verified ✓" with confidence score or "Face not matched ✗ Try again"

Step 3 — OTP Verification:
- Appears only after face verification passes
- "Send OTP to my email" button
- Shows masked email: "OTP sent to m***@gmail.com"
- 6-digit OTP input
- Submit OTP → Express verifies → Returns voteAuthToken
- Show: "OTP Verified ✓"

Step 4 — Cast Vote:
- Appears only after OTP verified
- Cards for each candidate with party name, party logo, and vote button
- "Cast Vote" click → MetaMask popup opens → Voter signs transaction
- After TX confirmed: POST /api/votes/record with txHash + voteAuthToken
- Success animation and message

**`/results` — Public Results Page**
- No authentication required
- Show election title and current phase
- If phase is "voting": show live vote counts (refreshes every 30 seconds)
- If phase is "completed": show full results with winner highlighted
- Bar chart or card-based candidate vote display
- Total votes cast count

**`/admin/dashboard` — Admin Home**
- Summary cards: total voters, verified voters, votes cast, candidates registered
- Current phase indicator with phase change button
- Quick links to all admin sections

**`/admin/voters` — Voter Management**
- Table: name, voter ID, email, wallet, face registered, verified status, voted status
- Actions per row: Approve voter, Register wallet on-chain, Upload face photo
- Search and filter
- Pagination

**`/admin/candidates` — Candidate Management**
- List of candidates with party logos
- Add candidate form: name, party name, party logo upload
- Delete candidate button
- Phase warning: candidates can only be added in Registration phase

**`/admin/face-upload` — Face Registration**
- Select voter from dropdown
- Webcam capture or file upload
- Submit → Python service encodes → Store in MongoDB
- Preview of captured face

**`/admin/results` — Admin Results View**
- Same as public results but with more detail
- CSV export option (voter participation stats, not vote choices)
- Winner declaration button (only in Completed phase)

### Key Components

**`MetaMaskConnect`** — Button that triggers wallet connection via ethers.js, displays connected address

**`WebcamCapture`** — Uses react-webcam, shows live feed, capture button, sends to API

**`OTPInput`** — Six-digit input component with auto-focus between cells

**`CandidateCard`** — Displays candidate name, party, logo, vote count (in results), vote button

**`PhaseIndicator`** — Shows current election phase visually (Registration / Voting / Completed)

**`ProtectedRoute`** — HOC/wrapper that checks JWT and role before rendering a page

**`AdminRoute`** — Same but checks admin role

### Context / State Management

**`AuthContext`** — Stores: token, user object, login(), logout(), isAdmin
**`WalletContext`** — Stores: provider, signer, address, connectWallet(), isConnected
**`ElectionContext`** — Stores: currentPhase, candidates, totalVotes, refresh()

---

## 10. Phase-by-Phase Development Plan

### Phase 0 — Setup (Days 1-2)

- Create GitHub repository with three folders: `client/`, `server/`, `blockchain/`, `python-service/`
- Initialize React app with Create React App or Vite in `client/`
- Initialize Node project in `server/` with `npm init`
- Initialize Hardhat project in `blockchain/` with `npx hardhat init`
- Create Python project folder `python-service/` with `requirements.txt`
- Set up MongoDB Atlas — create free M0 cluster, get connection string
- Create `.env` files for each service (add to `.gitignore` immediately)
- Set up Alchemy account — create Sepolia app, get RPC URL
- Install MetaMask browser extension, create test wallet

### Phase 1 — Smart Contract (Days 3-5)

Goal: A working, tested Voting.sol deployed on local Hardhat network.

Steps:
1. Write `Voting.sol` with all structs, mappings, modifiers, and functions described in Section 6
2. Write `test/Voting.test.js` — test every function including failure cases
3. Run `npx hardhat test` — all tests must pass
4. Write `scripts/deploy.js` — deployment script
5. Run `npx hardhat node` — start local blockchain
6. Run `npx hardhat run scripts/deploy.js --network localhost`
7. Copy the deployed contract address and ABI to `server/` and `client/` config files
8. Once local tests pass, deploy to Sepolia: `npx hardhat run scripts/deploy.js --network sepolia`

Verification checkpoints:
- Can add candidates from script
- Can register voter address from script
- Can change phase
- Can cast vote from a registered voter address
- Cannot double-vote from same address
- Cannot vote from unregistered address

### Phase 2 — Python Face Service (Days 6-8)

Goal: A Flask API that accurately encodes and verifies faces.

Steps:
1. Create virtual environment: `python -m venv venv`
2. Install dependencies: `pip install flask face_recognition opencv-python pillow numpy gunicorn`
3. Write `app.py` with `/encode` and `/verify` endpoints
4. Write `/health` endpoint (returns 200 OK — needed for deployment checks)
5. Test locally with Postman — use sample face images
6. Test with different lighting, angles, and camera qualities
7. Tune the tolerance threshold — start at 0.6, test with your faces
8. Add error handling for all edge cases (no face, multiple faces, corrupt image)
9. Create `requirements.txt` with pinned versions
10. Create `Dockerfile` as backup (Render accepts this)

Testing checklist:
- Same person, same image → match: true, distance < 0.4
- Same person, different photo → match: true, distance < 0.6
- Different person → match: false, distance > 0.6
- No face in image → error message returned, not crash
- Base64 encoded image → decodes correctly

### Phase 3 — Express Backend (Days 9-14)

Goal: All API routes working, tested with Postman, connected to MongoDB and Python service.

Build in this order:

**Step 3.1 — Project setup**
- `npm install express mongoose bcryptjs jsonwebtoken nodemailer multer cors dotenv axios`
- Create folder structure: `routes/`, `models/`, `middleware/`, `utils/`, `config/`
- Connect to MongoDB Atlas in `config/db.js`
- Create base Express app with cors, json parsing

**Step 3.2 — Mongoose models**
- Create User model with all fields from Section 5
- Create OTP model with TTL index
- Create Candidate model
- Create Election model
- Create Admin model

**Step 3.3 — Auth routes**
- POST /auth/register
- POST /auth/login
- POST /auth/admin/login
- GET /auth/me
- Write `middleware/auth.js` — JWT verification middleware
- Write `middleware/adminAuth.js` — admin role check

**Step 3.4 — Admin voter management routes**
- GET, DELETE /admin/voters
- POST /admin/voters/:id/approve
- POST /admin/voters/:id/register-onchain (this calls Ethereum via Ethers.js)
- POST /admin/voters/:id/face (calls Python service)
- Create `utils/blockchain.js` — admin wallet + contract instance using Ethers.js + Alchemy RPC

**Step 3.5 — Admin candidate routes**
- POST, GET, DELETE /admin/candidates
- Each POST/DELETE calls the smart contract

**Step 3.6 — Admin election routes**
- POST /admin/election/phase
- GET /admin/election

**Step 3.7 — Face verification route**
- POST /api/face/verify
- Middleware: retrieve voter's stored encoding from MongoDB, POST to Python

**Step 3.8 — OTP routes**
- POST /api/otp/send — create Nodemailer transporter in `utils/mailer.js`
- POST /api/otp/verify — return short-lived voteAuthToken

**Step 3.9 — Vote recording route**
- POST /api/votes/record
- GET /api/votes/results (reads from blockchain)

**Step 3.10 — Voter routes**
- GET /api/voters/status
- POST /api/voters/wallet
- GET /api/voters/profile

Test every endpoint in Postman before moving to frontend.

### Phase 4 — React Frontend (Days 15-22)

Goal: Complete UI connected to all backend endpoints.

Build in this order:

**Step 4.1 — Setup**
- `npm install axios ethers react-router-dom tailwindcss react-webcam react-toastify`
- Configure Tailwind
- Create `src/context/AuthContext.jsx` and `src/context/WalletContext.jsx`
- Create `src/utils/api.js` — Axios instance with base URL and auth header interceptor
- Create `src/utils/contract.js` — Ethers.js contract instance factory

**Step 4.2 — Routing**
- Set up React Router with all routes in `App.jsx`
- Create `ProtectedRoute` and `AdminRoute` wrapper components

**Step 4.3 — Auth pages**
- Register page with full form
- Login page
- Admin login page

**Step 4.4 — Admin pages**
- Admin dashboard
- Voter management table
- Candidate management
- Face upload interface with webcam
- Election phase control
- Results view

**Step 4.5 — Voter flow pages**
- Voter dashboard
- Voting page with step-by-step three-factor UI
- Results public page

**Step 4.6 — Webcam and MetaMask integration**
- MetaMask connect button using window.ethereum via Ethers.js
- React Webcam component for face capture
- OTP input component

**Step 4.7 — Polish**
- Loading states on all async operations
- Error messages from API displayed clearly
- Responsive design for mobile
- Phase-gated UI (buttons disabled based on election phase)

### Phase 5 — Integration Testing (Days 23-25)

Run the full voter flow from end to end:

1. Start all services locally (React on 3000, Express on 5000, Python on 8000, Hardhat on 8545)
2. Open admin panel → add candidates → register test voters → upload faces → register on-chain
3. Change phase to Voting
4. Open voter account → connect MetaMask → face scan → OTP → cast vote
5. Check blockchain: verify vote transaction exists
6. Check MongoDB: verify hasVoted: true
7. Admin panel: verify results show correct counts
8. Change phase to Completed
9. Results page: verify winner shown

Edge cases to test:
- Voter tries to vote twice → blocked
- Wrong OTP → blocked
- Different face → blocked
- Unregistered wallet → blocked
- Vote during Registration phase → blocked

---

## 11. Deployment Plan

### Step 1 — Deploy Python Face Service to Hugging Face Spaces

1. Go to huggingface.co → New Space → Choose "Gradio" or "Docker" (choose Docker for Flask)
2. Create a new public Space named `evoteface-face-api`
3. Upload your python-service files: `app.py`, `requirements.txt`, `Dockerfile`
4. Hugging Face builds and runs automatically
5. Your API will be available at `https://YOUR-USERNAME-evoteface-face-api.hf.space`
6. Test `/health` endpoint first
7. Note: Cold start takes ~60 seconds on HuggingFace free tier — acceptable for demo

Alternative: Deploy on Render as a Python web service (easier setup, 512MB RAM — sufficient).

### Step 2 — Deploy Express Backend to Render

1. Go to render.com → New Web Service → Connect GitHub repo
2. Root directory: `server/`
3. Build command: `npm install`
4. Start command: `node server.js`
5. Set all environment variables in Render dashboard (see Section 12)
6. Free tier note: service sleeps after 15 min inactivity, wakes in ~30 sec
7. Get the Render URL: `https://evoteface-backend.onrender.com`

### Step 3 — Deploy Smart Contract to Sepolia Testnet

1. Get Sepolia test ETH from faucets: `sepoliafaucet.com` or `faucets.chain.link`
2. Add Sepolia network to Hardhat config with Alchemy RPC URL
3. Add your admin private key to hardhat config (via env var, never hardcoded)
4. Run: `npx hardhat run scripts/deploy.js --network sepolia`
5. Note the deployed contract address
6. Verify on Etherscan Sepolia for credibility (optional)

### Step 4 — Deploy React Frontend to Vercel

1. Go to vercel.com → New Project → Import GitHub repo
2. Root directory: `client/`
3. Framework: Create React App or Vite
4. Set environment variables (REACT_APP_API_URL, REACT_APP_CONTRACT_ADDRESS, etc.)
5. Deploy
6. Get URL: `https://evoteface.vercel.app`

### Environment Variable Coordination

After all deployments, update each service's environment variables with the other services' URLs:
- Express backend gets: Python service URL, MongoDB URL, Alchemy URL, contract address
- React frontend gets: Express backend URL, contract address, chain ID

---

## 12. Environment Variables

### Server `.env`

```
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/evoteface

# JWT
JWT_SECRET=your_very_long_random_secret_string_here
JWT_EXPIRES_IN=7d
VOTE_AUTH_TOKEN_SECRET=another_different_secret_string
VOTE_AUTH_TOKEN_EXPIRES_IN=2m

# Email (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your.email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM=eVoteFace System <your.email@gmail.com>

# Blockchain
ALCHEMY_SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
ADMIN_WALLET_PRIVATE_KEY=0xYOUR_ADMIN_WALLET_PRIVATE_KEY
CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS

# Python Service
PYTHON_FACE_API_URL=https://your-hf-space.hf.space

# Server
PORT=5000
NODE_ENV=production

# Rate limiting
OTP_RATE_LIMIT_WINDOW_MS=600000
OTP_RATE_LIMIT_MAX=3
```

### Client `.env`

```
REACT_APP_API_URL=https://evoteface-backend.onrender.com/api
REACT_APP_CONTRACT_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
REACT_APP_CHAIN_ID=11155111
REACT_APP_CHAIN_NAME=Sepolia
```

### Python Service `.env`

```
FACE_MATCH_TOLERANCE=0.6
MAX_IMAGE_SIZE_MB=5
PORT=8000
```

### Hardhat `hardhat.config.js` needs from environment

```
ALCHEMY_SEPOLIA_URL (for Sepolia deployment)
ADMIN_WALLET_PRIVATE_KEY (for signing deployment transaction)
ETHERSCAN_API_KEY (optional, for contract verification)
```

**Important for Gmail SMTP:** You must enable 2-Factor Authentication on Gmail and create an "App Password" specifically for this application. Do not use your main Gmail password.

---

## 13. Folder Structure

```
evoteface/
│
├── client/                          ← React Frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── ProtectedRoute.jsx
│   │   │   │   ├── AdminRoute.jsx
│   │   │   │   ├── LoadingSpinner.jsx
│   │   │   │   └── PhaseIndicator.jsx
│   │   │   ├── voter/
│   │   │   │   ├── MetaMaskConnect.jsx
│   │   │   │   ├── WebcamCapture.jsx
│   │   │   │   ├── OTPInput.jsx
│   │   │   │   └── CandidateCard.jsx
│   │   │   └── admin/
│   │   │       ├── VoterTable.jsx
│   │   │       ├── CandidateForm.jsx
│   │   │       └── FaceUpload.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── VotingPage.jsx
│   │   │   ├── Results.jsx
│   │   │   └── admin/
│   │   │       ├── AdminLogin.jsx
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── ManageVoters.jsx
│   │   │       ├── ManageCandidates.jsx
│   │   │       ├── FaceRegistration.jsx
│   │   │       ├── ElectionControl.jsx
│   │   │       └── AdminResults.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── WalletContext.jsx
│   │   │   └── ElectionContext.jsx
│   │   ├── utils/
│   │   │   ├── api.js               ← Axios instance
│   │   │   └── contract.js          ← Ethers.js contract setup
│   │   ├── App.jsx
│   │   └── index.jsx
│   ├── .env
│   └── package.json
│
├── server/                          ← Express Backend
│   ├── config/
│   │   └── db.js                   ← MongoDB connection
│   ├── models/
│   │   ├── User.js
│   │   ├── Admin.js
│   │   ├── Candidate.js
│   │   ├── Election.js
│   │   └── OTP.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── voters.js
│   │   ├── otp.js
│   │   ├── face.js
│   │   ├── votes.js
│   │   └── admin.js
│   ├── middleware/
│   │   ├── auth.js                 ← JWT verification
│   │   ├── adminAuth.js            ← Admin role check
│   │   ├── rateLimiter.js          ← OTP rate limiting
│   │   └── upload.js               ← Multer config
│   ├── utils/
│   │   ├── blockchain.js           ← Admin wallet + contract calls
│   │   ├── mailer.js               ← Nodemailer setup
│   │   └── faceService.js          ← Axios calls to Python API
│   ├── .env
│   ├── server.js
│   └── package.json
│
├── blockchain/                      ← Hardhat Project
│   ├── contracts/
│   │   └── Voting.sol
│   ├── scripts/
│   │   └── deploy.js
│   ├── test/
│   │   └── Voting.test.js
│   ├── artifacts/                  ← Auto-generated, contains ABI
│   ├── hardhat.config.js
│   └── package.json
│
├── python-service/                  ← Flask Face Recognition API
│   ├── app.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
│
└── README.md
```

---

## 14. Testing Checklist

### Smart Contract Tests (Hardhat)

- [ ] Owner can add candidates
- [ ] Non-owner cannot add candidates
- [ ] Owner can register voter wallet
- [ ] Non-owner cannot register voter wallet
- [ ] Owner can change phase
- [ ] Cannot skip phases (Registration → Completed directly)
- [ ] Registered voter can cast vote in Voting phase
- [ ] Unregistered wallet cannot vote
- [ ] Voter cannot vote twice
- [ ] Cannot vote during Registration phase
- [ ] Cannot vote during Completed phase
- [ ] Vote count increments correctly
- [ ] getWinner returns correct candidate
- [ ] Events are emitted correctly

### Python Service Tests (Manual with Postman)

- [ ] /health returns 200
- [ ] /encode with valid face image returns 128-float array
- [ ] /encode with no face returns error
- [ ] /encode with multiple faces returns error
- [ ] /verify with matching face returns match: true
- [ ] /verify with different person returns match: false
- [ ] /verify with no face in live image returns match: false
- [ ] /verify with corrupt base64 returns 400 error

### Backend API Tests (Postman Collection)

- [ ] Register voter → 201 with user object
- [ ] Login with correct credentials → 200 with JWT
- [ ] Login with wrong password → 401
- [ ] Access protected route without JWT → 401
- [ ] Admin login → 200 with admin JWT
- [ ] Admin approve voter → 200
- [ ] Admin register voter on-chain → 200 with txHash
- [ ] Admin add candidate → 201
- [ ] OTP sent → email received (check inbox)
- [ ] OTP verified correctly → 200 with voteAuthToken
- [ ] OTP wrong → 400
- [ ] OTP expired → 400
- [ ] Face verify with correct voter → match result
- [ ] Vote record with valid txHash + voteAuthToken → 200
- [ ] Vote record with expired voteAuthToken → 401
- [ ] Public results accessible without auth → 200

### End-to-End Voter Flow Test

- [ ] Voter registers account
- [ ] Admin approves voter
- [ ] Admin uploads voter face photo
- [ ] Admin registers voter wallet on-chain
- [ ] Phase changed to Voting
- [ ] Voter logs in
- [ ] Voter connects MetaMask with registered wallet
- [ ] Dashboard shows correct status
- [ ] Voter opens voting page
- [ ] Voter scans face → verified
- [ ] Voter receives OTP on email
- [ ] Voter enters OTP → verified
- [ ] Voter selects candidate and votes
- [ ] MetaMask popup appears → voter confirms
- [ ] Success message shown
- [ ] Voter cannot vote again (vote button disabled)
- [ ] Admin panel shows voter has voted
- [ ] Results page shows vote count increased

---

## 15. Known Challenges & Solutions

### Challenge 1 — Render Backend Cold Starts

**Problem:** Render free tier sleeps after 15 minutes of inactivity. First request after sleep takes 30-60 seconds.

**Solution:** Add a health-check ping from the frontend every 10 minutes using `setInterval`. Alternatively, use a free uptime monitoring service like UptimeRobot to ping your backend URL every 5 minutes.

### Challenge 2 — Hugging Face Spaces / Face Recognition Library Size

**Problem:** `face_recognition` and `dlib` are large packages (500MB+). HuggingFace Spaces may timeout during build.

**Solution:** Use a pre-built Docker image that includes dlib. Your Dockerfile should start from `FROM animcogn/face_recognition:cpu`. This avoids compiling dlib from scratch. Alternative: Deploy Python service on Render as a Docker service.

### Challenge 3 — Webcam Permissions on HTTPS

**Problem:** Browser only allows webcam access on HTTPS or localhost. Your deployed frontend is on Vercel (HTTPS). Your backend on Render (HTTPS). This is fine. But during development, if you access the frontend via your local IP instead of localhost, camera will be blocked.

**Solution:** Always use `localhost` during development, not `192.168.x.x`. In production, all services use HTTPS, so no issue.

### Challenge 4 — MetaMask Network Mismatch

**Problem:** Voter may have MetaMask set to Ethereum Mainnet when you are using Sepolia.

**Solution:** Detect the chainId in WalletContext when connecting. If it does not match your expected chain ID, display a clear message: "Please switch to Sepolia Testnet in MetaMask" and programmatically request the switch using `wallet_switchEthereumChain`.

### Challenge 5 — Verifying Transaction Hash Server-Side

**Problem:** After MetaMask signs the vote transaction, you POST the txHash to your backend. But how do you verify the txHash is real and was sent to your contract?

**Solution:** In `/api/votes/record`, use Ethers.js with Alchemy RPC to call `provider.getTransactionReceipt(txHash)`. Check that:
- `receipt.to === CONTRACT_ADDRESS` (lowercase compare)
- `receipt.from === voter.walletAddress` (lowercase compare)
- `receipt.status === 1` (transaction succeeded)
- Parse the receipt logs to confirm the `VoteCast` event was emitted

### Challenge 6 — Face Recognition Accuracy in Poor Lighting

**Problem:** Webcam images in dark environments can fail face matching even for the same person.

**Solution:** During face verification on the voting page, add a UI hint: "Please ensure your face is well-lit and facing the camera directly." Apply histogram equalization in the Python service before encoding. Set a slightly more lenient tolerance (0.65 instead of 0.6) for live comparisons. Show the confidence score to the user so they understand why it failed.

### Challenge 7 — CORS Issues Between Services

**Problem:** React (Vercel) calls Express (Render) which calls Python (HuggingFace) — cross-origin at every step.

**Solution:**
- Express: `app.use(cors({ origin: 'https://your-vercel-url.vercel.app' }))` — specify exact origin, not `*` in production
- Python Flask: `from flask_cors import CORS; CORS(app)` — allow all origins on the Python service since it only receives requests from Express (server-to-server)

### Challenge 8 — OTP Email Going to Spam

**Problem:** OTP emails sent via Gmail SMTP may land in spam.

**Solution:** Use a Google Workspace account instead of Gmail personal for production. During development and demo, use Gmail app passwords. Add clear sender name "eVoteFace System" and avoid spammy subject lines. Use: `Subject: Your eVoteFace OTP — [CODE]`.

### Challenge 9 — Sepolia Test ETH Running Out

**Problem:** Every admin action (add candidate, register voter, change phase) costs Sepolia test ETH.

**Solution:** Claim from multiple faucets. Use Alchemy's Sepolia faucet (requires account, gives 0.5 ETH/day). Batch operations where possible. For demo: only add 2-3 candidates and 2-3 voters to minimize transactions.

### Challenge 10 — Session Management for Three-Factor State

**Problem:** How do you track "this voter has passed face verification" between the face API call and the OTP send? You cannot store state in the stateless Express backend without extra infrastructure.

**Solution:** After the Python service returns `match: true`, the Express `/api/face/verify` endpoint issues a short-lived (5-minute) JWT containing `{ userId, faceVerified: true }`. The frontend includes this token when requesting OTP. The OTP route verifies this token and only then sends the OTP. Similarly, the OTP route issues a 2-minute `voteAuthToken` that the vote recording route verifies. This creates a stateless but secure chain of proof.

---

## Quick Reference — Development Start Order

Start here when you open your laptop each day:

**Day 1-2:** Repo setup, MongoDB Atlas cluster, Alchemy account, Sepolia wallet with test ETH

**Day 3-5:** Write and test Voting.sol — everything else depends on this

**Day 6-8:** Python Flask face service — test with Postman before moving on

**Day 9-14:** Express API — auth first, then admin routes, then voter routes, test every endpoint

**Day 15-22:** React frontend — routing and context first, then pages one by one

**Day 23-25:** Integration testing — full flow end to end

**Day 26-27:** Deploy all services, update env vars, final testing on production URLs

**Day 28:** README, demo video recording, report writing

---

*This document covers the complete technical specification for eVoteFace. Read Section 10 (Phase Plan) daily to know what to build next. Do not skip testing phases — catching issues early saves days of debugging.*


note: do not create extra file without coding part and no extra explanation

read line ny line and understand the context of project and tell me in one wordunderstand or not in  YES or NO only