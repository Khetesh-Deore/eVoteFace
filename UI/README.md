# eVoteFace - Decentralized Voting Platform

A secure, blockchain-based voting platform with face recognition and multi-factor authentication.

## Features

- **Three-Factor Authentication**: MetaMask wallet + Face Recognition + OTP verification
- **Blockchain Integration**: Ethereum Sepolia testnet for immutable vote recording
- **Voter & Admin Portals**: Separate interfaces for voters and election administrators
- **Real-time Results**: Live vote counting with auto-refresh
- **Professional UI**: Modern design with animations and responsive layout

## Tech Stack

- **Frontend**: React 18 + Vite + TypeScript
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v4
- **State Management**: Context API
- **Blockchain**: ethers.js v6
- **API Communication**: Axios
- **Face Capture**: react-webcam
- **Notifications**: react-toastify
- **Animations**: Motion (Framer Motion)

## Backend API

The frontend connects to a backend API running at `http://localhost:5000/api`

Make sure your backend server is running before starting the frontend.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── app/
│   ├── components/          # Reusable components
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── MetaMaskConnect.tsx
│   │   ├── WebcamCapture.tsx
│   │   ├── OTPInput.tsx
│   │   └── ...
│   ├── context/            # Context providers
│   │   ├── AuthContext.tsx
│   │   ├── ElectionContext.tsx
│   │   └── WalletContext.tsx
│   ├── pages/              # Page components
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Elections.tsx
│   │   ├── ElectionDetail.tsx
│   │   ├── VoterDashboard.tsx
│   │   ├── VotingPage.tsx
│   │   ├── ElectionResults.tsx
│   │   └── admin/         # Admin pages
│   ├── lib/               # Utilities
│   │   ├── axios.ts
│   │   └── contract-abi.ts
│   ├── App.tsx
│   ├── Root.tsx
│   └── routes.tsx
└── styles/
    └── theme.css
```

## Key Routes

### Public Routes
- `/` - Home page
- `/login` - Voter/Admin login
- `/register` - Voter registration
- `/elections` - Browse all elections
- `/elections/:id` - Election details
- `/elections/:id/results` - Election results

### Voter Routes (Protected)
- `/dashboard` - Voter dashboard
- `/elections/:id/vote` - 4-step voting process

### Admin Routes (Protected)
- `/admin/login` - Admin login
- `/admin/dashboard` - Admin dashboard
- `/admin/elections` - Manage elections
- `/admin/elections/new` - Create new election
- `/admin/elections/:id` - Manage specific election

## Voting Flow

1. **Wallet Verification**: Connect MetaMask wallet to Sepolia network
2. **Face Verification**: Capture live photo for AI biometric matching
3. **OTP Verification**: Enter 6-digit code sent to registered email
4. **Cast Vote**: Select candidate and submit blockchain transaction
5. **Success**: Vote recorded on Ethereum with transaction hash

## Environment Setup

### MetaMask Configuration
- Network: Sepolia Testnet
- Chain ID: 11155111
- Get Sepolia ETH from faucet for gas fees

### Backend Requirements
- MongoDB database
- Ethereum Sepolia RPC endpoint
- Cloudinary for image storage
- DeepFace service for face recognition (Python)
- SMTP service for OTP emails

## Color Scheme

- **Primary**: #1a1a2e (dark navy)
- **Accent**: #e94560 (red-orange)
- **Muted**: #f5f5f5 (light gray)
- **Dark**: #16213e

## Security Features

- JWT authentication with Bearer tokens
- Blockchain-based vote immutability
- Face recognition prevents impersonation
- Email OTP for identity confirmation
- Vote anonymity preserved on-chain

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- MetaMask extension required

## License

Academic Project 2025-26

---

Built with ❤️ using React, Ethereum, and AI
