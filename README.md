# eVoteFace V2 — Multi-Election Blockchain Voting System

> Secure digital voting with Face Recognition + Blockchain + OTP  
> Stack: MERN + Python (DeepFace) + Ethereum (Solidity)  
> Multi-Election Architecture with Factory Pattern

---

## 🎯 What's New in V2

- **Multi-Election Support**: One platform, unlimited elections
- **Factory Pattern**: Deploy new election contracts on-demand
- **Per-Election Data**: Each voter can participate in multiple elections with different wallets
- **DeepFace Integration**: Advanced face recognition with ArcFace model
- **Cloudinary Storage**: Permanent face photo and party symbol storage
- **Enhanced Admin Panel**: Complete election lifecycle management
- **Improved Security**: Short-lived tokens, rate limiting, role-based access

---

## ✨ Features

### Security
- **Three-Factor Authentication**: MetaMask wallet + Face Recognition + Email OTP
- **Blockchain Immutability**: Every vote permanently recorded on Ethereum Sepolia
- **AI Biometrics**: DeepFace with ArcFace model for face verification
- **Public Verifiability**: Anyone can verify results on-chain
- **Short-Lived Tokens**: Face verification (5min), Vote authorization (2min)

### Multi-Election Architecture
- **Factory Pattern**: ElectionFactory deploys individual Election contracts
- **Independent Elections**: Each election has its own smart contract
- **Per-Election Voter Data**: Wallet address, face photo, voting status per election
- **Flexible Participation**: One user can vote in multiple elections

### Admin Features
- Create unlimited elections
- Deploy smart contracts automatically
- Add/remove candidates with party symbols
- Approve voters for specific elections
- Upload voter face photos to Cloudinary
- Register voters on blockchain
- Control election phases (Registration → Voting → Completed)
- View live results with winner announcement

### Voter Features
- Register once, participate in multiple elections
- Dashboard showing all available elections
- 5-step voting process with real-time feedback
- View results with bar charts and rankings
- Transaction verification on Etherscan

---

## 🏗️ Architecture

```
React (Client)
    ↓
Express (Server) ──→ MongoDB Atlas
    ↓                    ↓
    ├──→ Python Flask (DeepFace)
    ├──→ Cloudinary (Face Photos)
    ├──→ Nodemailer (OTP)
    └──→ Ethereum Sepolia (Alchemy)
            ↓
        ElectionFactory
            ↓
        Election Contracts
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- Python 3.10+
- MetaMask browser extension
- MongoDB (local or Atlas)
- Alchemy account (Sepolia RPC)
- Cloudinary account
- Gmail account (for OTP)

### Installation

See [QUICK_START.md](./QUICK_START.md) for detailed setup instructions.

**Quick Commands:**
```bash
# Install dependencies
cd server && npm install
cd ../client && npm install
cd ../python-service && pip install -r requirements.txt

# Configure environment variables
# Edit server/.env, client/.env, python-service/.env

# Seed admin account
cd server && node scripts/seedAdmin.js

# Start services (3 terminals)
cd python-service && python app.py
cd server && npm run dev
cd client && npm run dev
```

Open: http://localhost:5173

---

## 📚 Documentation

- **[QUICK_START.md](./QUICK_START.md)** - Get started in minutes
- **[SYSTEM_STATUS.md](./SYSTEM_STATUS.md)** - Complete system overview
- **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** - Production deployment
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture
- **[API.md](./API.md)** - API documentation
- **[SESSION_SUMMARY.md](./SESSION_SUMMARY.md)** - Development summary

---

## 🗳️ How It Works

### Admin Workflow
1. **Login** → Toggle to Admin Login at `/login`
2. **Create Election** → Deploy smart contract via factory
3. **Add Candidates** → Upload party symbols to Cloudinary
4. **Manage Voters** → Approve, upload face photos, register on blockchain
5. **Start Voting** → Change phase to "Voting"
6. **Monitor Results** → View live vote counts
7. **Close Election** → Change phase to "Completed"

### Voter Workflow
1. **Register** → Create account with personal details
2. **Wait for Approval** → Admin approves for specific election
3. **Login** → Access voter dashboard
4. **Vote** → 5-step process:
   - **Step 1**: Connect MetaMask wallet
   - **Step 2**: Face verification via webcam
   - **Step 3**: OTP verification via email
   - **Step 4**: Select candidate and cast vote
   - **Step 5**: View transaction confirmation
5. **View Results** → See live results and winner

---

## 🔐 Security Features

### Authentication
- JWT tokens with 7-day expiry
- Bcrypt password hashing (10 rounds)
- Role-based access control (voter/admin/superadmin)

### Voting Security
- 3-factor authentication required
- Face verification token: 5 minutes
- Vote authorization token: 2 minutes
- One vote per wallet per election
- Blockchain immutability

### Data Protection
- Passwords never stored in plain text
- Face photos stored securely on Cloudinary
- No face encodings stored on disk
- Rate limiting on OTP endpoints
- CORS protection

---

## 📊 Technology Stack

### Backend
- Node.js + Express.js
- MongoDB + Mongoose
- JWT for authentication
- Ethers.js for blockchain
- Cloudinary SDK
- Nodemailer

### Frontend
- React 18
- React Router v6
- Axios
- Ethers.js
- React Toastify
- React Webcam
- Tailwind CSS

### Blockchain
- Solidity smart contracts
- Hardhat
- Sepolia testnet
- Alchemy RPC

### Python Service
- Flask
- DeepFace
- TensorFlow
- RetinaFace

---

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register voter
- `POST /api/auth/login` - Voter login
- `POST /api/auth/admin/login` - Admin login
- `GET /api/auth/me` - Get current user

### Elections (Admin)
- `POST /api/admin/elections` - Create election
- `GET /api/admin/elections` - List all elections
- `PATCH /api/admin/elections/:id/phase` - Change phase

### Candidates (Admin)
- `POST /api/admin/elections/:id/candidates` - Add candidate
- `GET /api/admin/elections/:id/candidates` - List candidates
- `DELETE /api/admin/elections/:id/candidates/:candidateId` - Remove

### Voters (Admin)
- `GET /api/admin/elections/:id/voters` - List voters
- `POST /api/admin/elections/:id/voters/:userId/face` - Upload face
- `POST /api/admin/elections/:id/voters/:userId/register-onchain` - Register

### Voting (Voter)
- `POST /api/face/verify` - Verify face
- `POST /api/otp/send` - Send OTP
- `POST /api/otp/verify` - Verify OTP
- `POST /api/votes/record` - Record vote
- `GET /api/votes/results/:electionId` - Get results

See [API.md](./API.md) for complete documentation.

---

## 🧪 Testing

### Manual Testing Checklist
- [ ] Admin can create election
- [ ] Admin can add candidates
- [ ] Admin can approve voters
- [ ] Voter can complete face verification
- [ ] Voter can receive OTP
- [ ] Voter can cast vote
- [ ] Results display correctly

See [SYSTEM_STATUS.md](./SYSTEM_STATUS.md) for complete testing checklist.

---

## 🚀 Deployment

See [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) for production deployment guide.

**Quick Deploy:**
1. Configure production environment variables
2. Build client: `npm run build`
3. Deploy smart contracts to mainnet
4. Set up PM2 for process management
5. Configure Nginx reverse proxy
6. Set up SSL with Let's Encrypt
7. Configure monitoring and backups

---

## 🐛 Troubleshooting

### Common Issues

**"No routes matched location /admin/login"**
- Admin login is on the same page as voter login at `/login`
- Use the toggle button to switch to Admin Login

**Face verification fails**
- Ensure Python service is running on port 8000
- Check face photo was uploaded by admin
- Ensure good lighting for webcam capture

**OTP not received**
- Check email configuration in server/.env
- Verify EMAIL_PASS is an App Password
- Check spam folder

See [SYSTEM_STATUS.md](./SYSTEM_STATUS.md) for complete troubleshooting guide.

---

## 📝 Project Structure

```
evoteface/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── context/     # React contexts
│   │   ├── pages/       # Page components
│   │   └── utils/       # Utilities
│   └── ...
├── server/              # Express backend
│   ├── config/          # Database config
│   ├── middleware/      # Auth, upload, etc.
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── scripts/         # Utility scripts
│   └── utils/           # Blockchain, email, etc.
├── blockchain/          # Smart contracts
│   ├── contracts/       # Solidity files
│   ├── scripts/         # Deploy scripts
│   └── test/            # Contract tests
├── python-service/      # Face verification
│   ├── app.py           # Flask API
│   └── requirements.txt
└── docs/                # Documentation
```

---

## 🎓 Academic Context

This project demonstrates:
- Blockchain-based voting systems
- Multi-factor authentication
- Biometric verification
- Smart contract design patterns
- Full-stack web development
- Cloud service integration

---

## 📄 License

This project is for educational purposes.

---

## 🤝 Contributing

This is an academic project. For issues or suggestions, please open an issue.

---

## 📞 Support

- Check [SYSTEM_STATUS.md](./SYSTEM_STATUS.md) for system overview
- Check [QUICK_START.md](./QUICK_START.md) for setup help
- Check troubleshooting section for common issues

---

**Status: Production Ready** ✅  
**Version: 2.0**  
**Last Updated: April 14, 2026**