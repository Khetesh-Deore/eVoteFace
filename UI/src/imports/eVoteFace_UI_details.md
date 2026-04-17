

\---



\# 📋 \*\*eVoteFace Frontend Complete Specification\*\*



This document provides all frontend details for Lovable AI to rebuild the complete UI with the best design and functionality.



\---



\## \*\*📱 VOTER PAGES (Voter User Journey)\*\*



\### \*\*1. HOME PAGE (`/`)\*\*



\*\*📍 What It Displays:\*\*

\- \*\*Hero Section:\*\*

&#x20; - Large branding "eVoteFace" with accent color

&#x20; - Tagline: "Decentralized Online Voting System"

&#x20; - Subheading: Description of face recognition + blockchain + MFA

&#x20; - Live stats badge: Total votes cast, candidates count, current election phase

&#x20; - CTA buttons: "Register to Vote", "Voter Login", "View Results" (or "Go to Dashboard" if logged in)



\- \*\*Three-Factor Authentication Section:\*\*

&#x20; - 3 cards showing security layers:

&#x20;   1. 🦊 Connect MetaMask (blockchain identity)

&#x20;   2. 📷 Face Verification (AI biometrics)

&#x20;   3. 📧 OTP Confirmation (email verification)



\- \*\*Features Section (Why eVoteFace):\*\*

&#x20; - 4 feature cards:

&#x20;   1. ⛓️ Blockchain Immutability

&#x20;   2. 🔒 Triple Authentication

&#x20;   3. 👁️ Public Verifiability

&#x20;   4. 🤖 AI Face Recognition



\- \*\*Call-to-Action Section:\*\*

&#x20; - "Ready to participate?" with Register Now button



\*\*📊 Data Requirements:\*\*

\- API: `GET /votes/results` → stats (totalVotes, candidates count, phase)



\*\*🎬 User Interactions:\*\*

\- Click "Register to Vote" → Navigate to `/register`

\- Click "Voter Login" → Navigate to `/login`

\- Click "View Results" → Navigate to `/results`

\- Click "Go to Dashboard" (if logged in) → Navigate to `/dashboard`



\*\*🧩 Components Used:\*\*

\- Link (React Router)

\- API call with axios



\---



\### \*\*2. VOTER REGISTRATION PAGE (`/register`)\*\*



\*\*📍 What It Displays:\*\*

\- \*\*Header:\*\*

&#x20; - Icon: 🗳️ in a blue circle

&#x20; - Title: "Voter Registration"

&#x20; - Info: "eVoteFace — Secure Digital Voting Platform"

&#x20; - Blue info box: "After registration, your account will be reviewed and approved by the Election Administrator."



\- \*\*Form Sections (Grouped with borders):\*\*

&#x20; 1. \*\*Personal Information:\*\*

&#x20;    - Full Name (text input, required)

&#x20;    - Age (number input, min 18, max 120, required)

&#x20;    - Gender (dropdown: Male, Female, Other, required)

&#x20;    - Contact Number (10-digit, required)

&#x20;    - Email Address (required, for OTP)



&#x20; 2. \*\*Identity Documents:\*\*

&#x20;    - Voter ID Number (e.g., ABC1234567, required)

&#x20;    - Aadhar Number (12-digit, required)



&#x20; 3. \*\*Address:\*\*

&#x20;    - Full Address (required)

&#x20;    - State (dropdown with 28 Indian states, required)

&#x20;    - City (required)

&#x20;    - Pincode (6-digit, required)



&#x20; 4. \*\*Set Password:\*\*

&#x20;    - Password (min 8 chars, required)

&#x20;    - Confirm Password (required, must match)



\- \*\*Submit Button:\*\* "Submit Registration"

\- \*\*Login Link:\*\* "Already registered? Login here"



\*\*📊 Data Requirements:\*\*

\- API: `POST /auth/register` with form data

\- Response: Confirmation message



\*\*🎬 User Interactions:\*\*

\- Fill form → Click "Submit Registration"

\- Validation: Password confirmation, password length, required fields

\- Success: Toast message + redirect to `/login`

\- Error: Toast error message



\*\*🧩 Components Used:\*\*

\- Form inputs (text, number, email, select)

\- Toast notifications

\- React Router navigate



\---



\### \*\*3. VOTER LOGIN PAGE (`/login`)\*\*



\*\*📍 What It Displays:\*\*

\- \*\*Header:\*\*

&#x20; - Icon: 🗳️

&#x20; - Title: "Voter Login"

&#x20; - Subtitle: "eVoteFace — Secure Digital Voting"



\- \*\*Login Form:\*\*

&#x20; - Voter ID Number (text input, required)

&#x20; - Password (password input, required)

&#x20; - "Login" button



\- \*\*Links:\*\*

&#x20; - "New voter? Register here" (goes to `/register`)

&#x20; - "Election Administrator? Admin Login" (goes to `/admin/login`)



\- \*\*Info Box:\*\*

&#x20; - Icon: 🔒

&#x20; - Title: "Three-Factor Security"

&#x20; - Description: "Your vote is protected by MetaMask wallet + Face Recognition + OTP verification."



\*\*📊 Data Requirements:\*\*

\- API: `POST /auth/login` with { voterID, password }

\- Response: { token, user { fullName, email, voterID, ... } }



\*\*🎬 User Interactions:\*\*

\- Enter credentials → Click "Login"

\- Success: Store JWT token → Toast success → Redirect to `/dashboard`

\- Error: Toast error message



\*\*🧩 Components Used:\*\*

\- Auth context (useAuth hook)

\- Form inputs

\- Local storage for JWT

\- React Router navigate



\---



\### \*\*4. VOTER DASHBOARD (`/dashboard`)\*\*



\*\*📍 What It Displays:\*\*

\- \*\*Header:\*\*

&#x20; - Welcome message: "Welcome, {fullName}"

&#x20; - Voter ID display

&#x20; - Phase indicator badge (Registration/Voting/Completed)



\- \*\*Grid Layout (2 columns on desktop):\*\*



&#x20; 1. \*\*Your Profile Card:\*\*

&#x20;    - Full Name

&#x20;    - Voter ID

&#x20;    - Email

&#x20;    - City

&#x20;    - State

&#x20;    - Wallet address (if saved)

&#x20;    - Each field: label on left, value on right



&#x20; 2. \*\*Voting Status Card:\*\*

&#x20;    - ↻ Refresh button

&#x20;    - Status rows (each with checkmark or warning):

&#x20;      - Account Approved ✓/Pending

&#x20;      - Face Registered ✓/Pending

&#x20;      - Wallet Saved ✓/Pending

&#x20;      - Registered On-Chain ✓/Pending

&#x20;      - MetaMask Connected ✓/Pending

&#x20;    - If voted: "✅ You have successfully cast your vote. Voted on: \[date]"

&#x20;    - If not voted but eligible: "✅ You are eligible to vote!"

&#x20;    - If not eligible: "⏳ Complete all steps above to vote."



&#x20; 3. \*\*MetaMask Wallet Card:\*\*

&#x20;    - MetaMask Connect component (shows wallet address or connect button)

&#x20;    - After connecting:

&#x20;      - Show connected wallet address (full hexadecimal)

&#x20;      - If wallet saved and matches: "✓ Wallet address saved to your account"

&#x20;      - If wallet not saved yet:

&#x20;        - Message: "Save this wallet address to your voter account so the admin can register you on-chain."

&#x20;        - ⚠️ Warning: "This is the admin/deployer wallet. You cannot vote with it. Switch to a different MetaMask account."

&#x20;        - "💾 Save Wallet Address" button

&#x20;      - If wallet doesn't match:

&#x20;        - ⚠️ "Connected wallet is different from your saved wallet."

&#x20;        - "🔄 Update Wallet Address" button

&#x20;      - On-chain registration status: "✓ Registered on Ethereum blockchain" or "⏳ Awaiting admin to register your wallet on-chain. Contact the election administrator."



&#x20; 4. \*\*Cast Your Vote CTA Card:\*\*

&#x20;    - Title: "🗳️ Cast Your Vote"

&#x20;    - Phase message:

&#x20;      - If Voting: "Voting is currently open. Complete all verification steps to cast your vote."

&#x20;      - If Registration: "Voting has not started yet. Please wait for the election to begin."

&#x20;      - If Completed: "The election has ended. Thank you for participating."

&#x20;    - Missing steps list (if can't vote):

&#x20;      - • Account not approved by admin

&#x20;      - • Face not registered — contact admin

&#x20;      - • Wallet address not saved

&#x20;      - • Not registered on-chain — contact admin

&#x20;      - • MetaMask not connected to Sepolia

&#x20;    - If voted: "Vote Already Cast ✓" (disabled button)

&#x20;    - If eligible: "Cast Your Vote →" (enabled button, goes to `/vote`)

&#x20;    - Link: "View Live Results →"



\*\*📊 Data Requirements:\*\*

\- API: `GET /elections/{selectedElectionId}/voters/status` → { voter { isVerified, hasVoted, votedAt, faceRegistered, walletAddress }, onChain { isRegistered } }

\- API: `GET /elections/{selectedElectionId}/votes/results` → { election { phase }, ... }

\- API: `POST /elections/{selectedElectionId}/voters/wallet` → Save wallet address

\- Uses: useAuth (user data), useElection (selectedElectionId, currentElectionDetails), useWallet (address, isConnected, isCorrectNetwork)



\*\*🎬 User Interactions:\*\*

\- Click "↻ Refresh" → Reload status

\- Click "💾 Save Wallet Address" → Save connected MetaMask wallet

\- Click "Cast Your Vote →" → Navigate to `/vote`

\- Click "View Live Results →" → Navigate to `/results`



\*\*🧩 Components Used:\*\*

\- MetaMaskConnect component (custom)

\- PhaseIndicator component (custom)

\- Status badges

\- Context hooks: useAuth, useElection, useWallet



\---



\### \*\*5. VOTING PAGE (`/vote`) — 4-Step Multi-Factor Authentication\*\*



\*\*📍 What It Displays:\*\*



\*\*Election Header Card:\*\*

\- Title: "{currentElectionDetails?.title}" (e.g., "2024 National Election")

\- Description (if available)

\- Lock badge (if voting session in progress): "🔒 Locked"

\- \*\*Election Stats Grid (3 columns):\*\*

&#x20; - Users icon + "Candidates" + count

&#x20; - FileText icon + "Votes Cast" + count

&#x20; - Clock icon + "Time Left" + time remaining



\*\*Warning Banner (if voting started):\*\*

\- ⚠️ Icon + "Voting session in progress"

\- "Do not refresh or close this page. Switching elections will discard your progress."



\*\*Instructions:\*\*

\- "Complete all three verification steps to cast your vote securely."



\*\*Step Indicator (Progress bar):\*\*

\- 4 circles: Wallet → Face → OTP → Vote

\- Completed steps: ✓ with green background

\- Current step: 1, 2, 3, 4 with blue background

\- Future steps: number with gray background

\- Connected by lines (green for completed, gray for not)

\- Step labels: "Wallet", "Face", "OTP", "Vote" (hidden on mobile)



\---



\*\*STEP 0: WALLET VERIFICATION\*\*



\*\*Card Title:\*\* "Step 1 — Wallet Verification"

\*\*Description:\*\* "Connect your MetaMask wallet. It must be registered for this election."



\*\*Content:\*\*

\- MetaMaskConnect component (shows "Connect MetaMask" button or connected address)

\- If connected and on correct network:

&#x20; - "Verify Wallet →" button (blue)



\*\*Interactions:\*\*

\- If not connected: Click component button → Trigger MetaMask connection

\- If connected: Click "Verify Wallet →" → Backend verifies wallet registration

\- Success: Move to Step 1 (Face)

\- Error: Toast error + stay on Step 0



\---



\*\*STEP 1: FACE VERIFICATION\*\*



\*\*Card Title:\*\* "Step 2 — Face Verification"

\*\*Description:\*\* "Position your face clearly in the camera."



\*\*Content:\*\*

\- WebcamCapture component:

&#x20; - Live webcam feed in a box

&#x20; - "Scan Face" button (shows loading state)

\- Error message (if face not matched):

&#x20; - Red box with ✗ icon

&#x20; - "Face not matched (distance: X.XXX). Try again."



\*\*Interactions:\*\*

\- Click "Scan Face" → Captures screenshot from webcam

\- POST to `POST /face/verify` with base64 screenshot

\- Success: Face match confirmed (confidence %) → Move to Step 2 (OTP)

\- Error: Face not matched → Show error message, allow retry



\---



\*\*STEP 2: OTP VERIFICATION\*\*



\*\*Card Title:\*\* "Step 3 — OTP Verification"

\*\*Two States:\*\*



\*\*State A: Before OTP Sent\*\*

\- Message: "An OTP will be sent to your registered email: {email masked, e.g., j\*\*\*@gmail.com}"

\- "Send OTP to Email" button (blue)



\*\*State B: After OTP Sent\*\*

\- Message: "Enter the 6-digit OTP sent to your email."

\- OTPInput component (6 input boxes for digits)

\- "Resend OTP" button (small, underlined)



\*\*Interactions:\*\*

\- Click "Send OTP to Email" → POST `/otp/send` → Toast success → Show State B

\- Enter 6 digits in OTPInput → Automatically verifies

\- POST `/otp/verify` with code → Success: Move to Step 3 (Vote)

\- Error: Toast error, allow retry

\- Click "Resend OTP" → Resend SMS



\---



\*\*STEP 3: CAST YOUR VOTE\*\*



\*\*Card Title:\*\* "Step 4 — Cast Your Vote"

\*\*Description:\*\* "Select a candidate. MetaMask will ask you to confirm the transaction."



\*\*Content:\*\*

\- List of candidates (each in a card):

&#x20; - Party symbol/icon on left (circle with candidate initial if no image)

&#x20; - Candidate name (bold)

&#x20; - Party name (small gray text)

&#x20; - "Vote" button on right (orange, disabled if voting in progress, shows "..." during voting)

\- Footer note (small gray):

&#x20; - "Your vote is anonymous and permanently recorded on the Ethereum blockchain for {electionTitle}."



\*\*Candidate Card Styling:\*\*

\- Border around each card

\- Hover: Border turns blue, background light blue

\- Party symbol: 10x10 px circle, rounded



\*\*Interactions:\*\*

\- Click "Vote" button → Confirmation popup: "Confirm vote for {candidateName}? This cannot be undone."

&#x20; - OK → Proceed

&#x20; - Cancel → Stay on page

\- POST to smart contract via ethers.js (async transaction)

\- Toast: "Submitting transaction to blockchain..."

\- Toast: "Transaction submitted. Waiting for confirmation..."

\- Receipt obtained → POST `/votes/record` with { candidateId, txHash, voteAuthToken, electionId }

\- Success: Move to Step 4 (Success screen)

\- Error: Toast error with specific message

&#x20; - If user rejected: "Transaction rejected by user"

&#x20; - If already voted: "You have already voted in this election. Redirecting..."

&#x20; - If blockchain error: "Blockchain error: {reason}"



\---



\*\*STEP 4: SUCCESS SCREEN\*\*



\*\*Display (centered, large):\*\*

\- 🎉 Emoji (60px)

\- "Vote Cast Successfully!" (large bold)

\- "Your vote has been permanently recorded on the Ethereum blockchain." (gray)

\- "Election: {electionTitle}" (small)

\- Link to Etherscan: "View on Etherscan: 0x1234...abcd" (blue, clickable)

\- "Redirecting to dashboard in 3 seconds..." (small)

\- "Go to Dashboard Now →" button (allows manual redirect)



\*\*Auto-redirect:\*\* After 3 seconds → Navigate to `/dashboard`



\*\*📊 Data Requirements:\*\*

\- API: `GET /elections/{selectedElectionId}/votes/candidates` → candidates array

\- API: `GET /elections/{selectedElectionId}/voters/status` → voter eligibility

\- API: `GET /elections/{selectedElectionId}` → election stats

\- API: `POST /face/verify` → { liveImageBase64 } → { match, confidence, faceVerifiedToken }

\- API: `POST /otp/send` → { faceVerifiedToken }

\- API: `POST /otp/verify` → { code } → { voteAuthToken }

\- Smart contract: `castVote(candidateId)` → returns transaction

\- API: `POST /votes/record` → { candidateId, txHash, voteAuthToken, electionId }

\- Uses: useAuth, useElection, useWallet (signer, address, isConnected, isCorrectNetwork)



\*\*🎬 User Interactions:\*\*

\- Multi-step form with state machine (steps 0-4)

\- Voting locked once started (warning on page unload)

\- All validations and error handling

\- Toast notifications for all states



\*\*🧩 Components Used:\*\*

\- MetaMaskConnect (custom)

\- WebcamCapture (custom, uses react-webcam)

\- OTPInput (custom, 6 digit inputs)

\- React hooks: useState, useEffect

\- Ethers.js for blockchain interaction

\- API calls with axios

\- React Router navigate



\---



\### \*\*6. ELECTION RESULTS PAGE (`/results`)\*\*



\*\*📍 What It Displays:\*\*



\*\*Header Section:\*\*

\- \*\*Title:\*\* "Election Results"

\- \*\*Subtitle:\*\* "{Election Title}"

\- \*\*Description:\*\* (if available)

\- \*\*Election Selector:\*\* Dropdown to switch between elections

\- \*\*"Compare Elections" Button:\*\* (with icon)

\- \*\*Phase Indicator Badge:\*\* (Registration/Voting/Completed)

\- \*\*"Live" Badge:\*\* (if voting phase, pulsing green)

\- \*\*Last Updated:\*\* "Last updated: HH:MM:SS · Auto-refreshes every 10s" (if live)



\*\*Statistics Cards (Grid 4 columns):\*\*

\- \*\*Total Votes Cast:\*\* { totalVotes } (blue)

\- \*\*Registered Voters:\*\* { registeredVoters } (blue)

\- \*\*Voter Turnout:\*\* { turnout.toFixed(1) }% (green)

\- \*\*Votes Remaining:\*\* { votesRemaining } (orange, only if voting ongoing)

&#x20; - OR \*\*Candidates:\*\* { count } (if completed)



\*\*Time Remaining Banner (if voting ongoing):\*\*

\- ⏰ Icon + Blue background

\- "Time remaining: {days}d {hours}h {minutes}m"

\- "Results will be final when voting ends"



\*\*Winner Banner (if completed):\*\*

\- Gradient background (primary to dark blue)

\- White text

\- 🏆 "Election Winner"

\- Large candidate name

\- Party name (light blue text)

\- Vote count (huge, bold)

\- Percentage of votes



\*\*Results Container:\*\*

\- \*\*Title:\*\* "Live Vote Count" (if voting) OR "Final Results" (if completed)

\- \*\*"Export CSV" Button:\*\* (with download icon)

\- \*\*Candidates List:\*\*

&#x20; - Each candidate in a card:

&#x20;   - Party symbol (10x10 circle or image)

&#x20;   - Candidate name (bold)

&#x20;   - Party name (small gray)

&#x20;   - Vote count (right side, large bold)

&#x20;   - Percentage (small gray below)

&#x20;   - Horizontal bar chart:

&#x20;     - Background: light gray

&#x20;     - Fill: Primary color (or orange if winner)

&#x20;     - Width: percentage of max votes

&#x20;     - Smooth animation (0.7s)

&#x20;   - If winner: Border in orange, background light orange, badge "🏆 Winner"



\*\*Footer:\*\*

\- Small gray text: "Results are sourced directly from the Ethereum Sepolia blockchain and cannot be altered."

\- "Contract: 0x1234...abcd"



\---



\*\*COMPARISON MODE:\*\*



\*\*Header:\*\*

\- "Election Comparison"

\- "Back to Single View" button



\*\*Election Selection:\*\*

\- Checkboxes for each election in grid

\- Multi-select to compare



\*\*Comparison Cards:\*\*

\- Grid of 3 columns (responsive)

\- Each card shows:

&#x20; - Election title

&#x20; - Total votes

&#x20; - Candidate count

&#x20; - Winner (if any)



\---



\*\*📊 Data Requirements:\*\*

\- API: `GET /elections/{selectedElectionId}/votes/results` → { totalVotes, results \[], winner, election { phase } }

\- API: `GET /elections/{selectedElectionId}` → stats

\- Auto-refresh every 10 seconds if voting phase

\- Uses: useElection (selectedElectionId, currentElectionDetails, allElections)



\*\*🎬 User Interactions:\*\*

\- Auto-refresh during voting

\- Click "Export CSV" → Download results as CSV

\- Click "Compare Elections" → Toggle comparison mode

\- Select/deselect elections → Load comparison data

\- Live updates every 10 seconds (if voting)



\*\*🧩 Components Used:\*\*

\- ElectionSelector (custom)

\- PhaseIndicator (custom)

\- Lucide React icons

\- Chart/bar visualization

\- CSV export logic



\---



\## \*\*👨‍💼 ADMIN PAGES\*\*



\### \*\*1. ADMIN LOGIN PAGE (`/admin/login`)\*\*



\*\*📍 What It Displays:\*\*

\- \*\*Header:\*\*

&#x20; - 🛡️ Icon in blue circle

&#x20; - "Election Administrator"

&#x20; - "eVoteFace Admin Portal"



\- \*\*Warning Banner:\*\*

&#x20; - Orange background

&#x20; - "⚠️ Restricted access. Authorised personnel only."



\- \*\*Login Form:\*\*

&#x20; - Admin Email (text, required)

&#x20; - Password (password, required)

&#x20; - "Login to Admin Panel" button (orange)



\- \*\*Links:\*\*

&#x20; - "Voter? Go to Voter Login"



\*\*📊 Data Requirements:\*\*

\- API: `POST /auth/admin/login` → { token, admin { fullName, email, role } }



\*\*🎬 User Interactions:\*\*

\- Enter credentials → Click Login

\- Success: Store admin JWT → Redirect to `/admin/dashboard`

\- Error: Toast error



\---



\### \*\*2. ADMIN DASHBOARD (`/admin/dashboard`)\*\*



\*\*📍 What It Displays:\*\*



\*\*Header:\*\*

\- "Admin Dashboard"

\- Election title (if selected)

\- \*\*Election Selector:\*\* Dropdown

\- \*\*Phase Indicator:\*\* Current phase badge

\- \*\*Phase Change Button:\*\*

&#x20; - "▶ Start Voting" (if registration)

&#x20; - "⏹ Close Election" (if voting)

\- \*\*Refresh Button:\*\* ↻



\*\*Election Info Card (Gradient blue):\*\*

\- Election title (large)

\- Description

\- \*\*Contract Address Section:\*\*

&#x20; - Label: "Contract Address"

&#x20; - Address with copy icon + Etherscan link

&#x20; - Created date



\*\*Statistics Cards Grid (2-3 columns):\*\*

\- \*\*Total Voters:\*\* (count) "Registered in database"

\- \*\*Verified Voters:\*\* (count) "Approved by admin"

\- \*\*On-Chain Voters:\*\* (count) "Registered on blockchain"

\- \*\*Candidates:\*\* (count) "Total candidates"

\- \*\*Votes Cast:\*\* (count) "On blockchain"

\- \*\*Voted:\*\* (count) "Recorded in database"



\*\*Voter Turnout Card (Gradient green):\*\*

\- "Voter Turnout"

\- "{votes} out of {voters} registered voters have voted"

\- Percentage (huge, bold, green)

\- Progress bar below



\*\*Data Synchronization Card:\*\*

\- \*\*Off-Chain (Database) - MongoDB:\*\*

&#x20; - Total Users: {count}

&#x20; - Verified: {count}

&#x20; - Voted (DB): {count}



\- \*\*On-Chain (Blockchain) - Ethereum:\*\*

&#x20; - Registered Voters: {count}

&#x20; - Candidates: {count}

&#x20; - Votes Cast: {count}



\*\*Election Workflow Guide:\*\*

\- 3 columns for each phase:

&#x20; - \*\*Registration:\*\*

&#x20;   - • Add candidates

&#x20;   - • Register voters

&#x20;   - • Upload faces

&#x20;   - • Register wallets on-chain

&#x20; - \*\*Voting:\*\*

&#x20;   - • Voters cast votes

&#x20;   - • Monitor live results

&#x20;   - • All 3-factor auth required

&#x20; - \*\*Completed:\*\*

&#x20;   - • Results are final

&#x20;   - • Winner declared

&#x20;   - • Export data



\*\*Quick Actions Grid:\*\*

\- \*\*Manage Voters:\*\* 👥 "Approve, register on-chain, upload face"

\- \*\*Manage Candidates:\*\* 🏛️ "Add or remove election candidates"

\- \*\*Face Registration:\*\* 📷 "Upload voter face photos"

\- \*\*Election Control:\*\* ⚙️ "Change election phase"

\- \*\*View Results:\*\* 📊 "Live vote counts from blockchain"



\---



\### \*\*3. ELECTIONS MANAGEMENT PAGE (`/admin/elections`)\*\*



\*\*📍 What It Displays:\*\*



\*\*Header:\*\*

\- "Elections Management"

\- \*\*Create New Election Button:\*\* (+ icon)

\- \*\*Search bar:\*\* "Search by title, description..."

\- \*\*Filters:\*\* 

&#x20; - Phase filter: All, Registration, Voting, Completed

&#x20; - Status filter: All, Active, Inactive

\- \*\*Sort options:\*\* Created date, Phase, Status

\- \*\*Elections count badge\*\*



\*\*Statistics Cards:\*\*

\- Total Elections

\- In Registration

\- In Voting

\- Completed

\- Active



\*\*Elections List/Grid:\*\*

\- \*\*Card for each election:\*\*

&#x20; - Title (large, bold)

&#x20; - Description (truncated)

&#x20; - Phase badge: (blue/orange/green)

&#x20; - Status badge: Active/Inactive

&#x20; - Stats: { voters, candidates, votes }

&#x20; - Created date

&#x20; - \*\*Action buttons:\*\*

&#x20;   - 👁️ View

&#x20;   - ✏️ Edit

&#x20;   - 📊 View Results

&#x20;   - ⚙️ Manage

&#x20;   - 🗑️ Delete



\*\*Pagination:\*\* "Page 1 of 5" with next/prev buttons



\---



\### \*\*4. MANAGE VOTERS PAGE (`/admin/voters`)\*\*



\*\*📍 What It Displays:\*\*



\*\*Header:\*\*

\- "Voter Management"

\- \*\*Refresh button:\*\* ↻

\- \*\*Badge:\*\* "{total} total voters"

\- \*\*Search/Filter bar:\*\* "Search by name, voter ID or email..."



\*\*Voters Table:\*\*

\- \*\*Columns:\*\*

&#x20; - Name

&#x20; - Voter ID

&#x20; - Email

&#x20; - Phone

&#x20; - Status (Pending/Approved/On-Chain Registered)

&#x20; - Face Registered (✓ or ✗)

&#x20; - Wallet Saved (✓ or ✗)

&#x20; - \*\*Actions:\*\*

&#x20;   - ✓ Approve voter (if not approved)

&#x20;   - 🔗 Register on-chain (if approved but not on-chain)

&#x20;   - 📷 Upload face

&#x20;   - 🗑️ Delete voter



\*\*Pagination:\*\* Show rows 1-15 of 200, with page selector



\---



\### \*\*5. MANAGE CANDIDATES PAGE (`/admin/candidates`)\*\*



\*\*📍 What It Displays:\*\*



\*\*Header:\*\*

\- "Candidate Management"

\- Election title (selected)

\- \*\*Refresh button\*\*



\*\*Add Candidate Form (Expandable):\*\*

\- Candidate Name (text, required)

\- Party Name (text, required)

\- Party Symbol (URL, optional)

\- \*\*Add Candidate button\*\* (orange)



\*\*Candidates Table:\*\*

\- \*\*Columns:\*\*

&#x20; - Candidate Name

&#x20; - Party Name

&#x20; - Party Symbol (image preview)

&#x20; - Vote Count (from blockchain)

&#x20; - On-Chain Status

&#x20; - \*\*Actions:\*\*

&#x20;   - 🗑️ Delete candidate (with confirmation)



\*\*Info:\*\* "Phase: Registration — You can add/remove candidates. Voting: Candidates are locked."



\---



\### \*\*6. FACE REGISTRATION PAGE (`/admin/face`)\*\*



\*\*📍 What It Displays:\*\*



\*\*Header:\*\*

\- "Face Registration"



\*\*Voter Selection:\*\*

\- \*\*Label:\*\* "Select Voter \*"

\- \*\*Dropdown:\*\* List of voters with "✓ Face registered" status shown

\- Selected voter: "{fullName} ({voterID})"



\*\*Mode Toggle:\*\*

\- Two buttons: "📁 From File" and "📷 Webcam"



\*\*Mode A: Upload from File\*\*

\- \*\*File input:\*\* "Choose image file..."

\- \*\*File preview:\*\* Shows selected image

\- \*\*Upload button:\*\* "Register Face"



\*\*Mode B: Webcam Capture\*\*

\- \*\*Live webcam feed\*\*

\- \*\*Capture button:\*\* "📸 Capture Image"

\- \*\*Captured preview\*\*

\- \*\*Upload button:\*\* "Register Face"

\- \*\*Info:\*\* "Ensure good lighting and face clearly visible"



\*\*Upload states:\*\*

\- Uploading: Button disabled, shows "Uploading..."

\- Success: Toast notification, clear preview

\- Error: Toast error + message



\---



\### \*\*7. ELECTION CONTROL PAGE (`/admin/election`)\*\*



\*\*📍 What It Displays:\*\*



\*\*Current Phase Card:\*\*

\- Phase indicator badge (large)

\- \*\*Phase-specific info:\*\*



\*\*REGISTRATION PHASE:\*\*

\- Description: "Add candidates and register voter wallets on-chain. Voting has not started."

\- \*\*Checklist:\*\*

&#x20; - ✓/✗ At least 2 candidates (X added)

&#x20; - ✓/✗ At least 1 voter on-chain (Y registered)

\- \*\*Warning:\*\* "Ensure all candidates are added and voter wallets are registered on-chain."

\- \*\*Action button:\*\* "▶ Start Voting Phase" (orange)



\*\*VOTING PHASE:\*\*

\- Description: "Voting is open. Registered voters can cast votes using 3-factor authentication."

\- \*\*Checklist:\*\*

&#x20; - ✓ Votes cast: Z

\- \*\*Warning:\*\* "Closing the election is PERMANENT. No more votes can be cast after this."

\- \*\*Action button:\*\* "⏹ Close Election" (red danger button)



\*\*COMPLETED PHASE:\*\*

\- Description: "Election is closed. Results are final and publicly verifiable on the blockchain."

\- No action buttons



\*\*Statistics:\*\*

\- Total voters on-chain

\- Total candidates

\- Total votes cast



\---



\### \*\*8. ADMIN RESULTS PAGE (`/admin/results`)\*\*



\*\*📍 What It Displays:\*\*



Same as voter Results page but with:

\- \*\*"Export CSV" button\*\* (with download icon)

\- \*\*"↻ Refresh" button\*\*

\- More frequent auto-refresh (30 seconds instead of 10)



\---



\## \*\*🔗 PAGE FLOW \& NAVIGATION\*\*



\### \*\*Navigation Structure:\*\*



```

HOME (/)

├── Not Logged In:

│   ├── REGISTER (/register) → LOGIN (/login)

│   ├── VOTER LOGIN (/login) → DASHBOARD (/dashboard)

│   └── ADMIN LOGIN (/admin/login) → ADMIN DASHBOARD (/admin/dashboard)

├── Logged In (Voter):

│   ├── DASHBOARD (/dashboard)

│   │   ├── → VOTE (/vote) \[if eligible]

│   │   └── → RESULTS (/results)

│   ├── VOTE (/vote) \[Protected]

│   │   └── → DASHBOARD (after success)

│   └── RESULTS (/results) \[Public]

└── Logged In (Admin):

&#x20;   ├── ADMIN DASHBOARD (/admin/dashboard)

&#x20;   ├── ELECTIONS (/admin/elections)

&#x20;   ├── ADMIN DASHBOARD (/admin/dashboard)

&#x20;   │   ├── → MANAGE VOTERS (/admin/voters)

&#x20;   │   ├── → MANAGE CANDIDATES (/admin/candidates)

&#x20;   │   ├── → FACE REGISTRATION (/admin/face)

&#x20;   │   ├── → ELECTION CONTROL (/admin/election)

&#x20;   │   └── → RESULTS (/admin/results)

&#x20;   └── All Admin pages allow navigation via sidebar/menu

```



\### \*\*User Type Protection:\*\*



\- \*\*Public Routes:\*\* Home, Login, Register, Results, Admin Login

\- \*\*Protected Voter Routes:\*\* Dashboard, Vote

\- \*\*Protected Admin Routes:\*\* Admin Dashboard, Elections, Manage Voters, Manage Candidates, Face Registration, Election Control, Admin Results

\- \*\*Guard Routes:\*\* ProtectedRoute (check JWT), AdminRoute (check isAdmin flag)



\---



\## \*\*📡 API ENDPOINTS SUMMARY\*\*



```javascript

// Auth

POST /auth/register

POST /auth/login

POST /auth/admin/login



// Elections (public)

GET /votes/results

GET /elections/{id}/votes/results

GET /elections/{id}/votes/candidates



// Voter Dashboard

GET /elections/{id}/voters/status

POST /elections/{id}/voters/wallet



// Voting

POST /face/verify

POST /otp/send

POST /otp/verify

POST /votes/record

Smart Contract: castVote(candidateId)



// Admin

POST /elections/{id}/admin/phase

GET /elections/{id}/admin

GET /admin/voters

POST /admin/voters/{id}/approve

POST /admin/voters/{id}/register-onchain

POST /admin/voters/{id}/face



GET /elections/{id}/admin/candidates

POST /elections/{id}/admin/candidates

DELETE /elections/{id}/admin/candidates/{id}



GET /admin/results

```



\---



\## \*\*🎨 DESIGN TOKENS\*\*



\*\*Colors:\*\*

\- Primary: Blue (#2563eb)

\- Accent: Orange (#f97316)

\- Success: Green (#10b981)

\- Danger: Red (#dc2626)

\- Warning: Yellow (#eab308)

\- Muted: Light gray (#f3f4f6)

\- Text: Dark gray (#1f2937)

\- Border: Light gray (#e5e7eb)



\*\*Components Used Across App:\*\*

\- Button variants: primary (blue), accent (orange), outline, danger

\- Cards with borders and shadows

\- Badges for status

\- Tabs for switching views

\- Dropdowns/Select inputs

\- Text inputs, number inputs, email inputs, password inputs

\- Toast notifications (top-right)

\- Spinners/loaders

\- Progress bars

\- Icons from Lucide React

\- Responsive grid layouts



\---



\## \*\*✅ KEY FEATURES TO IMPLEMENT\*\*



1\. ✅ Multi-step voting form with state machine (4 steps)

2\. ✅ MetaMask wallet connection integration

3\. ✅ Webcam capture for face verification

4\. ✅ OTP input component (6 digits)

5\. ✅ Blockchain transaction handling (ethers.js)

6\. ✅ Live election results with auto-refresh

7\. ✅ Election comparison feature

8\. ✅ CSV export functionality

9\. ✅ Admin election management

10\. ✅ Voter eligibility checks

11\. ✅ Voting session lock (warning on page leave)

12\. ✅ JWT authentication with context

13\. ✅ Election selector for multi-election support

14\. ✅ Responsive mobile/tablet/desktop design



\---



