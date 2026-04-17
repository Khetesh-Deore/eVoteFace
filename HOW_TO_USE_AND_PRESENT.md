# eVoteFace — How to Run & Present to Teachers

---

## Prerequisites (Install These First)

| Tool | Download |
|------|----------|
| Node.js v18+ | https://nodejs.org |
| Python 3.9+ | https://python.org |
| MetaMask Browser Extension | https://metamask.io |
| MongoDB Atlas account | https://mongodb.com/atlas |
| Git | https://git-scm.com |

---

## Step 1: Start All Services

Open **4 separate terminals**.

### Terminal 1 — Backend Server
```bash
cd server
npm install
npm run dev
```
✅ Should show: `eVoteFace server running on port 5000` and `MongoDB connected`

### Terminal 2 — Frontend Client
```bash
cd client
npm install
npm run dev
```
✅ Should show: `Local: http://localhost:3000`

### Terminal 3 — Python Face Service
```bash
cd python-service
pip install -r requirements.txt
python app.py
```
✅ Should show: `Uvicorn running on http://0.0.0.0:8000`

### Terminal 4 — (Optional) Blockchain local node
> Not needed for Sepolia testnet. Skip if using deployed contracts.

---

## Step 2: Verify Everything is Running

Open browser and check:
- Frontend: http://localhost:3000 → Home page loads
- Backend: http://localhost:5000/api/health → `{"status":"ok"}`
- Python: http://localhost:8000 → FastAPI docs

---

## Step 3: Create Admin Account (First Time Only)

```bash
cd server
node scripts/seedAdmin.js
```

This creates the admin account. Note the credentials printed in terminal.

---

## Complete Demo Flow for Teachers

### PART 1: Show the Home Page (2 minutes)

1. Open http://localhost:3000
2. **Point out:**
   - "This is eVoteFace — a decentralized voting system"
   - "It uses 3-factor authentication: MetaMask wallet + Face Recognition + OTP"
   - "All votes are stored permanently on Ethereum blockchain"
   - Show the 3 steps section (MetaMask → Face → OTP)
   - Show the 4 features (Blockchain, Triple Auth, Verifiability, AI)

---

### PART 2: Voter Registration (3 minutes)

1. Click **"Register to Vote"**
2. Fill in the form:
   - Full Name: `Test Voter`
   - Age: `22`
   - Gender: `Male`
   - Contact: `9876543210`
   - Email: your email (OTP will come here)
   - Voter ID: `VTR2025`
   - Aadhar: `123456789012`
   - Address: `123 Test Street`
   - State: `Maharashtra`
   - City: `Nashik`
   - Pincode: `422001`
   - Password: `password123`
3. Click **"Submit Registration"**
4. **Point out:** "Registration is pending admin approval — this prevents fake voters"

---

### PART 3: Admin Creates Election (5 minutes)

1. Click **Login** → Switch to **"Admin Login"**
2. Enter admin credentials
3. Navigate to **Admin Dashboard**
4. **Point out stats:** Total elections, voters, votes
5. Click **"Create New Election"**
6. Fill in:
   - Title: `Presidential Election 2025`
   - Description: `Annual presidential election`
   - Start Date: today's date
   - End Date: 3 days from now
7. Click **"Create Election & Deploy Contract"**
8. **Point out:** "This deploys a smart contract on Ethereum Sepolia blockchain"
9. Show the contract address that appears

---

### PART 4: Admin Manages Election (5 minutes)

Click **"Manage"** on the created election.

**Candidates Tab:**
1. Add Candidate 1:
   - Name: `Alice Johnson`
   - Party: `Progressive Party`
   - Upload any image as party symbol
2. Add Candidate 2:
   - Name: `Bob Smith`
   - Party: `National Party`
   - Upload any image
3. **Point out:** "Each candidate is registered on the blockchain"

**Voters Tab:**
1. The registered voter appears here
2. Click **"Approve"** → "This approves the voter for this specific election"
3. Click **"Upload"** face photo → Upload a clear photo of the voter's face
4. Click **"Register On-Chain"** → "This registers the voter's wallet on the smart contract"
5. **Point out:** "Voter must be in registration phase to register on blockchain"

**Overview Tab:**
1. Click **"Start Voting"**
2. **Point out:** "Phase changed from Registration to Voting on the blockchain"

---

### PART 5: Voter Casts Vote (8 minutes) ⭐ MAIN DEMO

1. **Logout** from admin
2. **Login** as voter (Voter ID + password)
3. Go to **Elections** → Find the election → Click **"View Details"**
4. **Point out:** Registration status checklist (all green ✓)
5. Click **"Go Vote Now"**

**Step 1 — MetaMask:**
- MetaMask popup appears
- Click **"Connect"**
- **Point out:** "Wallet connected — this is the voter's blockchain identity"

**Step 2 — Face Verification:**
- Webcam opens
- Position face in the oval guide
- Click **"Capture Photo"**
- Click **"Verify Face & Continue"**
- **Point out:** "AI compares live face with registered photo using DeepFace"
- Wait for verification (10-30 seconds)

**Step 3 — OTP:**
- Click **"Send OTP"**
- Check email for 6-digit code
- Enter the code
- **Point out:** "OTP sent to registered email — third factor of authentication"

**Step 4 — Vote:**
- Select a candidate
- Click **"Cast Vote"**
- MetaMask popup appears — click **"Confirm"**
- **Point out:** "Vote is being written to Ethereum blockchain"
- Wait for confirmation

**Step 5 — Success:**
- Show transaction hash
- Click **"View on Etherscan"**
- **Point out:** "Vote is permanently recorded on blockchain — cannot be changed or deleted"

---

### PART 6: Show Results (2 minutes)

1. Admin logs in → Manage Election → **Overview Tab** → Click **"Complete Election"**
2. Go to **Results Tab**
3. **Point out:**
   - Winner announcement
   - Vote counts per candidate
   - Voter turnout percentage
4. Go to public **Elections** page → Click election → Scroll to results
5. **Point out:** "Anyone can verify results — no trust required"

---

### PART 7: Show Blockchain Proof (2 minutes)

Open: https://sepolia.etherscan.io/address/0x0493732CE8A223fedbC7FEE3f5780D7c46385eb5

**Point out:**
- "This is the ElectionFactory contract deployed on Ethereum Sepolia"
- "Every election creates a new contract"
- "Every vote is a transaction — permanently recorded"
- Show the transaction history

---

## Key Points to Emphasize to Teachers

### 1. Security
> "Traditional online voting can be hacked. Our system uses blockchain — once a vote is cast, it cannot be changed by anyone, including us."

### 2. Triple Authentication
> "To vote, you need: (1) Your MetaMask wallet private key, (2) Your face, (3) Access to your email. All three must match."

### 3. Decentralization
> "Votes are not stored in our database — they're on Ethereum blockchain. Even if our server goes down, votes are safe."

### 4. Transparency
> "Anyone can verify results on Etherscan. No black box — complete transparency."

### 5. Multi-Election Support
> "One voter can participate in multiple elections with different wallets. Each election is independent."

### 6. AI Face Recognition
> "We use DeepFace — the same technology used in research papers — to compare 128-dimensional face encodings."

---

## Troubleshooting During Demo

| Problem | Solution |
|---------|----------|
| Face verification timeout | Ensure Python service is running on port 8000 |
| MetaMask not connecting | Ensure MetaMask is on Sepolia network |
| Transaction failing | Ensure voter wallet has Sepolia ETH (get from faucet) |
| OTP not received | Check spam folder; verify Gmail App Password in .env |
| Server not starting | Check MongoDB URI in server/.env |
| "Wrong phase" error | Election must be in Registration phase to register voters |

### Get Free Sepolia ETH (for voter wallet)
- https://sepoliafaucet.com (Alchemy — 0.5 ETH/day)
- https://cloud.google.com/application/web3/faucet/ethereum/sepolia (Google — no login)

---

## Project Highlights for Evaluation

| Feature | Implementation |
|---------|---------------|
| Blockchain | Ethereum Sepolia, Solidity 0.8.20, Hardhat |
| Smart Contracts | Factory pattern — ElectionFactory + Election |
| AI | Python DeepFace, 128-dim face encoding |
| Authentication | JWT + bcrypt + 3-factor voting auth |
| Database | MongoDB Atlas with TTL indexes |
| File Storage | Cloudinary CDN |
| Email | Gmail SMTP via Nodemailer |
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | Node.js + Express REST API |
| Multi-election | One voter, multiple elections, different wallets |

---

## Documents Available

| File | Contents |
|------|----------|
| `README.md` | Project overview |
| `API.md` | Complete API reference (30 endpoints) |
| `API.yaml` | OpenAPI 3.0 specification |
| `ARCHITECTURE.md` | System architecture, DB schema, data flow |
| `FRONTEND_SPEC.md` | Complete frontend specification |
| `HOW_TO_USE_AND_PRESENT.md` | This file |

---

## Quick Reference

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000/api |
| API Health | http://localhost:5000/api/health |
| Python Service | http://localhost:8000 |
| Etherscan Factory | https://sepolia.etherscan.io/address/0x0493732CE8A223fedbC7FEE3f5780D7c46385eb5 |
| Sepolia Faucet | https://sepoliafaucet.com |

---

## Academic Presentation Script

### Opening Statement (30 seconds)
> "Traditional voting requires physical presence, is expensive to conduct, and is vulnerable to impersonation and manipulation. eVoteFace solves this by combining three independent security layers — blockchain immutability, AI face recognition, and email OTP — into a fully decentralized online voting system."

### Technical Explanation (2 minutes)
> "When a voter wants to cast their vote, they must pass three independent checks:
> 
> First, their MetaMask wallet must be registered on the Ethereum smart contract by the admin. This is their blockchain identity.
> 
> Second, their live webcam image is compared against their registered face photo using DeepFace — a deep learning model that creates a 128-dimensional face encoding. If the distance between encodings is below the threshold, verification passes.
> 
> Third, a 6-digit OTP is sent to their registered email. Only after entering the correct OTP does the system issue a 2-minute vote authorization token.
> 
> Finally, the vote is cast directly on the Ethereum blockchain via MetaMask. The voter signs the transaction with their private key. This transaction is permanent and publicly verifiable on Etherscan."

### Innovation Over Base Paper (1 minute)
> "Our project is based on the ISE-Voting paper published in IEEE IoT Journal in April 2025. That paper proposed a cryptographic voting scheme but explicitly acknowledged it does not address strong voter authentication. We fill that gap by adding biometric face recognition, email OTP, and MetaMask wallet verification — creating a complete three-factor authentication system on top of the blockchain foundation."

---

## Evaluation Checklist

### Functionality (show each working)
- [ ] Voter registration form with validation
- [ ] Admin login and dashboard
- [ ] Election creation with contract deployment
- [ ] Candidate addition with party symbol upload
- [ ] Voter approval and face photo upload
- [ ] Blockchain voter registration
- [ ] Phase change (Registration → Voting)
- [ ] MetaMask wallet connection
- [ ] Face verification via webcam
- [ ] OTP email delivery and verification
- [ ] Vote casting on blockchain
- [ ] Transaction on Etherscan
- [ ] Results with winner announcement
- [ ] Multi-election support (two elections simultaneously)

### Technical Depth (explain each)
- [ ] Smart contract Factory pattern
- [ ] DeepFace 128-dimensional encoding
- [ ] JWT token chain (auth → face → OTP → vote)
- [ ] Cloudinary image storage
- [ ] MongoDB TTL index for OTP expiry
- [ ] Blockchain transaction verification

---

## Common Teacher Questions & Answers

**Q: How do you prevent someone from voting twice?**
> "The smart contract checks `voters[msg.sender].hasVoted` before accepting any vote. Once set to true, the contract permanently rejects any further vote from that wallet. Additionally, MongoDB marks `hasVoted: true` as a secondary check."

**Q: What if the blockchain goes down?**
> "Ethereum is a decentralized network with thousands of nodes worldwide. It has 99.99% uptime. Even if our server goes down, the votes are already permanently recorded on the blockchain and can be read by anyone."

**Q: How accurate is the face recognition?**
> "DeepFace with the ArcFace model achieves 99.40% accuracy on the LFW benchmark dataset. We use a cosine distance threshold to determine matches. The system also requires good lighting and a frontal face position."

**Q: Can the admin manipulate votes?**
> "No. Once the voting phase starts, the admin cannot change votes. The smart contract only allows `castVote()` to be called by registered voter wallets. The admin can only change the phase, not individual votes. All transactions are publicly visible on Etherscan."

**Q: Why Sepolia testnet and not mainnet?**
> "Sepolia is Ethereum's official test network. It uses test ETH with no real monetary value, making it perfect for academic projects. The smart contract code is identical — deploying to mainnet would only require changing the RPC URL and using real ETH for gas."

**Q: What happens if a voter loses their MetaMask wallet?**
> "The admin would need to remove the old wallet registration and register a new wallet for that voter. This is an administrative process, similar to replacing a lost voter ID card."

---

## Files to Show During Presentation

| File | What to Show |
|------|-------------|
| `blockchain/contracts/Election.sol` | Smart contract code — show `castVote()` and `registerVoter()` |
| `blockchain/contracts/ElectionFactory.sol` | Factory pattern — show `createElection()` |
| `python-service/app.py` | DeepFace verification endpoint |
| `server/routes/votes.js` | Vote recording with blockchain verification |
| `server/routes/face.js` | Face verification proxy to Python |
| `ARCHITECTURE.md` | System architecture diagram |
| Etherscan | Live blockchain transactions |

---

## Marks-Worthy Points to Mention

1. **Factory Design Pattern** — ElectionFactory deploys individual Election contracts, enabling unlimited elections without redeployment
2. **Token Chain Security** — Three separate short-lived tokens (face: 5min, vote: 2min) prevent replay attacks
3. **No Private Key on Frontend** — Admin's private key stays on server; voters sign with their own MetaMask
4. **Cloudinary CDN** — Face photos and party symbols stored on professional CDN, not local disk
5. **TTL Index** — MongoDB automatically deletes expired OTPs using database-level TTL index
6. **Multi-Election Architecture** — One voter can participate in multiple elections with different wallets per election
7. **On-Chain Verification** — Server verifies txHash on blockchain before marking vote as recorded
8. **Rate Limiting** — OTP endpoint limited to 3 requests per 10 minutes to prevent abuse
