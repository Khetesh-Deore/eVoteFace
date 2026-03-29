# eVoteFace - System Architecture

## Overview

eVoteFace is a secure, decentralized online voting platform that combines face recognition, blockchain technology, and modern web technologies to ensure secure, transparent, and tamper-proof elections.

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  React + Vite + Tailwind CSS                             │   │
│  │  - Voter UI (Login, Register, Vote, Results)            │   │
│  │  - Admin UI (Dashboard, Management, Audit)              │   │
│  │  - Face Capture (React Webcam)                          │   │
│  │  - Real-time Charts (Recharts)                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           ↓ (Axios)                              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Node.js Express Server (Port 5000)                      │   │
│  │  - Authentication Routes                                │   │
│  │  - Voting Routes                                        │   │
│  │  - Admin Routes                                         │   │
│  │  - Rate Limiting & Security Middleware                 │   │
│  │  - CORS & Error Handling                               │   │
│  └──────────────────────────────────────────────────────────┘   │
│         ↓              ↓              ↓              ↓            │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  DATABASE LAYER  │  │   AI SERVICE     │  │  BLOCKCHAIN      │
│                  │  │                  │  │                  │
│  MongoDB Atlas   │  │  Python Flask    │  │  Polygon Mumbai  │
│  - Users         │  │  (Port 5001)     │  │  - Smart Contract│
│  - Candidates    │  │  - Face Encoding │  │  - Vote Records  │
│  - Votes         │  │  - Face Verify   │  │  - Immutable Log │
│  - Elections     │  │  - Anti-Spoofing │  │                  │
│  - Admins        │  │  - Liveness      │  │  Hardhat + ethers│
│                  │  │                  │  │                  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

---

## Technology Stack

### Frontend
| Technology | Purpose |
|-----------|---------|
| React 18 | UI Framework |
| Vite | Build tool & dev server |
| Tailwind CSS | Styling |
| React Router | Client-side routing |
| Axios | HTTP client |
| React Webcam | Face capture |
| Recharts | Data visualization |

### Backend
| Technology | Purpose |
|-----------|---------|
| Node.js | Runtime |
| Express | Web framework |
| MongoDB | Database |
| Mongoose | ODM |
| JWT | Authentication |
| bcryptjs | Password hashing |
| Morgan | Request logging |
| Helmet | Security headers |
| express-rate-limit | Rate limiting |

### AI Service
| Technology | Purpose |
|-----------|---------|
| Python 3.9+ | Language |
| Flask | Web framework |
| DeepFace | Face recognition |
| OpenCV | Image processing |
| TensorFlow | Deep learning |
| NumPy | Numerical computing |

### Blockchain
| Technology | Purpose |
|-----------|---------|
| Solidity | Smart contract language |
| Hardhat | Development framework |
| ethers.js | Blockchain interaction |
| Polygon Mumbai | Testnet |

### Deployment
| Service | Platform |
|---------|----------|
| Frontend | Vercel |
| Backend | Render |
| AI Service | HuggingFace Spaces |
| Database | MongoDB Atlas |
| Blockchain | Polygon Mumbai |

---

## Core Services

### 1. Authentication Service
**Responsibility:** User registration, login, JWT token management

**Flow:**
```
User Input → Validation → Password Hash (bcrypt) → JWT Token → Response
```

**Endpoints:**
- `POST /api/auth/register` - Register voter
- `POST /api/auth/login` - Login voter
- `POST /api/auth/admin/login` - Admin login
- `GET /api/auth/me` - Get current user

**Security:**
- Passwords hashed with bcrypt (12 salt rounds)
- JWT tokens expire in 1 hour
- Rate limited: 10 requests/minute

---

### 2. Face Recognition Service
**Responsibility:** Face encoding, verification, anti-spoofing

**Flow:**
```
Image (Base64) → Preprocessing → DeepFace Encoding → Cosine Distance → Verification Result
```

**Endpoints:**
- `POST /encode` - Extract face embedding
- `POST /verify` - Compare faces
- `GET /health` - Service status

**Features:**
- Face detection & validation
- Anti-spoofing detection
- Liveness detection
- Confidence scoring (0-1)
- Configurable threshold (default 0.60)

---

### 3. Voting Service
**Responsibility:** Vote casting, results calculation, election management

**Flow:**
```
Voter → Face Verify → Check hasVoted → Record Vote → Update Candidate Count → Blockchain Record → Receipt
```

**Endpoints:**
- `GET /api/vote/candidates` - List candidates
- `POST /api/vote/vote` - Cast vote
- `GET /api/vote/results` - Get results
- `GET /api/vote/results/live` - Live results (admin)
- `POST /api/vote/verify` - Face verification

**Security:**
- One vote per user (hasVoted flag)
- MongoDB transactions for atomicity
- Rate limited: 5 requests/minute
- Face verification required

---

### 4. Admin Service
**Responsibility:** Election management, voter approval, candidate management

**Endpoints:**
- `GET /api/admin/voters` - List voters
- `PATCH /api/admin/voters/:id/approve` - Approve voter
- `DELETE /api/admin/voters/:id/reject` - Reject voter
- `POST /api/admin/candidates` - Add candidate
- `PATCH /api/admin/candidates/:id` - Update candidate
- `DELETE /api/admin/candidates/:id` - Delete candidate
- `POST /api/admin/election/start` - Start election
- `PATCH /api/admin/election/stop` - Stop election
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/audit-log` - Audit log

**Security:**
- Admin-only access (role-based)
- All actions logged
- Audit trail maintained

---

### 5. Blockchain Service
**Responsibility:** Vote recording on-chain, immutability, verification

**Smart Contract Functions:**
```solidity
recordVote(voterHash, candidateId) → txnHash
getVoteCount() → uint256
verifyVote(voterHash) → bool
getVote(index) → Vote
getAllVotes() → Vote[]
```

**Features:**
- Immutable vote records
- Duplicate vote prevention
- Transaction hash storage
- On-chain verification
- Event emission

---

## Data Flow

### Voter Registration Flow
```
1. User fills registration form
2. Captures face image
3. Frontend sends to backend
4. Backend validates input
5. Backend calls AI service to encode face
6. Backend stores user + face encoding in MongoDB
7. User marked as pending approval
8. Admin approves voter
9. Voter can now login
```

### Voting Flow
```
1. Voter logs in
2. Navigates to voting page
3. Selects candidate
4. Captures live face image
5. Frontend sends to backend
6. Backend calls AI service to verify face
7. If verified:
   a. Backend checks hasVoted flag
   b. Records vote in MongoDB
   c. Increments candidate vote count
   d. Calls blockchain service
   e. Records vote on-chain
   f. Stores transaction hash
   g. Returns receipt with txnHash
8. Frontend displays receipt
```

### Results Flow
```
1. Admin stops election
2. Frontend requests results
3. Backend aggregates votes from MongoDB
4. Calculates percentages
5. Returns sorted by vote count
6. Frontend displays charts
```

---

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  voterId: String (unique),
  password: String (hashed),
  faceEncoding: Array<Number>,
  hasVoted: Boolean,
  isApproved: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Candidates Collection
```javascript
{
  _id: ObjectId,
  name: String,
  party: String,
  partySymbol: String,
  voteCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Votes Collection
```javascript
{
  _id: ObjectId,
  voterId: ObjectId (ref: User),
  candidateId: ObjectId (ref: Candidate),
  txnHash: String,
  timestamp: Date,
  createdAt: Date
}
```

### Elections Collection
```javascript
{
  _id: ObjectId,
  title: String,
  status: String (upcoming/active/closed),
  startTime: Date,
  endTime: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Admins Collection
```javascript
{
  _id: ObjectId,
  username: String (unique),
  password: String (hashed),
  role: String (admin/superadmin),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Security Architecture

### Authentication & Authorization
- JWT tokens with 1-hour expiry
- Role-based access control (voter/admin)
- Protected routes with middleware
- Secure password hashing (bcrypt)

### Input Security
- Input validation (Zod schemas)
- Input sanitization (mongo-sanitize, xss-clean)
- SQL/NoSQL injection prevention
- XSS attack prevention

### API Security
- Rate limiting (10/5/100 requests/min)
- CORS configuration
- Helmet security headers
- HTTPS in production

### Data Security
- MongoDB encryption at rest
- JWT tokens in httpOnly cookies
- Face encodings encrypted
- Audit logging

### Blockchain Security
- Immutable vote records
- Duplicate vote prevention
- Owner-only access control
- Event emission for transparency

---

## Deployment Architecture

### Frontend (Vercel)
```
GitHub → Vercel → CDN → Users
- Auto-deploy on push
- Environment variables
- HTTPS enabled
- Global edge network
```

### Backend (Render)
```
GitHub → Render → Container → MongoDB Atlas
- Auto-deploy on push
- Environment variables
- Health checks
- Auto-scaling
```

### AI Service (HuggingFace Spaces)
```
GitHub → HuggingFace Spaces → Docker Container
- Dockerfile-based deployment
- Environment variables
- Auto-restart on failure
```

### Database (MongoDB Atlas)
```
- Free M0 tier (512MB)
- Automatic backups
- IP whitelist
- Connection pooling
```

### Blockchain (Polygon Mumbai)
```
- Testnet RPC: https://rpc-mumbai.maticvigil.com
- Smart contract deployed
- Transaction records immutable
- PolygonScan verification
```

---

## Scalability Considerations

### Horizontal Scaling
- Stateless backend (can run multiple instances)
- Load balancer for traffic distribution
- Database connection pooling
- Cache layer (Redis) for sessions

### Vertical Scaling
- Increase server resources
- Database optimization (indexes)
- Query optimization
- Image compression for face data

### Performance Optimization
- Frontend: Code splitting, lazy loading
- Backend: Database indexing, query optimization
- AI Service: Model caching, batch processing
- Blockchain: Transaction batching

---

## Monitoring & Logging

### Application Logging
- Morgan for HTTP request logging
- Console logs for debugging
- Error tracking (optional: Sentry)

### Health Checks
- Backend: `GET /health`
- AI Service: `GET /health`
- Database: Connection monitoring
- Blockchain: RPC availability

### Metrics
- Request count & latency
- Error rates
- Database query performance
- Face verification accuracy

---

## Disaster Recovery

### Backup Strategy
- MongoDB automated backups
- GitHub version control
- Environment variable backup
- Smart contract ABI backup

### Failover Plan
- Database failover (MongoDB Atlas)
- Backend failover (Render auto-restart)
- AI Service failover (HuggingFace auto-restart)
- Blockchain: Use public RPC nodes

---

## Future Enhancements

1. **Multi-language Support** - i18n implementation
2. **Mobile App** - React Native version
3. **Advanced Analytics** - Detailed election reports
4. **Biometric Options** - Fingerprint, iris scanning
5. **Decentralized Storage** - IPFS for face encodings
6. **DAO Governance** - Decentralized election management
7. **Real-time Notifications** - WebSocket updates
8. **Advanced Reporting** - PDF exports, charts

---

## References

- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [MongoDB Manual](https://docs.mongodb.com/manual)
- [DeepFace GitHub](https://github.com/serengp/deepface)
- [Solidity Docs](https://docs.soliditylang.org)
- [Polygon Documentation](https://polygon.technology/developers)
