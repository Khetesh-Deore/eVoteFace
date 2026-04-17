# eVoteFace - Complete Codebase Guide for First-Time Readers

> Read this document first before touching any code.

---

## 1. What Is This Project?

eVoteFace is an online voting system combining three technologies:

1. Blockchain (Ethereum) - stores votes permanently, nobody can change them
2. AI Face Recognition (DeepFace) - confirms the voter is physically present
3. Email OTP - confirms the voter has access to their registered email

To vote, you need your wallet (like a key), your face (like a fingerprint), and your email (like a PIN).
All three must match before a vote is accepted.

The system supports multiple elections running simultaneously.
Each election is completely independent with its own smart contract on the blockchain.

---

## 2. The Big Picture - How It All Connects

`
BROWSER (React App - Port 3000)
    |
    | HTTP requests (Axios)
    |
EXPRESS SERVER (Node.js - Port 5000)
    |
    |--- MongoDB Atlas (users, elections, candidates, OTPs)
    |--- Python Service (Port 8000) - DeepFace AI face comparison
    |--- Cloudinary (face photos and party symbol images)
    |--- Ethereum Sepolia Blockchain (via Alchemy RPC)
            |
            |--- ElectionFactory contract (deployed once)
            |--- Election contract #1 (one per election)
            |--- Election contract #2
            |--- Election contract #N
`

The browser ALSO talks directly to the blockchain via MetaMask when casting a vote.
The vote transaction goes from the voter wallet directly to the smart contract.
The server is NOT involved in the actual vote transaction.

---

## 3. Folder Structure - What Lives Where

`
eVoteFace/
|
|-- blockchain/          SMART CONTRACTS (Solidity + Hardhat)
|   |-- contracts/
|   |   |-- Election.sol          One contract per election
|   |   |-- ElectionFactory.sol   Creates Election contracts
|   |-- scripts/
|   |   |-- deployFactory.js      Run once to deploy factory to Sepolia
|   |   |-- extractABI.js         Copies ABIs to server and client
|   |-- hardhat.config.js
|   |-- deployedAddresses.json    Stores deployed factory address
|
|-- server/              EXPRESS BACKEND (Node.js)
|   |-- server.js                 Entry point - starts Express
|   |-- config/db.js              MongoDB connection
|   |-- middleware/
|   |   |-- auth.js               Verifies JWT tokens
|   |   |-- adminAuth.js          Checks if user is admin
|   |   |-- rateLimiter.js        Limits OTP requests
|   |   |-- uploadCloudinary.js   Handles image uploads to Cloudinary
|   |-- models/
|   |   |-- User.js               Voter schema (has elections array)
|   |   |-- Admin.js              Admin schema
|   |   |-- Election.js           Election schema
|   |   |-- Candidate.js          Candidate schema
|   |   |-- OTP.js                OTP schema (auto-deletes after 5 min)
|   |-- routes/
|   |   |-- auth.js               /api/auth/*
|   |   |-- elections.js          /api/elections and /api/admin/elections
|   |   |-- electionCandidates.js /api/admin/elections/:id/candidates
|   |   |-- electionVoters.js     /api/admin/elections/:id/voters
|   |   |-- voters.js             /api/voters/*
|   |   |-- face.js               /api/face/verify
|   |   |-- otp.js                /api/otp/send and /api/otp/verify
|   |   |-- votes.js              /api/votes/record and /api/votes/results
|   |-- utils/
|   |   |-- blockchain.js         ethers.js setup, contract helpers
|   |   |-- mailer.js             Nodemailer OTP email sender
|   |   |-- cloudinary.js         Cloudinary SDK setup
|   |   |-- ElectionABI.json      Copied from blockchain/artifacts
|   |   |-- ElectionFactoryABI.json
|   |-- scripts/
|   |   |-- seedAdmin.js          Creates first admin account
|   |-- .env                      All secrets (never commit this)
|
|-- client/              REACT FRONTEND (Vite)
|   |-- src/
|   |   |-- main.jsx              Entry point - wraps app in providers
|   |   |-- App.jsx               All routes defined here
|   |   |-- context/
|   |   |   |-- AuthContext.jsx   User login state
|   |   |   |-- WalletContext.jsx MetaMask connection state
|   |   |   |-- ElectionContext.jsx Election data fetching
|   |   |-- pages/
|   |   |   |-- Home.jsx
|   |   |   |-- Login.jsx         Voter + Admin login (toggled)
|   |   |   |-- Register.jsx      Voter registration form
|   |   |   |-- admin/
|   |   |   |   |-- AdminDashboard.jsx
|   |   |   |   |-- AdminElectionsList.jsx
|   |   |   |   |-- CreateElection.jsx
|   |   |   |   |-- ManageElection.jsx  (tabbed: overview/candidates/voters/results)
|   |   |   |-- voter/
|   |   |       |-- Dashboard.jsx       Voter home (my elections)
|   |   |       |-- ElectionsList.jsx   Browse all elections
|   |   |       |-- ElectionDetail.jsx  Single election view
|   |   |       |-- VotingPage.jsx      5-step voting flow
|   |   |       |-- Results.jsx         Election results
|   |   |-- components/
|   |   |   |-- common/
|   |   |   |   |-- Navbar.jsx, Footer.jsx, LoadingSpinner.jsx
|   |   |   |   |-- ProtectedRoute.jsx  Blocks non-voters
|   |   |   |   |-- AdminRoute.jsx      Blocks non-admins
|   |   |   |-- voter/
|   |   |       |-- CandidateCard.jsx, MetaMaskConnect.jsx
|   |   |       |-- OTPInput.jsx, WebcamCapture.jsx
|   |   |-- utils/
|   |       |-- api.js            Axios instance (base URL + auth header)
|   |       |-- contract.js       ethers.js contract helper for browser
|   |-- .env                      VITE_API_URL
|
|-- python-service/      FACE RECOGNITION (Python + DeepFace)
|   |-- app.py                    Flask server with /verify endpoint
|   |-- requirements.txt
|
|-- API.md               Complete API reference
|-- ARCHITECTURE.md      System architecture diagrams
|-- FRONTEND_SPEC.md     Every page and component documented
|-- HOW_TO_USE_AND_PRESENT.md  Demo guide for teachers
|-- CODEBASE_GUIDE.md    This file
`
---

## 4. The Two User Roles

### Admin
- Logs in at /login using email + password
- Has full control: create elections, add candidates, manage voters
- Their private key (in server/.env) is used by the server to sign blockchain transactions
- Admin wallet: 0x5b979D566867F2f5abaEE5d51292E1bd1740f103

### Voter
- Registers at /register with personal details (name, Voter ID, Aadhar, etc.)
- Logs in using Voter ID + password
- Can browse elections, request registration, and vote
- Each voter can participate in multiple elections with different MetaMask wallets

---

## 5. The Database - What Gets Stored Where

### User document (voters)
The most important field is the elections array.
Each item represents the voter participation in ONE election:

`
User {
  fullName, email, password (hashed), voterID, aadharNumber,
  age, gender, address, state, city, pincode, contactNumber,
  role: voter,

  elections: [
    {
      electionId: abc123,          Which election
      walletAddress: 0x...,        Their MetaMask wallet for THIS election
      facePhotoUrl: https://...,   Cloudinary URL of their face photo
      isVerified: true,            Admin approved them
      isRegisteredOnChain: true,   Wallet registered on smart contract
      hasVoted: false,             Have they voted yet
      votedAt: null                When they voted
    },
    {
      electionId: def456,          A DIFFERENT election
      walletAddress: 0xDIFFERENT,  Can use a different wallet
    }
  ]
}
`

This design means one voter can be in many elections, each with independent status.

### Election document
`
Election {
  title: Presidential Election 2025,
  contractAddress: 0x...,   The Ethereum address of this election contract
  adminId: ObjectId,
  phase: registration,      Current phase
  startTime, endTime
}
`

### Candidate document
`
Candidate {
  electionId: ObjectId,
  name: Alice Johnson,
  partyName: Progressive Party,
  partySymbol: https://cloudinary.com/...,
  onChainId: 1                ID on the smart contract (1, 2, 3...)
}
`

### OTP document
`
OTP {
  email: voter@gmail.com,
  code: 123456,
  expiresAt: Date,    MongoDB TTL index auto-deletes after 5 minutes
  used: false
}
`

---

## 6. The Smart Contracts

### Why two contracts?

ElectionFactory.sol is deployed ONCE and never changes.
Election.sol is deployed ONCE PER ELECTION.
Every time admin creates an election, a brand new Election contract is deployed.

### ElectionFactory.sol (at 0x0493732CE8A223fedbC7FEE3f5780D7c46385eb5)

`
createElection(title, description, startTime, endTime, adminAddress)
  -> Deploys a new Election.sol
  -> Returns the new contract address
  -> Emits ElectionCreated event (server reads this to get the address)
`

### Election.sol (one per election)

`
State:
  electionAdmin    Who controls this election
  currentPhase     Registration / Voting / Completed
  candidates       mapping(id => Candidate struct)
  voters           mapping(address => Voter struct)

Admin functions (only electionAdmin can call):
  addCandidate(name, partyName, partySymbol)
  removeCandidate(id)
  registerVoter(walletAddress)    Adds wallet to approved list
  changePhase(newPhase)

Voter function:
  castVote(candidateId)           The actual vote transaction

Read functions (free, anyone):
  getCandidate(id), getAllCandidates()
  getVoterStatus(address), getWinner()
`

### Phase Rules
`
Registration -> Voting -> Completed
Can go back Voting -> Registration ONLY if 0 votes cast
`

---

## 7. The Server - How Each Route File Works

### server.js (entry point)
`javascript
app.use('/api/auth',    require('./routes/auth'));
app.use('/api',         require('./routes/elections'));
app.use('/api',         require('./routes/electionVoters'));
app.use('/api',         require('./routes/electionCandidates'));
app.use('/api/voters',  require('./routes/voters'));
app.use('/api/otp',     require('./routes/otp'));
app.use('/api/face',    require('./routes/face'));
app.use('/api/votes',   require('./routes/votes'));
`

### server/utils/blockchain.js
Bridge between Node.js and Ethereum:
- Creates ethers.js provider connected to Alchemy (Sepolia RPC)
- Creates admin wallet using private key from .env
- Exports: getFactoryContract(), getElectionContract(address), getElectionContractReadOnly(address)

When server calls contract.registerVoter(wallet), it uses the admin wallet to sign and pay.
The voter never pays for registration - only for their own vote.

### server/middleware/auth.js
Every protected route passes through this:
1. Reads Authorization: Bearer <token> header
2. Verifies JWT using JWT_SECRET
3. Looks up user in MongoDB (User or Admin collection)
4. Attaches user object to req.user

### server/routes/elections.js
- POST /admin/elections - deploys contract via factory, saves to MongoDB
- POST /admin/elections/:id/phase - calls contract.changePhase() on blockchain

### server/routes/electionVoters.js
- POST /admin/elections/:id/voters/:uid/approve - sets isVerified: true in MongoDB
- POST /admin/elections/:id/voters/:uid/face - uploads to Cloudinary, saves URL
- POST /admin/elections/:id/voters/:uid/register-onchain - calls contract.registerVoter()

### server/routes/voters.js
- GET /voters/elections - returns elections the voter is registered in
- POST /voters/elections/:id/request-registration - voter requests to join election

### server/routes/face.js
1. Gets voter facePhotoUrl from MongoDB
2. Sends liveImage + photoUrl to Python /verify
3. If match: creates faceVerifiedToken JWT (5 min expiry)

### server/routes/otp.js
- POST /otp/send - verifies faceVerifiedToken, generates 6-digit code, sends email
- POST /otp/verify - checks code, creates voteAuthToken JWT (2 min expiry)

### server/routes/votes.js
- POST /votes/record - verifies voteAuthToken, checks txHash on blockchain, marks hasVoted: true
- GET /votes/results/:id - reads vote counts from blockchain

---

## 8. The Python Service - Face Verification

File: python-service/app.py
Single endpoint: POST /verify

What it receives:
`json
{
  "liveImage": "data:image/jpeg;base64,/9j/4AAQ...",
  "photoUrl": "https://res.cloudinary.com/..."
}
`

What it does:
1. Decodes base64 live image into numpy array (in memory, no disk write)
2. Downloads Cloudinary photo URL into numpy array (in memory)
3. Calls DeepFace.verify(img1, img2, model_name=ArcFace)
4. DeepFace creates 128-dimensional face encodings for both images
5. Calculates cosine distance between encodings
6. If distance < 0.68: match = true

What it returns:
`json
{
  "success": true,
  "match": true,
  "distance": 0.32,
  "confidence": 0.85,
  "message": "Face verified successfully"
}
`

No images are ever saved to disk. Everything happens in memory.

---

## 9. The Frontend - How React Is Organized

### Entry Point: main.jsx
Wraps the entire app in three Context Providers:
`jsx
<AuthProvider>          // Manages login state
  <WalletProvider>      // Manages MetaMask connection
    <ElectionProvider>  // Manages election data
      <App />
    </ElectionProvider>
  </WalletProvider>
</AuthProvider>
`

### AuthContext (context/AuthContext.jsx)
- Stores: user object, token, isAdmin boolean
- On app load: reads token from localStorage, calls GET /auth/me to restore session
- login(): calls API, stores token in localStorage
- logout(): clears token and user state

### WalletContext (context/WalletContext.jsx)
- Stores: address, chainId, isConnected, isCorrectNetwork
- connectWallet(): calls window.ethereum.request for accounts
- switchToSepolia(): switches MetaMask to Sepolia (chainId 11155111)
- Listens for MetaMask account/network changes automatically

### ElectionContext (context/ElectionContext.jsx)
- fetchPublicElections(): calls GET /elections
- fetchVoterElections(): calls GET /voters/elections
- getVoterStatus(electionId): calls GET /voters/elections/:id/status

### Route Protection
- ProtectedRoute: wraps voter pages, redirects to /login if not logged in
- AdminRoute: wraps admin pages, redirects to /login if not admin

### utils/api.js
Axios instance for ALL API calls:
- Base URL: http://localhost:5000/api
- Timeout: 60 seconds
- Auto-adds JWT header to every request
- Auto-logs out on 401 response

### utils/contract.js
Used in browser to interact with Election contract via MetaMask.
When voter calls contract.castVote(candidateId), MetaMask pops up to sign.
---

## 10. The Complete Voting Flow - Step by Step

`
VOTER OPENS /elections/:id/vote

STEP 1 - WALLET
  Browser checks MetaMask installed
  Browser calls window.ethereum.request for accounts
  MetaMask popup: Connect to localhost:3000?
  Browser stores wallet address in WalletContext
  Browser checks chainId === 11155111 (Sepolia)
  -> Auto-advance to Step 2

STEP 2 - FACE VERIFICATION
  Browser opens webcam via react-webcam
  Voter positions face, clicks Capture Photo
  Browser gets base64 JPEG from webcam
  Browser: POST /api/face/verify with liveImageBase64 and electionId
  Server looks up voter facePhotoUrl from MongoDB
  Server: POST http://localhost:8000/verify with liveImage and photoUrl
  Python downloads Cloudinary photo, decodes base64 live image
  Python: DeepFace.verify(img1, img2, model=ArcFace)
  Python returns match: true, distance: 0.32
  Server creates faceVerifiedToken JWT (expires in 5 min)
  Server returns match: true, faceVerifiedToken
  Browser stores faceVerifiedToken in state
  -> Advance to Step 3

STEP 3 - OTP
  Voter clicks Send OTP
  Browser: POST /api/otp/send with faceVerifiedToken and electionId
  Server verifies faceVerifiedToken (JWT signature + expiry)
  Server generates random 6-digit code
  Server saves OTP to MongoDB with 5-min TTL
  Server sends email via Gmail SMTP (Nodemailer)
  Server returns masked email like pr***@gmail.com
  Voter checks email, enters 6-digit code in OTP boxes
  Browser: POST /api/otp/verify with code and electionId
  Server finds OTP in MongoDB, checks code matches, checks not expired
  Server marks OTP as used: true
  Server creates voteAuthToken JWT (expires in 2 min)
  Server returns verified: true, voteAuthToken
  Browser stores voteAuthToken in state
  -> Advance to Step 4

STEP 4 - CAST VOTE
  Voter selects a candidate card
  Voter clicks Cast Vote
  Browser gets election contract via ethers.js (connected to MetaMask)
  Browser: contract.castVote(candidate.onChainId)
  MetaMask popup: Transaction Request - Network fee: 0.0002 SepoliaETH
  Voter clicks Confirm
  Ethereum broadcasts transaction to Sepolia network
  Browser waits for receipt (tx.wait())
  Browser gets txHash from receipt
  -> Advance to Step 5

STEP 5 - RECORD
  Browser: POST /api/votes/record with electionId, candidateId, txHash, voteAuthToken
  Server verifies voteAuthToken (JWT, checks electionId matches)
  Server calls provider.getTransactionReceipt(txHash) on Alchemy
  Server verifies receipt.to === election.contractAddress
  Server verifies receipt.status === 1 (success)
  Server verifies VoteCast event exists in receipt logs
  Server sets user.elections[electionId].hasVoted = true in MongoDB
  Server returns message: Vote recorded, txHash
  Browser shows success screen with txHash and Etherscan link
`

---

## 11. The Admin Workflow - Step by Step

`
ADMIN CREATES ELECTION
  Admin fills form (title, description, start/end dates)
  Browser: POST /api/admin/elections
  Server calls factory.createElection(..., ADMIN_WALLET_ADDRESS)
  Blockchain deploys new Election.sol contract
  Blockchain emits ElectionCreated event with new contract address
  Server reads contract address from event logs
  Server saves Election to MongoDB with contractAddress

ADMIN ADDS CANDIDATE
  Admin fills form (name, party, uploads image file)
  Browser: POST /api/admin/elections/:id/candidates (multipart/form-data)
  Server: Multer uploads to Cloudinary, gets URL
  Server calls contract.addCandidate(name, partyName, cloudinaryUrl)
  Blockchain stores candidate, emits CandidateAdded(id, ...)
  Server reads onChainId from event
  Server saves Candidate to MongoDB with onChainId

ADMIN APPROVES VOTER
  Admin clicks Approve next to voter name
  Browser: POST /api/admin/elections/:id/voters/:uid/approve
  Server sets user.elections[electionId].isVerified = true in MongoDB
  No blockchain transaction - just a database update

ADMIN UPLOADS FACE PHOTO
  Admin clicks Upload and selects/captures photo
  Browser: POST /api/admin/elections/:id/voters/:uid/face (multipart)
  Server: Multer uploads to Cloudinary
  Server saves Cloudinary URL to user.elections[electionId].facePhotoUrl

ADMIN REGISTERS VOTER ON BLOCKCHAIN
  Admin clicks Register On-Chain (voter must be approved first)
  Browser: POST /api/admin/elections/:id/voters/:uid/register-onchain
  Server checks election.phase === registration
  Server calls contract.registerVoter(walletAddress) using admin wallet
  Blockchain adds wallet to approved voters mapping
  Server sets user.elections[electionId].isRegisteredOnChain = true

ADMIN STARTS VOTING
  Admin clicks Start Voting
  Browser: POST /api/admin/elections/:id/phase with phase: voting
  Server calls contract.changePhase(1) (1 = Voting enum value)
  Blockchain sets currentPhase = Voting
  Server updates election.phase = voting in MongoDB
`

---

## 12. Key Files to Read First

| Order | File | Why |
|-------|------|-----|
| 1 | blockchain/contracts/Election.sol | The core - understand what the contract does |
| 2 | server/server.js | See how the backend is structured |
| 3 | server/utils/blockchain.js | How server talks to blockchain |
| 4 | server/routes/elections.js | Election creation and phase changes |
| 5 | server/routes/votes.js | Vote recording logic |
| 6 | client/src/main.jsx | How React app is bootstrapped |
| 7 | client/src/App.jsx | All routes |
| 8 | client/src/context/AuthContext.jsx | Auth state management |
| 9 | client/src/pages/voter/VotingPage.jsx | The 5-step voting UI |
| 10 | python-service/app.py | Face verification service |

---

## 13. Common Confusions Explained

### Why does the server have a private key?
The admin wallet private key (ADMIN_WALLET_PRIVATE_KEY in .env) is used by the server to sign
blockchain transactions on behalf of the admin. When admin clicks Add Candidate or Register Voter,
the server uses this key to pay gas and sign the transaction.
The voter MetaMask is only used for the actual vote transaction.

### Why are there two ABIs (ElectionABI and ElectionFactoryABI)?
An ABI (Application Binary Interface) tells ethers.js what functions a contract has.
The factory ABI is used to call createElection().
The election ABI is used to call addCandidate(), registerVoter(), castVote(), etc.
Both are in server/utils/ and client/src/utils/.

### What is onChainId vs _id?
Every candidate has two IDs:
- _id: MongoDB ObjectId (used in API calls like DELETE /candidates/:id)
- onChainId: Integer ID on the smart contract (1, 2, 3...) used when calling castVote(onChainId)

### Why does the voter need Sepolia ETH?
When a voter calls contract.castVote() via MetaMask, they send a transaction to Ethereum.
This requires paying a small gas fee in ETH.
On Sepolia testnet, this is free test ETH from https://sepoliafaucet.com

### What is faceVerifiedToken vs voteAuthToken?
Two separate short-lived JWTs forming a security chain:
- faceVerifiedToken (5 min): proves face verification passed, required to send OTP
- voteAuthToken (2 min): proves OTP verification passed, required to record vote
This prevents someone from skipping steps.

### Why is wallet address stored in both MongoDB AND blockchain?
- MongoDB: quick lookup (checking status, displaying in UI)
- Blockchain: authoritative record (contract checks this when castVote() is called)
Both must be in sync. Server updates MongoDB after blockchain transaction confirms.

### What happens if the Python service is down?
Face verification fails with a 503 error. The voter cannot proceed past Step 2.
The server catches ECONNREFUSED errors and returns a clear message.
The Python service must be running on port 8000.

### Why is there a rate limit on OTP?
The OTP endpoint is limited to 3 requests per 10 minutes per voter per election.
This prevents someone from spamming OTP requests to flood the voter email inbox.

---

## 14. Environment Variables Explained

### server/.env

| Variable | What It Is | Where Used |
|----------|-----------|------------|
| MONGODB_URI | MongoDB Atlas connection string | config/db.js |
| JWT_SECRET | Secret for signing auth tokens | middleware/auth.js |
| JWT_EXPIRES_IN | Auth token lifetime (7d) | routes/auth.js |
| VOTE_AUTH_TOKEN_SECRET | Secret for vote auth tokens | routes/otp.js, routes/votes.js |
| VOTE_AUTH_TOKEN_EXPIRES_IN | Vote token lifetime (2m) | routes/otp.js |
| EMAIL_HOST | smtp.gmail.com | utils/mailer.js |
| EMAIL_PORT | 587 | utils/mailer.js |
| EMAIL_USER | Gmail address | utils/mailer.js |
| EMAIL_PASS | Gmail App Password (16 chars) | utils/mailer.js |
| EMAIL_FROM | Display name in emails | utils/mailer.js |
| ALCHEMY_SEPOLIA_URL | Ethereum RPC endpoint | utils/blockchain.js |
| ADMIN_WALLET_PRIVATE_KEY | Admin Ethereum private key | utils/blockchain.js |
| FACTORY_CONTRACT_ADDRESS | Deployed factory address | utils/blockchain.js |
| CLOUDINARY_CLOUD_NAME | Cloudinary account name | utils/cloudinary.js |
| CLOUDINARY_API_KEY | Cloudinary API key | utils/cloudinary.js |
| CLOUDINARY_API_SECRET | Cloudinary API secret | utils/cloudinary.js |
| PYTHON_FACE_API_URL | Python service URL | routes/face.js |
| PORT | Server port (5000) | server.js |
| OTP_RATE_LIMIT_WINDOW_MS | Rate limit window (600000 = 10min) | routes/otp.js |
| OTP_RATE_LIMIT_MAX | Max OTP requests per window (3) | routes/otp.js |

### client/.env

| Variable | What It Is |
|----------|-----------|
| VITE_API_URL | Backend URL (http://localhost:5000/api) |

---

## 15. How to Trace a Bug

### Voter cannot vote
1. Check GET /voters/elections/:id/status - is isVerified, isRegisteredOnChain, facePhotoUrl all true?
2. Check election phase - must be voting
3. Check MetaMask - must be on Sepolia network (chainId 11155111)
4. Check voter wallet has Sepolia ETH

### Face verification fails
1. Is Python service running? Check http://localhost:8000/health
2. Is facePhotoUrl set in the voter election data?
3. Is the Cloudinary URL accessible? Open it in browser
4. Is lighting good for webcam capture?

### OTP not received
1. Check EMAIL_USER and EMAIL_PASS in server/.env
2. EMAIL_PASS must be a Gmail App Password (not regular password)
3. Check spam folder
4. Test mailer: cd server && node -e "require('dotenv').config(); require('./utils/mailer').sendOTP('test@gmail.com','123456').then(()=>console.log('OK')).catch(console.error)"

### Blockchain transaction fails
1. Check election phase (registration required for registerVoter, voting for castVote)
2. Check admin wallet has Sepolia ETH (for server-side transactions)
3. Check voter wallet has Sepolia ETH (for castVote)
4. Check contract address is correct in MongoDB

### Server crashes on start
1. Check MONGODB_URI is correct
2. Check ADMIN_WALLET_PRIVATE_KEY starts with 0x
3. Check FACTORY_CONTRACT_ADDRESS is set
4. Run: cd server && node scripts/seedAdmin.js

---

## 16. Running the Project

Start order matters:
`
1. Python service first  (face verification)
2. Server second         (needs Python running)
3. Client last           (needs server running)
`

`ash
# Terminal 1 - Python
cd python-service
python app.py
# Should print: Running on http://0.0.0.0:8000

# Terminal 2 - Server
cd server
npm run dev
# Should print: eVoteFace server running on port 5000
# Should print: MongoDB connected: ...

# Terminal 3 - Client
cd client
npm run dev
# Should print: Local: http://localhost:3000
`

First time setup:
`ash
cd server
node scripts/seedAdmin.js
# Note the email and password printed
`

Verify everything works:
- http://localhost:3000 - Home page loads
- http://localhost:5000/api/health - Returns status ok
- http://localhost:8000/health - Returns status healthy

---

## 17. What Happens When You Open the App (Request Lifecycle)

When a voter opens http://localhost:3000, here is the exact sequence:

1. Browser loads React app (client/src/main.jsx)
2. AuthProvider mounts, reads evf_token from localStorage
3. If token exists: calls GET /api/auth/me to restore user session
4. If token missing or expired: user stays logged out
5. WalletProvider mounts, calls window.ethereum.eth_accounts to check if MetaMask already connected
6. App.jsx renders the correct page based on URL
7. ProtectedRoute/AdminRoute check auth state before rendering protected pages

---

## 18. How Data Flows Through a Typical API Call

Example: Voter clicks "Request Registration" for an election

BROWSER
  User clicks button in ElectionsList.jsx
  handleRequestRegistration(electionId) is called
  api.post('/voters/elections/abc123/request-registration', { walletAddress: '0x...' })
  Axios adds Authorization: Bearer eyJ... header automatically
  HTTP POST sent to http://localhost:5000/api/voters/elections/abc123/request-registration

SERVER
  Express receives request
  auth middleware runs: verifies JWT, loads user from MongoDB, sets req.user
  Route handler in voters.js runs:
    - Validates walletAddress format
    - Checks walletAddress is not admin wallet
    - Finds election in MongoDB
    - Checks voter not already registered
    - Checks wallet not used by another voter
    - Pushes new entry to user.elections array
    - Saves user to MongoDB
    - Returns 200 with success message

BROWSER
  Axios receives 200 response
  toast.success('Registration request sent!')
  loadElections() called to refresh the list
  UI updates to show 'Pending Approval' badge

---

## 19. The ManageElection Page - Most Complex Admin Page

File: client/src/pages/admin/ManageElection.jsx

This is the most complex page in the project. It has 4 tabs:

TAB 1 - OVERVIEW
  Shows current phase with 3 buttons: Set to Registration / Start Voting / Complete Election
  Each button calls POST /admin/elections/:id/phase
  Shows stats: total candidates, voters, votes cast
  Shows contract address

TAB 2 - CANDIDATES
  Only shows Add Candidate form if phase === registration
  Form submits multipart/form-data (name, partyName, partySymbol image)
  Lists all candidates with Remove button (registration phase only)

TAB 3 - VOTERS
  Shows warning banner if phase is not registration (cannot register on-chain)
  Table with columns: Voter | Status | Face Photo | Blockchain | Actions
  Status column: Approved (green) or Pending (yellow)
  Face Photo column: Upload link or View link with modal
  Blockchain column: shows truncated wallet + Register On-Chain button
  Actions: Approve button, Remove button
  Face upload modal has two tabs: File Upload and Webcam Capture

TAB 4 - RESULTS
  Reads from blockchain via GET /admin/elections/:id/results
  Shows winner (if completed), vote counts, turnout percentage

---

## 20. The VotingPage - Most Complex Voter Page

File: client/src/pages/voter/VotingPage.jsx

This is the most complex voter page. It has 5 steps managed by currentStep state (1-5).

On load:
  Fetches election details (GET /elections/:id)
  Fetches voter status (GET /voters/elections/:id/status)
  Validates eligibility: isRegistered, not hasVoted, phase === voting, all requirements met
  If any check fails: redirects away with toast error

Step 1 (Wallet):
  Uses useWallet() context to check MetaMask state
  useEffect auto-advances to step 2 when isConnected && isCorrectNetwork

Step 2 (Face):
  Uses WebcamCapture component
  On capture: stores base64 image in liveImage state
  On verify click: calls POST /face/verify, stores faceVerifiedToken

Step 3 (OTP):
  Send OTP button: calls POST /otp/send with faceVerifiedToken
  OTPInput component: 6 boxes, auto-submits on complete
  On verify: calls POST /otp/verify, stores voteAuthToken

Step 4 (Vote):
  Maps candidates to selectable cards
  On Cast Vote: calls contract.castVote(onChainId) via MetaMask
  Waits for tx.wait(), gets txHash
  Calls POST /votes/record with txHash + voteAuthToken

Step 5 (Success):
  Shows txHash with Etherscan link
  Buttons to go back to election or dashboard

---

## 21. How Authentication Works End-to-End

REGISTRATION (voter)
  POST /auth/register
  Server creates User with role: voter
  Password hashed with bcrypt (10 rounds)
  Returns user object (no token yet - must wait for admin approval)

LOGIN (voter)
  POST /auth/login with voterID + password
  Server finds user by voterID
  bcrypt.compare(password, user.password)
  If match: jwt.sign({ id: user._id, role: voter }, JWT_SECRET, { expiresIn: 7d })
  Returns token + user object
  Client stores token in localStorage as evf_token

LOGIN (admin)
  POST /auth/admin/login with email + password
  Same flow but looks in Admin collection
  Token has role: admin

EVERY PROTECTED REQUEST
  Client: Axios interceptor adds Authorization: Bearer <token>
  Server: auth middleware decodes token
  If role === admin: looks in Admin collection
  If role === voter: looks in User collection
  Attaches full user/admin object to req.user
  Route handler uses req.user._id, req.user.role, etc.

TOKEN EXPIRY
  JWT expires after 7 days
  On 401 response: Axios interceptor removes token from localStorage
  Redirects to /login automatically

---

## 22. How Images Are Stored (Cloudinary)

All images go through Cloudinary, never stored on the server disk.

PARTY SYMBOL UPLOAD (admin adds candidate)
  Admin selects image file in form
  Browser sends multipart/form-data to POST /admin/elections/:id/candidates
  Server: multer-storage-cloudinary middleware intercepts the file
  Multer streams file directly to Cloudinary (never touches disk)
  Cloudinary returns a URL like https://res.cloudinary.com/dupwxpvyo/image/upload/...
  Server uses this URL as partySymbol when calling contract.addCandidate()
  URL also saved in Candidate MongoDB document

FACE PHOTO UPLOAD (admin uploads voter face)
  Same flow via POST /admin/elections/:id/voters/:uid/face
  URL saved to user.elections[electionId].facePhotoUrl in MongoDB

FACE VERIFICATION (voter votes)
  Server reads facePhotoUrl from MongoDB
  Sends URL to Python service
  Python downloads image from Cloudinary URL into memory
  Compares with live webcam image
  Cloudinary URL never sent to the browser

---

## 23. How the Blockchain Reads Work (No Gas Cost)

Some blockchain calls are FREE (read-only, no transaction needed):
  getCandidate(id)
  getAllCandidates()
  getVoterStatus(address)
  getWinner()
  currentPhase()
  totalVotesCast()

These use getElectionContractReadOnly() which has no signer (just a provider).
They call Alchemy RPC which reads from the blockchain node.
No MetaMask popup, no gas fee, instant response.

Write operations cost gas (require a signer):
  addCandidate() - admin wallet pays
  removeCandidate() - admin wallet pays
  registerVoter() - admin wallet pays
  changePhase() - admin wallet pays
  castVote() - voter wallet pays (via MetaMask)

---

## 24. Multi-Election Architecture Explained

The key design decision: one voter can be in multiple elections.

OLD DESIGN (single election):
  User { walletAddress, facePhotoUrl, hasVoted, isVerified }
  Problem: voter can only be in one election

NEW DESIGN (multi-election):
  User { elections: [{ electionId, walletAddress, facePhotoUrl, hasVoted, isVerified }] }
  Each election entry is completely independent

This means:
  - Voter can use wallet A for Election 1 and wallet B for Election 2
  - Voter can be approved in Election 1 but pending in Election 2
  - Voter can have voted in Election 1 but not yet in Election 2
  - Admin manages voters per-election, not globally

When admin clicks Approve in Election 1:
  Server finds user.elections entry where electionId === election1._id
  Sets that entry's isVerified = true
  Does NOT affect the voter's status in Election 2

---

## 25. Glossary of Terms

| Term | Meaning |
|------|---------|
| ABI | Application Binary Interface - JSON describing contract functions |
| Alchemy | Service providing Ethereum RPC endpoint (like a gateway to blockchain) |
| Cloudinary | Cloud image storage service |
| Contract Address | Unique Ethereum address where a smart contract lives |
| DeepFace | Python library for AI face recognition |
| ethers.js | JavaScript library to interact with Ethereum |
| Factory Pattern | One contract (factory) that deploys many other contracts |
| Gas | Fee paid in ETH to execute Ethereum transactions |
| Hardhat | Development framework for Ethereum smart contracts |
| JWT | JSON Web Token - signed token proving identity |
| MetaMask | Browser extension that manages Ethereum wallets |
| Mongoose | MongoDB object modeling library for Node.js |
| Multer | Node.js middleware for handling file uploads |
| Nodemailer | Node.js library for sending emails |
| onChainId | Integer ID of a candidate on the smart contract |
| Phase | Election lifecycle stage: Registration / Voting / Completed |
| Private Key | Secret key that proves ownership of an Ethereum wallet |
| RPC | Remote Procedure Call - how code talks to blockchain nodes |
| Sepolia | Ethereum test network (free test ETH, same as mainnet) |
| Signer | ethers.js object that can sign and send transactions |
| Solidity | Programming language for Ethereum smart contracts |
| TTL Index | MongoDB index that auto-deletes documents after a time |
| txHash | Transaction hash - unique ID of a blockchain transaction |
| Vite | Fast build tool for React frontend |
| Wallet | Ethereum account identified by a public address |


---

## 17. What Happens When You Open the App

When a voter opens http://localhost:3000, exact sequence:

1. Browser loads React app (client/src/main.jsx)
2. AuthProvider mounts, reads evf_token from localStorage
3. If token exists: calls GET /api/auth/me to restore user session
4. If token missing or expired: user stays logged out
5. WalletProvider mounts, calls window.ethereum.eth_accounts to check MetaMask
6. App.jsx renders the correct page based on URL
7. ProtectedRoute/AdminRoute check auth state before rendering protected pages
