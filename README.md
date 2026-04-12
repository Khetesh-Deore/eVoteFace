# eVoteFace — Decentralized Online Voting System

> Secure digital voting with Face Recognition + Blockchain + OTP  
> Stack: MERN + Python (Flask) + Ethereum (Solidity)  
> Reference: ISE-Voting (IEEE IoT Journal, April 2025) | Sanghavi College 2025-26

---

## Features

- **Three-Factor Authentication**: MetaMask wallet + Face Recognition + Email OTP
- **Blockchain Immutability**: Every vote permanently recorded on Ethereum Sepolia
- **AI Biometrics**: 128-dimensional face encoding using dlib/face_recognition
- **Public Verifiability**: Anyone can verify results on-chain
- **Admin Panel**: Full election lifecycle management

---

## Architecture

```
React (Vercel) ──→ Express (Render) ──→ Python Flask (HuggingFace)
                        │
                        ├──→ MongoDB Atlas
                        └──→ Ethereum Sepolia (Alchemy)
```

---

## Quick Start

### Prerequisites
- Node.js v18+
- Python 3.10+
- MetaMask browser extension
- MongoDB Atlas account
- Alchemy account (Sepolia RPC)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/evoteface.git
cd evoteface

# Backend
cd server && npm install

# Frontend
cd ../client && npm install

# Blockchain
cd ../blockchain && npm install

# Python service
cd ../python-service
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
```

### 2. Environment Variables

**server/.env**
```env
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret
JWT_EXPIRES_IN=7d
VOTE_AUTH_TOKEN_SECRET=another_secret
VOTE_AUTH_TOKEN_EXPIRES_IN=2m
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM=eVoteFace System <your@gmail.com>
ALCHEMY_SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
ADMIN_WALLET_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
CONTRACT_ADDRESS=0xYOUR_CONTRACT
PYTHON_FACE_API_URL=http://localhost:8000
PORT=5000
NODE_ENV=development
```

**client/.env**
```env
VITE_API_URL=http://localhost:5000/api
VITE_CONTRACT_ADDRESS=0xYOUR_CONTRACT
VITE_CHAIN_ID=11155111
VITE_CHAIN_NAME=Sepolia
VITE_ALCHEMY_KEY=YOUR_ALCHEMY_KEY
```

**blockchain/.env**
```env
ALCHEMY_SEPOLIA_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
ADMIN_WALLET_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
ETHERSCAN_API_KEY=YOUR_KEY
```



**python-service/.env**
```env
FACE_MATCH_TOLERANCE=0.6
MAX_IMAGE_WIDTH=800
MAX_IMAGE_HEIGHT=800
MAX_FILE_SIZE_MB=5
PORT=8000
```

### 3. Deploy Smart Contract

```bash
cd blockchain
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
node scripts/extractABI.js   # copies ABI to server/ and client/
```

Update `CONTRACT_ADDRESS` in `server/.env` and `client/.env`.

### 4. Seed Admin Account

```bash
cd server
node scripts/seedAdmin.js
# Creates: admin@evoteface.com / Admin@2025
```

### 5. Run All Services

```bash
# Terminal 1 — Backend
cd server && node server.js

# Terminal 2 — Python Face API
cd python-service
venv\Scripts\activate
python app.py

# Terminal 3 — Frontend
cd client && npm run dev
```

Open: http://localhost:3000

---

## Election Workflow

### Admin Steps
1. Login at `/admin/login` (admin@evoteface.com / Admin@2025)
2. **Add Candidates** → `/admin/candidates`
3. **Register Voters** → `/admin/voters` → Approve → Upload Face → Register On-Chain
4. **Start Voting** → `/admin/election` → Click "Start Voting Phase"
5. **Monitor** → `/admin/results`
6. **Close Election** → `/admin/election` → Click "Close Election"

### Voter Steps
1. Register at `/register`
2. Wait for admin approval
3. Login at `/login`
4. Connect MetaMask (Sepolia network)
5. Vote at `/vote` — 3-factor auth: Wallet → Face → OTP → Cast Vote

---

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/register | Public | Voter registration |
| POST | /api/auth/login | Public | Voter login |
| POST | /api/auth/admin/login | Public | Admin login |
| GET | /api/auth/me | JWT | Current user |
| GET | /api/voters/status | JWT | Voter eligibility status |
| POST | /api/voters/wallet | JWT | Save wallet address |
| POST | /api/face/verify | JWT | Face verification |
| POST | /api/otp/send | JWT | Send OTP email |
| POST | /api/otp/verify | JWT | Verify OTP |
| POST | /api/votes/record | JWT | Record vote |
| GET | /api/votes/results | Public | Live results |
| GET | /api/admin/voters | Admin | List voters |
| POST | /api/admin/voters/:id/approve | Admin | Approve voter |
| POST | /api/admin/voters/:id/register-onchain | Admin | Register wallet on blockchain |
| POST | /api/admin/voters/:id/face | Admin | Upload face photo |
| POST | /api/admin/candidates | Admin | Add candidate |
| DELETE | /api/admin/candidates/:id | Admin | Remove candidate |
| POST | /api/admin/election/phase | Admin | Change election phase |
| GET | /api/admin/election | Admin | Election info |
| GET | /api/admin/results | Admin | Results with winner |

---

## Smart Contract

**Network:** Ethereum Sepolia Testnet  
**Contract:** `Voting.sol`

Key functions:
- `addCandidate(name, party, symbol)` — Admin only, Registration phase
- `registerVoter(address)` — Admin only, Registration phase
- `changePhase(phase)` — Admin only, forward only
- `castVote(candidateId)` — Registered voters, Voting phase
- `getAllCandidates()` — Public
- `getWinner()` — Public, Completed phase only

---

## Python Face Service

**Endpoints:**
- `GET /health` — Service status
- `POST /encode` — Encode face from image file (multipart)
- `POST /verify` — Compare live face against stored encoding (JSON)

**Tolerance:** 0.6 (configurable via `FACE_MATCH_TOLERANCE`)

---

## Project Structure

```
evoteface/
├── client/          # React + Vite frontend
├── server/          # Express.js backend
├── blockchain/      # Hardhat + Solidity
└── python-service/  # Flask face recognition API
```

---

## Academic Reference

- **Base Paper:** ISE-Voting — Identity-based Secure E-Voting (IEEE IoT Journal, April 2025)
- **Improvement:** Added biometric face recognition + OTP (not addressed in base paper)
- **Institution:** Sanghavi College of Engineering, 2025-26
<!-- recheck or review task is  is correct or not  -->