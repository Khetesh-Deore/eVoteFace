# eVoteFace - Local Development Setup Guide

## Prerequisites

- Node.js v18+ and npm
- Python 3.9+
- Git
- MongoDB Atlas account (free tier)
- MetaMask or similar wallet (for blockchain)

---

## 1. Backend Setup (Node.js Express)

### Clone Repository
```bash
git clone https://github.com/yourusername/eVoteFace.git
cd eVoteFace/server
```

### Install Dependencies
```bash
npm install
```

### Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env` with your values:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/evoteface
JWT_SECRET=your_jwt_secret_key_here_min_32_characters
JWT_EXPIRE=1h
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here_min_32_characters
BLOCKCHAIN_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
AI_SERVICE_URL=http://localhost:5001
CORS_ORIGIN=http://localhost:3000
```

### Setup MongoDB
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Create database user
4. Get connection string
5. Replace in `.env` MONGODB_URI

### Seed Database
```bash
node seeds/seedAdmin.js
node seeds/seedCandidates.js
```

### Run Development Server
```bash
npm run dev
```

Server runs on `http://localhost:5000`

### Verify Backend
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "eVoteFace Backend",
  "timestamp": "2026-03-29T10:30:00.000Z",
  "uptime": 3600,
  "environment": "development"
}
```

---

## 2. Frontend Setup (React + Vite)

### Navigate to Client
```bash
cd ../client
```

### Install Dependencies
```bash
npm install
```

### Configure Environment Variables
```bash
cp .env.example .env.development
```

Edit `.env.development`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_AI_URL=http://localhost:5001
VITE_BLOCKCHAIN_NETWORK=mumbai
VITE_BLOCKCHAIN_RPC_URL=https://rpc-mumbai.maticvigil.com
VITE_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
VITE_APP_NAME=eVoteFace
VITE_APP_VERSION=1.0.0
VITE_DEBUG=true
```

### Run Development Server
```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

---

## 3. AI Service Setup (Python Flask)

### Navigate to AI Service
```bash
cd ../ai-service
```

### Create Virtual Environment
```bash
python -m venv venv
```

### Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env`:
```env
FLASK_PORT=5001
FLASK_ENV=development
CONFIDENCE_THRESHOLD=0.60
```

### Run Development Server
```bash
python app.py
```

AI Service runs on `http://localhost:5001`

### Verify AI Service
```bash
curl http://localhost:5001/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "eVoteFace AI",
  "timestamp": "2026-03-29T10:30:00.000Z",
  "version": "1.0.0"
}
```

---

## 4. Blockchain Setup (Hardhat + Solidity)

### Navigate to Blockchain
```bash
cd ../blockchain
```

### Install Dependencies
```bash
npm install
```

### Configure Environment Variables
```bash
cp .env.example .env
```

Edit `.env`:
```env
MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### Get Private Key

**Option 1: MetaMask**
1. Open MetaMask
2. Click account icon → Settings → Security & Privacy
3. Click "Reveal Secret Recovery Phrase"
4. Or: Account Details → Export Private Key

**Option 2: Hardhat Test Accounts**
```bash
npx hardhat accounts
```

### Get Testnet MATIC

1. Go to [Polygon Faucet](https://faucet.polygon.technology/)
2. Select Mumbai network
3. Enter your wallet address
4. Claim testnet MATIC

### Compile Smart Contract
```bash
npm run compile
```

### Run Tests
```bash
npm run test
```

### Deploy to Local Hardhat
```bash
npm run deploy
```

### Deploy to Mumbai Testnet
```bash
npm run deploy:mumbai
```

### Verify Deployment
```bash
npm run verify
```

---

## 5. Running All Services Together

### Terminal 1: Backend
```bash
cd server
npm run dev
```

### Terminal 2: Frontend
```bash
cd client
npm run dev
```

### Terminal 3: AI Service
```bash
cd ai-service
source venv/bin/activate  # or venv\Scripts\activate on Windows
python app.py
```

### Terminal 4: Blockchain (Optional)
```bash
cd blockchain
npx hardhat node
```

---

## 6. Testing the System

### Test Voter Flow
1. Open `http://localhost:3000`
2. Click "Register to Vote"
3. Fill in details and capture face
4. Login with credentials
5. Verify face
6. Cast vote
7. View receipt with blockchain hash

### Test Admin Flow
1. Go to `http://localhost:3000/admin/login`
2. Login with admin credentials (default: admin/admin)
3. Manage voters, candidates, election
4. View live results
5. Check audit log

### Test APIs
```bash
# Register voter
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","voterId":"VOT123","password":"Pass123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"voterId":"VOT123","password":"Pass123"}'

# Get candidates
curl http://localhost:5000/api/vote/candidates

# Health check
curl http://localhost:5000/health
curl http://localhost:5001/health
```

---

## 7. Troubleshooting

### MongoDB Connection Error
- Check MONGODB_URI in `.env`
- Verify IP whitelist in MongoDB Atlas
- Ensure database user has correct permissions

### Port Already in Use
```bash
# Find process using port
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Face Recognition Not Working
- Ensure webcam permissions granted
- Check lighting conditions
- Verify DeepFace installed: `pip list | grep deepface`
- Check AI service logs

### Blockchain Deployment Failed
- Verify private key format (0x + 64 hex characters)
- Check account has testnet MATIC
- Verify RPC URL is correct
- Check network configuration in hardhat.config.js

### CORS Errors
- Verify CORS_ORIGIN in backend `.env`
- Check VITE_API_URL in frontend `.env`
- Ensure backend CORS middleware enabled

---

## 8. Database Seeding

### Seed Admin User
```bash
cd server
node seeds/seedAdmin.js
```

Default credentials:
- Username: `admin`
- Password: `admin123`

### Seed Candidates
```bash
node seeds/seedCandidates.js
```

Creates 5 sample candidates

### Clear Database
```bash
# Connect to MongoDB and run:
db.users.deleteMany({})
db.candidates.deleteMany({})
db.votes.deleteMany({})
db.elections.deleteMany({})
db.admins.deleteMany({})
```

---

## 9. Development Tools

### MongoDB Compass
- Download: [mongodb.com/products/compass](https://www.mongodb.com/products/compass)
- Connect to local or Atlas database
- Browse collections and documents

### Postman
- Download: [postman.com](https://www.postman.com)
- Import API collection
- Test endpoints

### Hardhat Console
```bash
cd blockchain
npx hardhat console --network localhost
```

---

## 10. Next Steps

1. ✅ Setup all services
2. ✅ Seed database
3. ✅ Test voter flow
4. ✅ Test admin flow
5. ✅ Run test suite: `npm run test` (in each folder)
6. ✅ Check TESTING_CHECKLIST.md
7. ✅ Deploy to production (see DEPLOYMENT_GUIDE.md)

---

## Support

For issues or questions:
1. Check logs in each service
2. Review TESTING_CHECKLIST.md
3. Check API.md for endpoint details
4. Review error messages carefully
