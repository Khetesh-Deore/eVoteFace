# eVoteFace — Complete Frontend Specification
> For use with Lovable.dev or any frontend generator

---

## Tech Stack
- React 18 + Vite
- React Router v6
- Tailwind CSS
- Axios (API calls)
- ethers.js v6 (MetaMask / blockchain)
- react-toastify (notifications)
- react-webcam (face capture)

## Base API URL
`http://localhost:5000/api`

## Auth
JWT Bearer token stored in `localStorage` as `evf_token`.  
Attach to every request: `Authorization: Bearer <token>`

---

## Color Palette
| Token | Value |
|-------|-------|
| primary | `#1a1a2e` (dark navy) |
| accent | `#e94560` (red-orange) |
| muted | `#f5f5f5` (light gray bg) |
| dark | `#16213e` |

---

## Route Map

| Path | Page | Access |
|------|------|--------|
| `/` | Home | Public |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/elections` | ElectionsList | Public |
| `/elections/:id` | ElectionDetail | Public |
| `/elections/:id/results` | Results | Public |
| `/dashboard` | Voter Dashboard | Voter only |
| `/elections/:id/vote` | VotingPage | Voter only |
| `/admin/dashboard` | Admin Dashboard | Admin only |
| `/admin/elections` | Admin Elections List | Admin only |
| `/admin/elections/new` | Create Election | Admin only |
| `/admin/elections/:id` | Manage Election | Admin only |

---

## Global Components

### Navbar
**Always visible at top (sticky)**

Content:
- Logo: `eVoteFace` with tagline "Secure Digital Voting"
- Desktop links:
  - Not logged in: `Elections` | `Login` | `Register` (accent button)
  - Voter logged in: `Elections` | `My Dashboard` | `Logout`
  - Admin logged in: `Dashboard` | `Elections` | `Logout`
- Mobile: hamburger menu with same links
- Active link highlighted in accent color

### Footer
**Always visible at bottom**

Content:
- "eVoteFace — Decentralized Voting with Face Recognition & Blockchain"
- "Powered by Ethereum Sepolia · Built on MERN Stack · Academic Project 2025–26"

### Toast Notifications
- Position: top-right
- Auto-close: 5 seconds
- Types: success (green), error (red), info (blue)

---

## Page 1: Home `/`

### Layout
Full-width landing page with 4 sections.

### Section 1 — Hero (dark navy bg, white text)
**Content:**
- Badge: "Powered by Ethereum Sepolia Blockchain" (pulsing dot)
- H1: `eVoteFace` (e in accent color)
- Subtitle: "Decentralized Online Voting System"
- Description: "Secure, transparent, and tamper-proof elections using Face Recognition, Blockchain Technology, and Multi-Factor Authentication."

**Buttons (conditional):**
- If NOT logged in: `Register to Vote` (accent) + `Voter Login` (ghost) + `Browse Elections` (ghost)
- If logged in as voter: `Go to Dashboard →` (accent) + `Browse Elections` (ghost)

**API:** None

### Section 2 — How It Works (white bg)
**Content:**
- H2: "Three-Factor Authentication"
- 3 cards in a row:
  1. 🦊 Connect MetaMask — "Your Ethereum wallet is your unique blockchain identity"
  2. 📷 Face Verification — "Your live webcam image is matched against your registered face using AI biometrics"
  3. 📧 OTP Confirmation — "A one-time password is sent to your registered email for final identity confirmation"
- Each card has step number badge (1, 2, 3)

### Section 3 — Features (muted bg)
**Content:**
- H2: "Why eVoteFace?"
- Subtitle: "Built on IEEE research — ISE-Voting (April 2025)"
- 2x2 grid of feature cards:
  1. ⛓️ Blockchain Immutability
  2. 🔒 Triple Authentication
  3. 👁️ Public Verifiability
  4. 🤖 AI Face Recognition

### Section 4 — CTA (dark navy bg)
**Content:**
- H2: "Ready to participate?"
- Buttons: `Register Now` (if not logged in) + `Browse Elections`

**Navigation from this page:**
- Register → `/register`
- Login → `/login`
- Browse Elections → `/elections`
- Dashboard → `/dashboard`

---

## Page 2: Login `/login`

### Layout
Centered card, max-width 448px

### Content
- Icon (🗳️ voter / 👨‍💼 admin)
- H1: "Voter Login" or "Admin Login"
- Subtitle: "eVoteFace — Secure Digital Voting"

**Toggle Tabs:**
- `Voter Login` | `Admin Login` (pill toggle, active = primary bg)

**Voter Login Form:**
- Voter ID (text input)
- Password (password input)
- Submit button: "Login"

**Admin Login Form:**
- Email (email input)
- Password (password input)
- Submit button: "Login"

**Below form (voter only):**
- "New voter? Register here" → `/register`

**Info box:**
- Voter: "🔒 Three-Factor Security — Your vote is protected by MetaMask wallet + Face Recognition + OTP verification"
- Admin: "🔒 Admin Access — Manage elections, candidates, and voters with full administrative control"

**API Calls:**
- Voter: `POST /auth/login` with `{ voterID, password }`
- Admin: `POST /auth/admin/login` with `{ email, password }`

**On success:**
- Voter → `/dashboard`
- Admin → `/admin/dashboard`

**Validation:**
- All fields required
- Show toast on error

---

## Page 3: Register `/register`

### Layout
Centered card, max-width 672px, scrollable

### Content
- Icon 🗳️
- H1: "Voter Registration"
- Info banner: "After registration, your account will be reviewed and approved by the Election Administrator."

**Form sections (4 sections with dividers):**

**Section 1 — Personal Information:**
- Full Name (full width)
- Age (number, min 18)
- Gender (select: Male/Female/Other)
- Contact Number (10 digits)
- Email Address (email, note: "OTP will be sent here")

**Section 2 — Identity Documents:**
- Voter ID Number
- Aadhar Number (12 digits)

**Section 3 — Address:**
- Full Address (full width)
- State (dropdown, all 32 Indian states/UTs)
- City
- Pincode (6 digits)

**Section 4 — Set Password:**
- Password (min 8 chars)
- Confirm Password

**Submit button:** "Submit Registration"

**Below form:** "Already registered? Login here" → `/login`

**API Call:** `POST /auth/register`

**Validation (client-side):**
- Passwords match
- Password min 8 chars
- Contact: exactly 10 digits
- Aadhar: exactly 12 digits
- Pincode: exactly 6 digits
- Age: min 18

**On success:** Toast "Registration submitted! Please wait for admin approval." → navigate to `/login`

---

## Page 4: Elections List `/elections`

### Layout
Full container, filter tabs + grid

### Content

**Header:**
- H1: "Public Elections"
- Subtitle: "Browse all active and upcoming elections"

**Filter Tabs (horizontal scroll):**
- All Elections (count)
- Active Voting (count)
- Registration (count)
- Upcoming (count)

**If voter logged in — Registration Status per card:**
- Badge: "✓ Registered" (green) / "⏳ Pending Approval" (yellow) / "Not Registered" (gray)

**Election Cards (3-column grid):**
Each card shows:
- Title + Phase badge (registration=blue, voting=green, completed=gray)
- Registration status badge (if logged in)
- Description (2 lines truncated)
- Start date / End date
- Voter count + Candidate count
- Live indicator (pulsing dot) if voting phase
- Upcoming indicator if future

**If NOT registered (voter logged in):**
- Wallet address input: "Your wallet address (0x...)"
- Info box: "📝 Registration Required — Enter your MetaMask wallet address below"
- Button: "✓ Request Registration" (green, disabled if no wallet entered)

**Always:**
- Button: "View Details →" (blue)

**Info Box (bottom):**
Step-by-step guide:
1. Install MetaMask
2. Copy wallet address from MetaMask
3. Enter wallet address when requesting registration
4. Wait for admin approval and blockchain registration
5. Vote during voting phase using 3-factor authentication
- Tip: "You can use different wallet addresses for different elections"

**API Calls:**
- `GET /elections` — load all elections
- `GET /voters/elections` — load voter's registration status (if logged in)
- `POST /voters/elections/:id/request-registration` — request registration with wallet

**Navigation:**
- Card "View Details →" → `/elections/:id`

---

## Page 5: Election Detail `/elections/:id`

### Layout
Single column, max container

**Back button:** "← Back to Elections" → `/elections`

### Section 1 — Election Header (white card)
- H1: Election title
- Description
- Phase badge (top right)
- Grid: Start Date | End Date | Registered Voters

**Voter Status Section (if logged in):**

**Case A — Has voted:**
- Green box: "✓ You have voted in this election" + voted date

**Case B — Can vote (all requirements met):**
- Green button: "Go Vote Now" → `/elections/:id/vote`

**Case C — Registered but requirements incomplete:**
- Yellow box: "Registration Status"
- Checklist:
  - ○/✓ Admin Approval
  - ○/✓ Wallet Connected
  - ○/✓ Face Photo Registered
  - ○/✓ Blockchain Registration
- If completed phase: "This election has ended."

**Case D — Not registered:**
- Blue box: "Not Registered"
- Wallet address input with instructions:
  - "💡 Open MetaMask → Click account name → Copy address"
  - "⚠️ Do NOT use admin wallet: 0x5b97...f103"
  - "✓ You can use different wallets for different elections"
- Button: "Request Registration" (disabled if no wallet)

**If not logged in:**
- Gray box: "Login or Register to participate in this election"

**API Calls:**
- `GET /elections/:id` — election + candidates
- `GET /voters/elections/:id/status` — voter status (if logged in)
- `GET /votes/results/:id` — results (if voting or completed phase)
- `POST /voters/elections/:id/request-registration` — request registration

### Section 2 — Candidates (white card)
- H2: "Candidates"
- 3-column grid of candidate cards:
  - Party symbol image (64x64)
  - Candidate name
  - Party name
  - If results available: vote count + progress bar + percentage

### Section 3 — Results (white card, only if voting/completed)
- H2: "Final Results" or "Live Results" (with pulsing dot if live)
- Winner box (gold gradient, only if completed):
  - 🏆 Winner
  - Name + Party
  - Vote count
- Stats grid: Total Votes Cast | Total Candidates | Registered Voters

---

## Page 6: Results `/elections/:id/results`

### Layout
Same as Election Detail results section but standalone page

**Content:**
- Back button → `/elections/:id`
- Election title + phase badge
- Winner announcement (if completed)
- Candidate results table with vote counts and percentages
- Stats: Total votes, turnout percentage

**API Call:** `GET /votes/results/:id`

---

## Page 7: Voter Dashboard `/dashboard`

### Layout
Container with stats + elections list

### Header
- H1: "Voter Dashboard"
- "Welcome back, [fullName]"

### Stats Row (4 cards)
1. Total Elections (blue icon)
2. Active Elections — voting phase count (green icon)
3. Votes Cast — hasVoted count (purple icon)
4. Pending — not verified count (yellow icon)

### My Elections List (white card)
**Header:** "My Elections"

**If empty:**
- Empty state with icon
- "You haven't been registered for any elections yet."
- Button: "Browse Elections" → `/elections`

**Each election row:**
- Title + Phase badge + Status badge
- Description
- Date range
- Voted date (if voted)

**Status badges:**
- ✓ Voted (green)
- 🏁 Completed (gray)
- ⏳ Pending Approval (yellow)
- 🦊 Connect Wallet (blue)
- 📷 Face Required (purple)
- ⛓️ Pending On-Chain (orange)
- 🗳️ Ready to Vote (green)

**Action buttons (right side):**
- "Vote Now" (green) — if all requirements met and voting phase
- "View Details" (border) — always
- "View Results" (blue border) — if completed

**Voting Requirements Checklist** (shown during voting phase if not voted):
- ○/✓ Admin Approval
- ○/✓ Wallet Connected
- ○/✓ Face Registered
- ○/✓ On-Chain Registered

**Bottom link:** "Browse All Elections" → `/elections`

**API Call:** `GET /voters/elections`

---

## Page 8: Voting Page `/elections/:id/vote`

### Layout
Max-width 896px, centered

### Header
- H1: "Cast Your Vote"
- Election title

### Progress Steps Bar
5 steps with icons and connecting lines:
1. 🦊 Wallet
2. 📷 Face
3. 📧 OTP
4. 🗳️ Vote
5. ✓ Success

Active step = blue filled circle. Completed = blue with ✓.

---

### Step 1: Wallet Verification

**Content:**
- H2: "Step 1: Wallet Verification"
- Info box: "You can use any MetaMask wallet that is registered on the blockchain for this election."

**States:**
- MetaMask not installed → "MetaMask is not installed" + "Install MetaMask" button (orange) → metamask.io
- Not connected → "🦊 Connect MetaMask" button (blue)
- Wrong network → "Wrong network detected" + "Switch to Sepolia" button (red)
- Connected + correct network → Green box: "Wallet connected! Proceeding to face verification..." + connected address

**Auto-advance:** When connected on correct network → move to Step 2

**API:** None (MetaMask only)

---

### Step 2: Face Verification

**Content:**
- H2: "Step 2: Face Verification"
- Subtitle: "Capture your live photo for biometric verification"
- Webcam component (live feed with oval face guide overlay)
- Tips: "💡 Face the camera directly · Ensure good lighting · Remove glasses if possible"

**States:**
- No capture: webcam live + "Capture Photo" button
- Captured: preview image + "Retake Photo" + "Verify Face & Continue" button
- Verifying: "Verifying..." (disabled)

**API Call:** `POST /face/verify` with `{ liveImageBase64, electionId }`
- Timeout: 60 seconds
- On match: store `faceVerifiedToken` → advance to Step 3
- On no match: toast error, reset image

---

### Step 3: OTP Verification

**Content:**
- H2: "Step 3: OTP Verification"
- Subtitle: "Enter the 6-digit code sent to your email"
- "Send OTP" button (blue) — sends OTP to voter email
- Shows: "OTP sent to pr***@gmail.com"
- 6-box OTP input (auto-focus next box, auto-submit on complete)
- "Didn't receive the code? Resend OTP" link

**API Calls:**
- `POST /otp/send` with `{ faceVerifiedToken, electionId }`
- `POST /otp/verify` with `{ code, electionId }`
- On verified: store `voteAuthToken` → advance to Step 4

---

### Step 4: Select Candidate & Vote

**Content:**
- H2: "Step 4: Select Candidate"
- Subtitle: "Choose your candidate and cast your vote"

**Candidate cards (2-column grid):**
- Party symbol image
- Candidate name + party name
- Selected state: blue border + blue bg + ✓ icon

**Warning box (when candidate selected):**
- "⚠️ You are about to vote for: [Name]"
- "This action cannot be undone. Please confirm your selection."

**Button:** "Cast Vote" (green, disabled if no candidate selected)

**On click:**
1. Get election contract via ethers.js
2. Call `contract.castVote(candidateOnChainId)` via MetaMask
3. Toast: "Transaction submitted. Waiting for confirmation..."
4. Wait for receipt
5. `POST /votes/record` with `{ electionId, candidateId, txHash, voteAuthToken }`
6. Advance to Step 5

**Error handling:**
- ACTION_REJECTED → "Transaction rejected by user"
- already voted → "You have already voted"

---

### Step 5: Success

**Content:**
- Large green checkmark circle
- H2: "Vote Cast Successfully!"
- "Your vote has been recorded on the blockchain"
- Transaction hash box (monospace, break-all)
- "View on Etherscan" link → `https://sepolia.etherscan.io/tx/{txHash}`

**Buttons:**
- "View Election Details" → `/elections/:id`
- "Back to Dashboard" → `/dashboard`

---

## Page 9: Admin Dashboard `/admin/dashboard`

### Layout
Container with stats + quick actions

### Header
- H1: "Admin Dashboard"
- "Welcome, [adminName]"

### Stats Row (4 cards)
1. Total Elections
2. Active (voting phase)
3. Total Voters
4. Votes Cast

### Quick Actions
- "Create New Election" button → `/admin/elections/new`
- "Manage Elections" button → `/admin/elections`

### Recent Elections Table
Columns: Title | Phase | Candidates | Voters | Votes | Actions
- "Manage" button → `/admin/elections/:id`

**API Call:** `GET /admin/elections`

---

## Page 10: Admin Elections List `/admin/elections`

### Layout
Container with header + table

### Header
- H1: "Elections Management"
- "Create New Election" button (accent) → `/admin/elections/new`

### Elections Table
Columns: Title | Phase | Candidates | Voters | Votes Cast | Start | End | Actions

**Phase badges:** registration=blue, voting=green, completed=gray

**Actions per row:**
- "Manage" button → `/admin/elections/:id`

**API Call:** `GET /admin/elections`

---

## Page 11: Create Election `/admin/elections/new`

### Layout
Centered card, max-width 672px

### Content
- Back button → `/admin/elections`
- H1: "Create New Election"
- Info box: "Creating an election deploys a new smart contract on Ethereum Sepolia. This requires gas fees."

**Form:**
- Election Title (text, required)
- Description (textarea, required)
- Start Date & Time (datetime-local, required)
- End Date & Time (datetime-local, required)

**Submit button:** "Create Election & Deploy Contract"
- Shows loading: "Deploying contract..."

**API Call:** `POST /admin/elections` with `{ title, description, startTime, endTime }`

**On success:** Toast "Election created and contract deployed!" → navigate to `/admin/elections/:id`

---

## Page 12: Manage Election `/admin/elections/:id`

### Layout
Container with tabs

### Header
- Back button → `/admin/elections`
- H1: Election title
- Description

### Tabs
1. Overview
2. Candidates (count)
3. Voters (count)
4. Results

---

### Tab 1: Overview

**Phase Control card:**
- "Current Phase:" + phase badge
- Warning box (if voting phase): "⚠️ Cannot go back to Registration: The smart contract only allows forward phase transitions. To go back to Registration, there must be zero votes cast."
- 3 buttons:
  - "Set to Registration" (blue, disabled if already registration)
  - "Start Voting" (green, disabled if already voting)
  - "Complete Election" (gray, disabled if already completed)

**Stats cards (3):**
- Total Candidates
- Registered Voters
- Votes Cast

**Contract Information card:**
- Contract Address (monospace)
- Start Time
- End Time

**API Call:** `POST /admin/elections/:id/phase` with `{ phase }`

---

### Tab 2: Candidates

**Add Candidate Form** (only shown in registration phase):
- Candidate Name (required)
- Party Name (required)
- Party Symbol (file upload, image, required)
- "Add Candidate" button

**Candidates List:**
- Party symbol image (64x64)
- Name + Party name + On-chain ID
- "Remove" button (red, only in registration phase)

**API Calls:**
- `GET /admin/elections/:id/candidates`
- `POST /admin/elections/:id/candidates` (multipart/form-data)
- `DELETE /admin/elections/:id/candidates/:candidateId`

---

### Tab 3: Voters

**Phase Warning Banner** (if not registration phase):
- "⚠️ Phase Warning: Election is in [phase] phase. Voter registration on blockchain requires registration phase."
- Link: "Change Phase →"

**Voters Table:**
Columns: Voter | Status | Face Photo | Blockchain | Actions

**Status column:**
- "Approved" (green badge) or "Pending" (yellow badge)

**Face Photo column:**
- "✓ Uploaded" + "View" link (opens modal with photo)
- "Upload" link (opens upload modal)

**Blockchain column:**
- Shows truncated wallet address with copy button 📋
- If on-chain: "✓ On-Chain" (green)
- If approved but not on-chain + registration phase: "Register On-Chain" button (blue)
- If approved but wrong phase: "⚠️ Wrong Phase" (yellow, tooltip: "Change phase to registration first")
- If pending: "Pending Approval" (yellow)
- If no wallet: "No wallet provided" (gray)

**Actions column:**
- "Approve" (green) — if not verified
- "Remove" (red) — if not voted

**Register On-Chain Modal:**
- Auto-uses voter's provided wallet address
- Confirm button

**Face Upload Modal (2 tabs):**
- File Upload tab: file input for image
- Webcam Capture tab:
  - Live webcam feed with oval overlay
  - "📸 Capture Photo" button
  - After capture: "🔄 Retake" + "✓ Upload" buttons

**View Face Photo Modal:**
- Shows full photo
- Cloudinary URL (monospace)
- Close button

**API Calls:**
- `GET /admin/elections/:id/voters`
- `POST /admin/elections/:id/voters/:userId/approve`
- `POST /admin/elections/:id/voters/:userId/register-onchain`
- `POST /admin/elections/:id/voters/:userId/face` (multipart)
- `DELETE /admin/elections/:id/voters/:userId`

---

### Tab 4: Results

**Stats cards (3):**
- Total Votes Cast
- Voter Turnout %
- Total Voters

**Winner card** (gold gradient, only if completed):
- 🏆 Winner
- Name + Party
- Vote count

**Results Table:**
Columns: Rank | Candidate | Party | Votes | Percentage

**API Call:** `GET /admin/elections/:id/results`

---

## Reusable Components

### LoadingSpinner
- Full-page centered spinner
- Used during data loading

### ProtectedRoute
- Wraps voter-only pages
- Redirects to `/login` if not authenticated or not voter role

### AdminRoute
- Wraps admin-only pages
- Redirects to `/login` if not authenticated or not admin role

### PhaseIndicator
- Colored badge for election phase
- registration=blue, voting=green, completed=gray

### CandidateCard
- Party symbol + name + party name
- Optional: vote count + progress bar

### MetaMaskConnect
- Connect button
- Network check (Sepolia)
- Switch network button

### WebcamCapture
- Live webcam feed
- Oval face guide overlay
- Capture / Retake buttons
- Tips text

### OTPInput
- 6 individual digit boxes
- Auto-focus next on input
- Auto-submit on complete
- Backspace support

---

## Context / State Management

### AuthContext
**State:** `user`, `token`, `isAdmin`, `loading`
**Methods:**
- `login(credentials, isAdmin)` — calls API, stores token
- `logout()` — clears token, redirects
- `isAdmin` — boolean derived from user.role

### ElectionContext
**State:** `elections`, `selectedElection`, `loading`, `error`
**Methods:**
- `fetchPublicElections()` → `GET /elections`
- `fetchVoterElections()` → `GET /voters/elections`
- `fetchElectionById(id)` → `GET /elections/:id`
- `fetchElectionResults(id)` → `GET /votes/results/:id`
- `getVoterStatus(id)` → `GET /voters/elections/:id/status`

### WalletContext
**State:** `address`, `isConnected`, `isCorrectNetwork`, `provider`, `signer`
**Methods:**
- `connectWallet()` — MetaMask connect
- `switchToSepolia()` — switch network
- Chain ID for Sepolia: `11155111`

---

## Complete User Flows

### Flow 1: Voter Registration & Voting

```
Home → Register → (wait for admin) → Login → Dashboard
→ Elections → Request Registration (enter wallet) → (wait for admin)
→ Dashboard → Vote Now → VotingPage
  → Step 1: Connect MetaMask
  → Step 2: Face Verification (webcam)
  → Step 3: Send OTP → Enter OTP
  → Step 4: Select Candidate → Cast Vote (MetaMask popup)
  → Step 5: Success → Dashboard
```

### Flow 2: Admin Managing Election

```
Login (admin) → Admin Dashboard → Create Election
→ Manage Election → Candidates tab → Add candidates
→ Voters tab → Approve voters → Upload face photos → Register on-chain
→ Overview tab → Start Voting
→ (voters vote)
→ Overview tab → Complete Election
→ Results tab → View results
```

### Flow 3: Public Viewing Results

```
Home → Browse Elections → Election Detail → View Results
```

---

## API Error Handling

All API calls should:
1. Show toast error with `error.response?.data?.message`
2. Handle 401 → redirect to `/login` (auto via axios interceptor)
3. Handle network errors → "Server unavailable, please try again"
4. Handle timeout (face verification) → "Face verification is taking too long. Ensure Python service is running."

---

## Important Notes for Implementation

1. **Wallet matching removed** — voters can use any MetaMask wallet to vote (not restricted to registered wallet)
2. **Multi-election** — one voter can register in multiple elections with different wallets
3. **Blockchain registration** — must happen during `registration` phase only
4. **Phase transitions** — forward only (registration→voting→completed), backward only if 0 votes
5. **Face verification** — requires Python DeepFace service running on `http://localhost:8000`
6. **OTP expiry** — 5 minutes, rate limited to 3 per 10 minutes
7. **Vote auth token** — expires in 2 minutes after OTP verification
8. **Sepolia ETH** — voters need Sepolia ETH for gas fees when voting
9. **Admin wallet** — `0x5b979D566867F2f5abaEE5d51292E1bd1740f103` cannot be used as voter wallet
