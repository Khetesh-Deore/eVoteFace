# eVoteFace V2 — Decentralized Voting System

> Secure digital voting with **Face Recognition + Blockchain + OTP**  
> Stack: **MERN + Python (DeepFace) + Ethereum Sepolia (Solidity)**  
> Multi-Election Architecture with Factory Pattern

---

## What is eVoteFace?

eVoteFace is a fully decentralized online voting system that replaces traditional EVM-based voting with a secure, transparent, and tamper-proof digital alternative. Every vote is permanently recorded on the Ethereum blockchain and protected by three independent authentication factors.

### Core Security Properties

| Property | How Achieved |
|----------|-------------|
| Immutability | Ethereum blockchain — votes cannot be altered |
| Triple Authentication | MetaMask wallet + Face Recognition + Email OTP |
| Transparency | Anyone can verify results on Etherscan |
| Anonymity | Only vote hash on-chain, not linked to voter identity |
| Correctness | Smart contract tallies automatically |
| Multi-Election | Factory pattern — unlimited independent elections |

---

## Features

### For Voters
- Register once, participate in multiple elections
- 5-step voting with real-time feedback
- Different MetaMask wallet per election
- View live results and winner announcement
- Transaction verification on Etherscan

### For Admins
- Create unlimited elections (each deploys a smart contract)
- Add candidates with party symbols (stored on Cloudinary)
- Approve voters, upload face photos, register wallets on blockchain
- Control election phases: Registration → Voting → Completed
- View live results with voter turnout statistics

---

## Three-Factor Authentication

```
Step 1: MetaMask Wallet
        Voter connects wallet → Contract checks if registered
        ↓
Step 2: Face Recognition (AI)
        Webcam captures live face → Python DeepFace compares with stored photo
        → Returns faceVerifiedToken (5 min expiry)
        ↓
Step 3: Email OTP
        6-digit OTP sent to registered email → Voter enters code
        → Returns voteAuthToken (2 min expiry)
        ↓
Step 4: Blockchain Vote
        contract.castVote(candidateId) via MetaMask
        → Transaction signed with private key
        ↓
Step 5: Record
        POST /votes/record → Verify txHash on-chain → Mark voted in DB
```

---

## Quick Start

### Prerequisites
- Node.js v18+
- Python 3.9+
- MetaMask browser extension
- MongoDB Atlas account
- Alchemy account (Sepolia RPC)
- Cloudinary account
- Gmail account (App Password for OTP)

### Installation

```bash
# 1. Clone repository
git clone <repo-url>
cd eVoteFace

# 2. Install server dependencies
cd server && npm install

# 3. Install client dependencies
cd ../client && npm install

# 4. Install Python dependencies
cd ../python-service && pip install -r requirements.txt

# 5. Configure environment variables
# Edit server/.env (see Environment Variables section)
# Edit client/.env

# 6. Create admin account
cd ../server && node scripts/seedAdmin.js

# 7. Start all services (3 terminals)
# Terminal 1:
cd python-service && python app.py

# Terminal 2:
cd server && npm run dev

# Terminal 3:
cd client && npm run dev
```

Open: **http://localhost:3000**

---

## Environment Variables

### server/.env
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/evoteface
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d
VOTE_AUTH_TOKEN_SECRET=your_vote_auth_secret
VOTE_AUTH_TOKEN_EXPIRES_IN=2m
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_16_char_app_password
EMAIL_FROM=eVoteFace <your@gmail.com>
ALCHEMY_SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/your_key
ADMIN_WALLET_PRIVATE_KEY=0x_your_wallet_private_key
FACTORY_CONTRACT_ADDRESS=0x_deployed_factory_address
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
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

## Project Structure

```
eVoteFace/
├── blockchain/              # Hardhat smart contracts
│   ├── contracts/
│   │   ├── Election.sol     # Per-election contract
│   │   └── ElectionFactory.sol  # Factory (deployed once)
│   ├── scripts/
│   │   ├── deployFactory.js
│   │   └── extractABI.js
│   └── hardhat.config.js
├── server/                  # Express backend (Port 5000)
│   ├── models/              # Mongoose schemas
│   ├── routes/              # API route handlers
│   ├── middleware/          # Auth, upload, rate limiting
│   ├── utils/               # Blockchain, mailer, cloudinary
│   └── server.js
├── client/                  # React frontend (Port 3000)
│   ├── src/
│   │   ├── pages/           # All page components
│   │   ├── components/      # Reusable components
│   │   ├── context/         # Auth, Election, Wallet contexts
│   │   └── utils/           # API client, contract helpers
│   └── vite.config.js
├── python-service/          # DeepFace microservice (Port 8000)
│   ├── app.py
│   └── requirements.txt
├── docs/                    # Development documentation
├── API.md                   # Complete API reference
├── API.yaml                 # OpenAPI 3.0 specification
├── ARCHITECTURE.md          # System architecture
├── FRONTEND_SPEC.md         # Frontend specification
└── HOW_TO_USE_AND_PRESENT.md  # Demo guide for teachers
```

---

## Deployed Contracts (Sepolia Testnet)

| Contract | Address |
|----------|---------|
| ElectionFactory | `0x0493732CE8A223fedbC7FEE3f5780D7c46385eb5` |
| Admin Wallet | `0x5b979D566867F2f5abaEE5d51292E1bd1740f103` |

- Factory: https://sepolia.etherscan.io/address/0x0493732CE8A223fedbC7FEE3f5780D7c46385eb5
- Get free Sepolia ETH: https://sepoliafaucet.com

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, ethers.js v6 |
| Backend | Node.js, Express, Mongoose, JWT, Nodemailer |
| Blockchain | Solidity 0.8.20, Hardhat, Ethereum Sepolia |
| AI/Face | Python, DeepFace, TensorFlow |
| Database | MongoDB Atlas |
| Storage | Cloudinary (images) |
| RPC | Alchemy (Sepolia) |

---

## Documentation

| File | Description |
|------|-------------|
| `API.md` | Complete REST API reference with examples |
| `API.yaml` | OpenAPI 3.0 spec (for Postman) |
| `ARCHITECTURE.md` | System architecture, DB schema, data flow diagrams |
| `FRONTEND_SPEC.md` | Every page, component, and user interaction |
| `HOW_TO_USE_AND_PRESENT.md` | Step-by-step demo guide for teachers |

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Face verification timeout | Ensure Python service running on port 8000 |
| MetaMask wrong network | Switch to Sepolia testnet in MetaMask |
| Transaction failing | Voter wallet needs Sepolia ETH (get from faucet) |
| OTP not received | Check spam; verify Gmail App Password in .env |
| "Wrong phase" error | Election must be in Registration phase to register voters |
| Server crash on start | Check MongoDB URI and all .env values |

---

**Version:** 2.0 | **Network:** Ethereum Sepolia | **Status:** Production Ready
