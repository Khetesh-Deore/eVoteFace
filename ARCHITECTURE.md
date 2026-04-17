# eVoteFace — System Architecture

## Overview

eVoteFace is a decentralized online voting system combining:
- **Blockchain** (Ethereum Sepolia) for immutable vote storage
- **AI Face Recognition** (DeepFace) for biometric authentication
- **OTP Email Verification** for multi-factor security
- **MERN Stack** for the web application layer

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                          │
│  React 18 + Vite + Tailwind CSS + ethers.js + react-webcam      │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  Public  │  │  Voter   │  │  Admin   │  │   MetaMask   │   │
│  │  Pages   │  │  Pages   │  │  Pages   │  │   Wallet     │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│       └─────────────┴─────────────┴────────────────┘           │
│                           │ HTTP/REST                            │
└───────────────────────────┼─────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────┐
│                    EXPRESS SERVER (Node.js)                       │
│                      Port 5000                                    │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │   Auth   │  │Elections │  │  Voters  │  │  Votes/OTP   │   │
│  │  Routes  │  │  Routes  │  │  Routes  │  │  Face Routes │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│       └─────────────┴─────────────┴────────────────┘           │
│                           │                                      │
│  ┌────────────────────────┼────────────────────────────────┐   │
│  │              Middleware Layer                             │   │
│  │  JWT Auth │ Admin Auth │ Rate Limiter │ Cloudinary Upload│   │
│  └───────────────────────────────────────────────────────── ┘   │
└──────┬──────────────────────────┬──────────────────────────┬────┘
       │                          │                          │
┌──────▼──────┐  ┌───────────────▼──────┐  ┌───────────────▼────┐
│  MongoDB    │  │  Ethereum Sepolia     │  │  Python Service    │
│  Atlas      │  │  Blockchain           │  │  (DeepFace AI)     │
│             │  │                       │  │  Port 8000         │
│  Users      │  │  ElectionFactory.sol  │  │                    │
│  Elections  │  │  Election.sol (×N)    │  │  POST /verify      │
│  Candidates │  │                       │  │  Face comparison   │
│  OTPs       │  │  Via Alchemy RPC      │  │  128-dim encoding  │
└─────────────┘  └───────────────────────┘  └────────────────────┘
                          │
                 ┌────────▼────────┐
                 │   Cloudinary    │
                 │   (Image CDN)   │
                 │  Party symbols  │
                 │  Face photos    │
                 └─────────────────┘
```

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.3.1 | UI framework |
| Vite | 5.4.2 | Build tool |
| Tailwind CSS | 3.4.10 | Styling |
| React Router | 6.26.1 | Client-side routing |
| ethers.js | 6.13.1 | Blockchain / MetaMask interaction |
| Axios | 1.7.2 | HTTP client |
| react-toastify | 10.0.5 | Notifications |
| react-webcam | 7.2.0 | Webcam face capture |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 22.x | Runtime |
| Express | 4.19.2 | Web framework |
| Mongoose | 8.5.1 | MongoDB ODM |
| ethers.js | 6.13.1 | Blockchain interaction |
| jsonwebtoken | 9.0.2 | JWT authentication |
| bcryptjs | 2.4.3 | Password hashing |
| nodemailer | 6.9.14 | Email (OTP) |
| multer | 1.4.5 | File upload |
| multer-storage-cloudinary | 4.0.0 | Cloudinary upload |
| axios | 1.7.2 | Python service calls |
| express-rate-limit | 7.3.1 | Rate limiting |
| nodemon | 3.1.4 | Dev auto-restart |

### Blockchain
| Technology | Version | Purpose |
|-----------|---------|---------|
| Solidity | 0.8.20 | Smart contract language |
| Hardhat | 2.22.6 | Development framework |
| Ethereum Sepolia | — | Testnet |
| Alchemy | — | RPC provider |

### Database
| Technology | Purpose |
|-----------|---------|
| MongoDB Atlas | Cloud database |
| Collections: Users, Elections, Candidates, OTPs | Data storage |

### External Services
| Service | Purpose |
|---------|---------|
| Cloudinary | Image storage (party symbols, face photos) |
| Alchemy | Ethereum Sepolia RPC endpoint |
| Gmail SMTP | OTP email delivery |
| Python DeepFace | AI face recognition service |

---

## Smart Contract Architecture

### ElectionFactory.sol
Deployed once at: `0x0493732CE8A223fedbC7FEE3f5780D7c46385eb5`

```
ElectionFactory
├── platformOwner: address
├── platformAdmins: mapping(address => bool)
├── deployedElections: address[]
│
├── createElection(title, description, startTime, endTime, adminAddress)
│   └── Deploys new Election.sol → returns contract address
│
├── addPlatformAdmin(address)
├── removePlatformAdmin(address)
└── getAllElections() → address[]
```

### Election.sol
One contract per election. Deployed by factory.

```
Election
├── State
│   ├── electionAdmin: address
│   ├── currentPhase: enum { Registration, Voting, Completed }
│   ├── candidates: mapping(uint256 => Candidate)
│   ├── voters: mapping(address => Voter)
│   ├── totalCandidates, totalRegisteredVoters, totalVotesCast
│
├── Admin Functions (onlyAdmin)
│   ├── addCandidate(name, partyName, partySymbol) — Registration phase only
│   ├── removeCandidate(id) — Registration phase only
│   ├── registerVoter(walletAddress) — Registration phase only
│   └── changePhase(newPhase) — Forward only (or back if 0 votes)
│
├── Voter Functions
│   └── castVote(candidateId) — Voting phase only
│
└── Read Functions
    ├── getCandidate(id)
    ├── getAllCandidates()
    ├── getVoterStatus(address)
    ├── getWinner() — Completed phase only
    └── getElectionStats()
```

### Phase State Machine
```
Registration ──────────────────────────────► Voting ──────────────► Completed
     ▲                                          │
     └──────────── (only if 0 votes cast) ──────┘
```

---

## Database Schema

### User (Voter)
```
{
  fullName: String,
  email: String (unique),
  password: String (bcrypt hashed),
  voterID: String (unique),
  aadharNumber: String (unique),
  age: Number (min 18),
  gender: enum [Male, Female, Other],
  address, state, city, pincode, contactNumber: String,
  role: enum [voter, admin],
  elections: [{
    electionId: ObjectId → Election,
    walletAddress: String,       // MetaMask wallet for this election
    facePhotoUrl: String,        // Cloudinary URL
    isVerified: Boolean,         // Admin approved
    isRegisteredOnChain: Boolean,// Registered on smart contract
    hasVoted: Boolean,
    votedAt: Date
  }]
}
```

### Election
```
{
  title: String,
  description: String,
  contractAddress: String,  // Ethereum address
  adminId: ObjectId → Admin,
  startTime: Date,
  endTime: Date,
  phase: enum [registration, voting, completed]
}
```

### Candidate
```
{
  electionId: ObjectId → Election,
  name: String,
  partyName: String,
  partySymbol: String,  // Cloudinary URL
  onChainId: Number     // ID on smart contract (compound unique with electionId)
}
```

### OTP
```
{
  email: String,
  code: String (6 digits),
  expiresAt: Date,      // TTL index — auto-deleted after expiry
  used: Boolean
}
```

### Admin
```
{
  fullName: String,
  email: String (unique),
  password: String (bcrypt hashed),
  role: enum [admin, superadmin]
}
```

---

## Authentication & Security

### JWT Flow
```
Login → Server validates credentials → Issues JWT (7 days)
→ Client stores in localStorage as 'evf_token'
→ Every request: Authorization: Bearer <token>
→ Server middleware verifies token → attaches req.user
```

### 3-Factor Voting Authentication
```
Step 1: MetaMask wallet connected (client-side, no API)
         ↓
Step 2: POST /face/verify
         → Python DeepFace compares live webcam vs stored photo
         → Returns faceVerifiedToken (JWT, 5 min expiry)
         ↓
Step 3: POST /otp/send (requires faceVerifiedToken)
         → Generates 6-digit OTP, stores in MongoDB
         → Sends via Gmail SMTP
         POST /otp/verify
         → Returns voteAuthToken (JWT, 2 min expiry)
         ↓
Step 4: contract.castVote(candidateId) via MetaMask
         → Direct blockchain transaction
         → User signs with private key
         ↓
Step 5: POST /votes/record (requires voteAuthToken)
         → Verifies txHash on blockchain
         → Marks voter as hasVoted in MongoDB
```

### Security Measures
- Passwords: bcrypt with salt rounds 10
- JWT: separate secrets for auth and vote authorization
- OTP: rate limited (3 per 10 min), 5-min expiry, single-use
- Vote auth token: 2-minute expiry window
- Blockchain: votes immutable once cast
- Wallet validation: admin wallet blocked from voter registration
- Duplicate prevention: compound indexes on wallet+election

---

## Project Directory Structure

```
eVoteFace/
├── blockchain/                    # Hardhat project
│   ├── contracts/
│   │   ├── Election.sol           # Per-election smart contract
│   │   └── ElectionFactory.sol    # Factory contract (deployed once)
│   ├── scripts/
│   │   ├── deployFactory.js       # Deploy factory to Sepolia
│   │   ├── createElection.js      # Test election creation
│   │   └── extractABI.js          # Copy ABIs to server/client
│   ├── test/
│   │   ├── Election.test.js
│   │   └── ElectionFactory.test.js
│   ├── artifacts/                 # Compiled contracts
│   ├── deployedAddresses.json     # Factory address record
│   └── hardhat.config.js
│
├── server/                        # Express backend
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── middleware/
│   │   ├── auth.js                # JWT verification
│   │   ├── adminAuth.js           # Admin role check
│   │   ├── rateLimiter.js         # Express rate limiting
│   │   ├── upload.js              # Multer local upload
│   │   └── uploadCloudinary.js    # Multer + Cloudinary
│   ├── models/
│   │   ├── User.js                # Voter model
│   │   ├── Admin.js               # Admin model
│   │   ├── Election.js            # Election model
│   │   ├── Candidate.js           # Candidate model
│   │   └── OTP.js                 # OTP model (TTL)
│   ├── routes/
│   │   ├── auth.js                # /api/auth/*
│   │   ├── elections.js           # /api/elections, /api/admin/elections
│   │   ├── electionCandidates.js  # /api/admin/elections/:id/candidates
│   │   ├── electionVoters.js      # /api/admin/elections/:id/voters
│   │   ├── voters.js              # /api/voters/*
│   │   ├── votes.js               # /api/votes/*
│   │   ├── face.js                # /api/face/verify
│   │   └── otp.js                 # /api/otp/*
│   ├── utils/
│   │   ├── blockchain.js          # ethers.js provider + contract helpers
│   │   ├── mailer.js              # Nodemailer OTP sender
│   │   ├── cloudinary.js          # Cloudinary config
│   │   ├── ElectionABI.json       # Copied from blockchain/artifacts
│   │   └── ElectionFactoryABI.json
│   ├── scripts/
│   │   ├── seedAdmin.js           # Create first admin account
│   │   ├── fixCandidateIndex.js   # Fix MongoDB indexes
│   │   └── resetElection.js       # Dev utility
│   ├── .env                       # Environment variables
│   ├── package.json
│   └── server.js                  # Entry point
│
├── client/                        # React frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   ├── Footer.jsx
│   │   │   │   ├── LoadingSpinner.jsx
│   │   │   │   ├── PhaseIndicator.jsx
│   │   │   │   ├── ProtectedRoute.jsx
│   │   │   │   └── AdminRoute.jsx
│   │   │   └── voter/
│   │   │       ├── CandidateCard.jsx
│   │   │       ├── MetaMaskConnect.jsx
│   │   │       ├── OTPInput.jsx
│   │   │       └── WebcamCapture.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx    # User auth state
│   │   │   ├── ElectionContext.jsx# Election data state
│   │   │   └── WalletContext.jsx  # MetaMask state
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.jsx
│   │   │   │   ├── AdminElectionsList.jsx
│   │   │   │   ├── CreateElection.jsx
│   │   │   │   └── ManageElection.jsx
│   │   │   └── voter/
│   │   │       ├── Dashboard.jsx
│   │   │       ├── ElectionsList.jsx
│   │   │       ├── ElectionDetail.jsx
│   │   │       ├── VotingPage.jsx
│   │   │       └── Results.jsx
│   │   ├── utils/
│   │   │   ├── api.js             # Axios instance
│   │   │   ├── contract.js        # ethers.js contract helper
│   │   │   ├── ElectionABI.json
│   │   │   └── ElectionFactoryABI.json
│   │   ├── App.jsx                # Routes
│   │   ├── main.jsx               # Entry point
│   │   └── index.css              # Tailwind + custom CSS
│   ├── .env                       # VITE_API_URL
│   └── vite.config.js
│
├── python-service/                # DeepFace microservice
│   ├── app.py                     # FastAPI server
│   ├── requirements.txt
│   └── Dockerfile
│
├── docs/                          # Documentation
├── API.md                         # API reference
├── API.yaml                       # OpenAPI 3.0 spec
├── ARCHITECTURE.md                # This file
├── FRONTEND_SPEC.md               # Frontend specification
└── README.md                      # Project overview
```

---

## Data Flow: Complete Voting Sequence

```
VOTER                    SERVER                   BLOCKCHAIN          PYTHON
  │                         │                         │                  │
  │── GET /elections ───────►│                         │                  │
  │◄── elections list ───────│                         │                  │
  │                         │                         │                  │
  │── POST /voters/elections/:id/request-registration ►│                  │
  │◄── "pending approval" ──│                         │                  │
  │                         │                         │                  │
  │    [ADMIN APPROVES]      │                         │                  │
  │    [ADMIN UPLOADS FACE]  │                         │                  │
  │    [ADMIN REGISTERS ON-CHAIN] ──────────────────►  │                  │
  │                         │◄── txHash ──────────────│                  │
  │                         │                         │                  │
  │    [ADMIN CHANGES PHASE TO VOTING] ─────────────► │                  │
  │                         │                         │                  │
  │── Connect MetaMask (client-side) ─────────────────────────────────── │
  │                         │                         │                  │
  │── POST /face/verify ────►│                         │                  │
  │                         │── POST /verify ──────────────────────────► │
  │                         │◄── { match: true } ──────────────────────  │
  │◄── faceVerifiedToken ───│                         │                  │
  │                         │                         │                  │
  │── POST /otp/send ───────►│                         │                  │
  │                         │── send email (Gmail SMTP)                  │
  │◄── "OTP sent to pr***" ─│                         │                  │
  │                         │                         │                  │
  │── POST /otp/verify ─────►│                         │                  │
  │◄── voteAuthToken ───────│                         │                  │
  │                         │                         │                  │
  │── contract.castVote() via MetaMask ──────────────►│                  │
  │◄── txHash ──────────────────────────────────────  │                  │
  │                         │                         │                  │
  │── POST /votes/record ───►│                         │                  │
  │                         │── verify txHash ────────►│                  │
  │                         │◄── receipt ─────────────│                  │
  │◄── "Vote recorded" ─────│                         │                  │
```

---

## Environment Variables

### server/.env
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
VOTE_AUTH_TOKEN_SECRET=...
VOTE_AUTH_TOKEN_EXPIRES_IN=2m
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=eVoteFace <your@gmail.com>
ALCHEMY_SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/...
ADMIN_WALLET_PRIVATE_KEY=0x...
FACTORY_CONTRACT_ADDRESS=0x...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
PYTHON_FACE_API_URL=http://localhost:8000
PORT=5000
NODE_ENV=development
OTP_RATE_LIMIT_WINDOW_MS=600000
OTP_RATE_LIMIT_MAX=3
```

### client/.env
```env
VITE_API_URL=http://localhost:5000/api
```

---

## Deployed Addresses (Sepolia Testnet)

| Contract | Address |
|----------|---------|
| ElectionFactory | `0x0493732CE8A223fedbC7FEE3f5780D7c46385eb5` |
| Admin Wallet | `0x5b979D566867F2f5abaEE5d51292E1bd1740f103` |

**View on Etherscan:**
- Factory: https://sepolia.etherscan.io/address/0x0493732CE8A223fedbC7FEE3f5780D7c46385eb5
- Admin: https://sepolia.etherscan.io/address/0x5b979D566867F2f5abaEE5d51292E1bd1740f103

---

## API Route Map

```
/api
├── /auth
│   ├── POST /register          → Create voter account
│   ├── POST /login             → Voter JWT
│   ├── POST /admin/login       → Admin JWT
│   └── GET  /me                → Current user profile
│
├── /elections                  → Public
│   ├── GET  /                  → All active elections
│   └── GET  /:id               → Election + candidates
│
├── /admin/elections            → Admin only
│   ├── GET  /                  → All elections + stats
│   ├── POST /                  → Create + deploy contract
│   ├── POST /:id/phase         → Change phase
│   ├── GET  /:id/results       → Blockchain results
│   ├── GET  /:id/candidates    → List candidates
│   ├── POST /:id/candidates    → Add candidate
│   ├── DELETE /:id/candidates/:cid → Remove candidate
│   ├── GET  /:id/voters        → List voters
│   ├── POST /:id/voters/:uid/approve         → Approve voter
│   ├── POST /:id/voters/:uid/register-onchain → Register wallet
│   ├── POST /:id/voters/:uid/face            → Upload face photo
│   └── DELETE /:id/voters/:uid              → Remove voter
│
├── /voters                     → Voter only
│   ├── GET  /profile           → Voter profile
│   ├── GET  /elections         → My elections + status
│   ├── GET  /elections/:id/status → Status for election
│   ├── POST /elections/:id/request-registration → Join election
│   └── POST /elections/:id/wallet → Update wallet
│
├── /face
│   └── POST /verify            → DeepFace comparison
│
├── /otp
│   ├── POST /send              → Send OTP email
│   └── POST /verify            → Verify OTP → voteAuthToken
│
└── /votes
    ├── POST /record            → Record vote in DB
    └── GET  /results/:id       → Public results
```

---

## Security Architecture

### Token Chain (Voting Flow)
```
JWT (7 days)          → Identifies voter for all API calls
    ↓
faceVerifiedToken     → Proves face matched (5 min, single use)
    ↓
voteAuthToken         → Proves OTP verified (2 min, single use)
    ↓
txHash                → Proves blockchain vote cast
    ↓
Vote recorded in DB   → hasVoted = true
```

### Middleware Stack
```
Request
  → CORS check
  → JSON body parser
  → auth.js (verify JWT, attach req.user)
  → adminAuth.js (check role === 'admin')
  → rateLimiter.js (OTP: 3/10min)
  → uploadCloudinary.js (multipart → Cloudinary)
  → Route handler
  → Response
```

---

## Blockchain Interaction Points

| Action | Who | How |
|--------|-----|-----|
| Deploy Election | Admin (server) | `factory.createElection(...)` via ethers.js |
| Add Candidate | Admin (server) | `contract.addCandidate(...)` via ethers.js |
| Remove Candidate | Admin (server) | `contract.removeCandidate(id)` via ethers.js |
| Register Voter | Admin (server) | `contract.registerVoter(wallet)` via ethers.js |
| Change Phase | Admin (server) | `contract.changePhase(phase)` via ethers.js |
| Cast Vote | Voter (browser) | `contract.castVote(candidateId)` via MetaMask |
| Read Results | Anyone (server) | `contract.getCandidate(i)` read-only via Alchemy |
| Verify Vote | Server | `provider.getTransactionReceipt(txHash)` |
