# eVoteFace Blockchain Code — Explained for Everyone

> This document walks through every blockchain-related file in the project.
> It explains what each file does, what each important line means,
> and why it was written that way — in plain, simple language.
> No coding knowledge required.

---

## The Blockchain Files — Where They Live

```
eVoteFace/
│
├── blockchain/                    ← Everything related to smart contracts
│   ├── contracts/
│   │   ├── Election.sol           ← The voting booth (one per election)
│   │   └── ElectionFactory.sol    ← The factory that builds voting booths
│   ├── scripts/
│   │   ├── deployFactory.js       ← Script to publish the factory to Ethereum
│   │   └── extractABI.js          ← Script to copy contract blueprints to server/client
│   ├── hardhat.config.js          ← Configuration for the blockchain tools
│   └── deployedAddresses.json     ← Record of where contracts were published
│
├── server/
│   └── utils/
│       ├── blockchain.js          ← Server's connection to Ethereum
│       ├── ElectionABI.json       ← Blueprint of Election contract (for server)
│       └── ElectionFactoryABI.json ← Blueprint of Factory contract (for server)
│
└── client/
    └── src/
        └── utils/
            ├── contract.js        ← Browser's connection to Ethereum (via MetaMask)
            ├── ElectionABI.json   ← Blueprint of Election contract (for browser)
            └── ElectionFactoryABI.json ← Blueprint of Factory contract (for browser)
```

---

## What is an ABI? (The Blueprint)

Before diving into the code, you need to understand one concept: **ABI**.

ABI stands for "Application Binary Interface." Think of it as a **menu at a restaurant**.

The menu tells you:
- What dishes are available (what functions the contract has)
- What ingredients each dish needs (what inputs each function takes)
- What you will receive (what each function returns)

The ABI files (`ElectionABI.json`, `ElectionFactoryABI.json`) are menus that tell the server and browser how to talk to the smart contracts. Without the ABI, the code would not know what functions exist or how to call them.

---

## File 1: Election.sol — The Voting Booth

**Location:** `blockchain/contracts/Election.sol`
**Language:** Solidity (a language specifically for Ethereum smart contracts)
**Purpose:** This is the actual voting machine. One copy of this is created for every election.

---

### The Data It Stores

Think of this section as the **filing cabinet** inside the voting booth:

```
Phase — which stage the election is in (Registration / Voting / Completed)

Candidate record:
  - id: a number (1, 2, 3...)
  - name: "Alice Johnson"
  - partyName: "Progressive Party"
  - partySymbol: a web link to the party logo image
  - voteCount: how many votes this candidate has received
  - exists: is this candidate still in the election?

Voter record:
  - walletAddress: the voter's unique Ethereum address
  - isRegistered: has the admin approved this voter?
  - hasVoted: has this voter already cast their vote?
  - votedFor: which candidate did they vote for?
  - votedAt: what time did they vote?
```

The contract also keeps running totals:
- `totalCandidates` — how many candidates are in this election
- `totalRegisteredVoters` — how many voters are approved
- `totalVotesCast` — how many votes have been cast so far

---

### The Security Guards (Modifiers)

The contract has two security guards that check every action:

**Guard 1 — onlyAdmin**
```
"Only the election administrator can do this."
```
This guard is placed on functions like adding candidates and registering voters. If anyone other than the admin tries to call these functions, the contract automatically rejects them with the message: "Election: caller is not admin."

**Guard 2 — onlyDuringPhase**
```
"This action is only allowed during a specific phase."
```
For example, adding candidates is only allowed during Registration phase. If someone tries to add a candidate after voting has started, the contract rejects it with: "Election: action not allowed in current phase."

These guards run automatically — no human needs to check. The contract enforces its own rules.

---

### The Functions (What the Contract Can Do)

#### addCandidate — Adding a Candidate to the Ballot

```
Who can call it: Admin only
When: Registration phase only
What it does:
  1. Checks the candidate name is not empty
  2. Assigns the next available ID number (1, 2, 3...)
  3. Stores the candidate's name, party, and logo link
  4. Sets their vote count to 0
  5. Announces to the blockchain: "CandidateAdded" (this is called an Event)
```

Think of this as the admin **printing a candidate's name on the ballot**.

---

#### removeCandidate — Removing a Candidate

```
Who can call it: Admin only
When: Registration phase only
What it does:
  1. Checks the candidate exists
  2. Marks them as not existing (exists = false)
  3. Removes them from the list
  4. Announces: "CandidateRemoved"
```

Think of this as **crossing out a name on the ballot** before printing begins.

---

#### registerVoter — Adding an Approved Voter

```
Who can call it: Admin only
When: Registration phase only
What it does:
  1. Checks the wallet address is valid (not empty)
  2. Checks this wallet is not already registered
  3. Checks the admin is not trying to register themselves
  4. Creates a voter record: registered=true, hasVoted=false
  5. Announces: "VoterRegistered"
```

Think of this as the admin **adding a name to the official voter roll**.

The restriction "admin cannot register themselves" exists because the admin controls the election — allowing them to also vote would be a conflict of interest.

---

#### changePhase — Moving the Election Forward

```
Who can call it: Admin only
When: Any time
What it does:
  - Registration → Voting: Always allowed (starts the election)
  - Voting → Completed: Always allowed (ends the election)
  - Voting → Registration: ONLY allowed if zero votes have been cast
  - Any other change: Rejected
```

This is like the admin **flipping the switch** from "setup mode" to "voting mode" to "closed."

The special rule about going backward (Voting → Registration) exists so the admin can fix mistakes — but only if nobody has voted yet. Once even one vote is cast, the election cannot be reset.

---

#### castVote — The Actual Vote

```
Who can call it: Any registered voter
When: Voting phase only
What it does:
  1. Checks the caller's wallet is registered
  2. Checks they have not already voted
  3. Checks the chosen candidate exists
  4. Marks the voter as hasVoted=true
  5. Records which candidate they voted for
  6. Adds 1 to that candidate's vote count
  7. Adds 1 to the total votes cast
  8. Announces: "VoteCast" (with voter address, candidate ID, and time)
```

This is the most important function. Notice the three checks at the start — these are the contract's built-in fraud prevention:
- Check 1 prevents unregistered people from voting
- Check 2 prevents double voting
- Check 3 prevents voting for a non-existent candidate

If any check fails, the entire transaction is rejected and nothing changes.

---

#### getWinner — Announcing the Winner

```
Who can call it: Anyone
When: Completed phase only
What it does:
  1. Checks the election is completed
  2. Loops through all candidates
  3. Finds the one with the highest vote count
  4. Returns that candidate's full record
```

This is automatic — no human counts the votes. The contract does the math itself.

---

### Events — The Blockchain's Announcement System

Every important action in the contract fires an **Event**. Think of events as **public announcements** broadcast to the entire blockchain.

| Event | When It Fires | What It Announces |
|-------|--------------|-------------------|
| CandidateAdded | Admin adds a candidate | "Candidate #1 Alice Johnson was added" |
| CandidateRemoved | Admin removes a candidate | "Candidate #1 was removed" |
| VoterRegistered | Admin registers a voter | "Wallet 0x... is now a registered voter" |
| VoteCast | A voter votes | "Wallet 0x... voted for candidate #2 at time X" |
| PhaseChanged | Phase changes | "Election moved from Registration to Voting" |

These events are permanently recorded on the blockchain. Anyone can look them up on Etherscan to see the complete history of an election.

---

## File 2: ElectionFactory.sol — The Factory

**Location:** `blockchain/contracts/ElectionFactory.sol`
**Purpose:** A permanent contract that creates new Election contracts on demand.

---

### What It Stores

```
platformOwner — the wallet that deployed this factory (has highest authority)
deployedElections — a list of all election contract addresses ever created
platformAdmins — a list of wallets that are allowed to create elections
```

---

### The Key Function: createElection

```
Who can call it: Platform admins only
What it does:
  1. Checks the title is not empty
  2. Checks the admin address is valid
  3. Checks start time is before end time
  4. Deploys a brand new Election.sol contract
  5. Saves the new contract's address in the list
  6. Announces: "ElectionCreated" with the new address
  7. Returns the new contract's address
```

When the server calls this function, a completely new, independent Election contract appears on the blockchain. The factory then tells the server the address of this new contract, and the server saves it to the database.

Think of it like a **government office that issues new polling station licenses** — each license (contract address) is unique and identifies one specific election.

---

## File 3: hardhat.config.js — The Toolbox Configuration

**Location:** `blockchain/hardhat.config.js`
**Purpose:** Tells the development tools how to connect to Ethereum.

```javascript
solidity: "0.8.24"
```
This means: "Compile our contracts using Solidity version 0.8.24."

```javascript
networks: {
  localhost: { url: "http://127.0.0.1:8545" }
```
This is a fake local blockchain for testing on your own computer. No real ETH needed.

```javascript
  sepolia: {
    url: process.env.ALCHEMY_SEPOLIA_URL,
    accounts: [process.env.ADMIN_WALLET_PRIVATE_KEY]
  }
```
This is the real Sepolia testnet. The URL comes from Alchemy (our gateway to Ethereum). The private key is the admin's wallet — used to pay for deploying contracts.

---

## File 4: deployFactory.js — Publishing the Factory

**Location:** `blockchain/scripts/deployFactory.js`
**Purpose:** A one-time script that publishes the ElectionFactory contract to Ethereum.

This script is run **once** when setting up the project. Here is what it does step by step:

```
Step 1: Connect to Ethereum using the admin wallet
Step 2: Check the wallet has enough ETH to pay for deployment
Step 3: Compile and deploy the ElectionFactory contract
Step 4: Wait for the transaction to be confirmed on the blockchain
Step 5: Save the factory's address to deployedAddresses.json
Step 6: Print instructions for what to do next
```

After running this script, the factory contract lives permanently on Ethereum at a specific address. That address is then put into the `.env` files so the server and browser know where to find it.

The result is saved in `blockchain/deployedAddresses.json`:
```json
{
  "network": "sepolia",
  "factoryAddress": "0x0493732CE8A223fedbC7FEE3f5780D7c46385eb5",
  "deployerAddress": "0x5b979D566867F2f5abaEE5d51292E1bd1740f103",
  "deployedAt": "2026-04-14T07:21:20.518Z"
}
```

---

## File 5: server/utils/blockchain.js — The Server's Connection

**Location:** `server/utils/blockchain.js`
**Purpose:** This is the bridge between the Node.js server and the Ethereum blockchain.

---

### Setting Up the Connection

```javascript
const provider = new ethers.JsonRpcProvider(process.env.ALCHEMY_SEPOLIA_URL);
```

**What this does:** Creates a connection to the Ethereum network through Alchemy.

Think of `provider` as a **telephone line to the blockchain**. Through this line, the server can read information from the blockchain (like vote counts) without paying any fees.

Alchemy is a company that runs Ethereum nodes (computers that store the blockchain). Instead of running our own node (which would require a powerful computer running 24/7), we use Alchemy's service through a URL.

---

### Setting Up the Admin Wallet

```javascript
const adminWallet = new ethers.Wallet(process.env.ADMIN_WALLET_PRIVATE_KEY, provider);
```

**What this does:** Creates a wallet object using the admin's private key, connected to the blockchain.

Think of this as **loading the admin's digital pen** — ready to sign transactions. When the server needs to add a candidate or register a voter, it uses this wallet to sign and pay for the transaction.

The private key comes from the `.env` file and is never shown to anyone.

---

### The Four Helper Functions

**getFactoryContract()**
```
Returns: The ElectionFactory contract, ready to use with admin signing ability
Used for: Creating new elections
```
Like picking up the phone and calling the factory.

**getElectionContract(address)**
```
Returns: A specific Election contract, ready to use with admin signing ability
Used for: Adding candidates, registering voters, changing phases
```
Like picking up the phone and calling a specific polling station — and having authority to give instructions.

**getElectionContractReadOnly(address)**
```
Returns: A specific Election contract, read-only (no signing)
Used for: Reading vote counts, checking results, verifying voter status
```
Like looking at a polling station's public notice board — you can read everything but cannot change anything. This is free (no gas fee).

**getElectionContractWithSigner(address, privateKey)**
```
Returns: A specific Election contract signed by a specific voter's wallet
Used for: (Available but not currently used — voters sign directly via MetaMask)
```

---

## File 6: client/src/utils/contract.js — The Browser's Connection

**Location:** `client/src/utils/contract.js`
**Purpose:** This is the bridge between the React browser app and the Ethereum blockchain, using MetaMask.

This file is similar to the server's `blockchain.js` but works differently because:
- The server uses the admin's private key (stored securely on the server)
- The browser uses MetaMask (the voter's own wallet in their browser)

---

### getProvider()

```javascript
const getProvider = () => {
  return new ethers.JsonRpcProvider(rpcUrl);
};
```

Creates a read-only connection to Ethereum. Used for reading data (vote counts, candidate lists) without needing MetaMask.

---

### getSigner()

```javascript
const getSigner = async () => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  return await provider.getSigner();
};
```

**What this does:** Asks MetaMask for the voter's signing ability.

`window.ethereum` is MetaMask — it is automatically available in the browser when MetaMask is installed. When this function runs, MetaMask may show a popup asking the voter to confirm they want to connect.

Think of this as **asking the voter to pick up their pen** (MetaMask) so they can sign the vote transaction.

---

### getElectionContract(address) — The Most Important Function

```javascript
export const getElectionContract = async (electionAddress) => {
  const signer = await getSigner();
  return new ethers.Contract(electionAddress, ElectionABI, signer);
};
```

**What this does:** Creates a connection to a specific Election contract, signed by the voter's MetaMask wallet.

When the voter clicks "Cast Vote," the code calls this function to get the contract, then calls `contract.castVote(candidateId)`. This triggers a MetaMask popup asking the voter to confirm and pay the gas fee.

The voter's signature (from MetaMask) proves the vote came from their wallet. Nobody else can sign with their wallet.

---

## How All These Files Work Together — The Complete Picture

Here is the journey of a single vote, showing which file is involved at each step:

```
VOTER CLICKS "CAST VOTE"
        │
        ▼
client/src/utils/contract.js
  getElectionContract(address)
  → Asks MetaMask for voter's signing ability
        │
        ▼
MetaMask popup appears
  "Confirm transaction? Fee: 0.0002 ETH"
  Voter clicks Confirm
        │
        ▼
Election.sol — castVote(candidateId)
  → Checks: is wallet registered? ✓
  → Checks: has wallet voted before? ✗ (first time)
  → Records vote permanently
  → Fires VoteCast event
        │
        ▼
Transaction confirmed on Ethereum
  txHash = "0xabc123..."
        │
        ▼
server/utils/blockchain.js
  provider.getTransactionReceipt(txHash)
  → Server verifies the transaction really happened
  → Verifies it went to the correct contract
  → Verifies the VoteCast event exists
        │
        ▼
MongoDB updated
  user.elections[electionId].hasVoted = true
        │
        ▼
Voter sees success screen with txHash
```

---

## The ABI Files — Why They Exist in Two Places

You will notice the ABI files exist in both:
- `server/utils/ElectionABI.json`
- `client/src/utils/ElectionABI.json`

They are identical copies. The reason they exist in two places:

- The **server** needs the ABI to call contract functions from Node.js (adding candidates, registering voters)
- The **browser** needs the ABI to call contract functions from React (casting votes)

The script `blockchain/scripts/extractABI.js` automatically copies the ABI from the compiled contract artifacts to both locations. This ensures both copies are always in sync with the actual deployed contract.

---

## The deployedAddresses.json File — The Address Book

**Location:** `blockchain/deployedAddresses.json`

```json
{
  "network": "sepolia",
  "factoryAddress": "0x0493732CE8A223fedbC7FEE3f5780D7c46385eb5",
  "deployerAddress": "0x5b979D566867F2f5abaEE5d51292E1bd1740f103",
  "deployedAt": "2026-04-14T07:21:20.518Z",
  "transactionHash": "0x861ef615f3416af370ad8139e789108613bd1b33c6a51e8ad3ecb6c3518ac049"
}
```

This file is the **address book** created when the factory was deployed. It records:
- Which network it was deployed on (Sepolia testnet)
- The factory's permanent address on Ethereum
- Who deployed it (the admin wallet)
- When it was deployed
- The transaction hash (proof of deployment, viewable on Etherscan)

The `factoryAddress` from this file is copied into `server/.env` as `FACTORY_CONTRACT_ADDRESS` so the server always knows where to find the factory.

---

## Summary — What Each File Does in One Line

| File | What It Does |
|------|-------------|
| `Election.sol` | The voting machine — stores candidates, voters, and votes permanently |
| `ElectionFactory.sol` | Creates new voting machines on demand |
| `hardhat.config.js` | Tells development tools how to connect to Ethereum |
| `deployFactory.js` | One-time script to publish the factory to Ethereum |
| `deployedAddresses.json` | Record of where the factory lives on Ethereum |
| `server/utils/blockchain.js` | Server's connection to Ethereum using admin wallet |
| `client/src/utils/contract.js` | Browser's connection to Ethereum using voter's MetaMask |
| `ElectionABI.json` (both copies) | The menu that tells code what functions the contract has |

---

## The Golden Rule of This Codebase

> **The server controls setup. The voter controls their vote.**

- The server (using the admin wallet) handles everything before voting: creating elections, adding candidates, registering voters, changing phases.
- The voter (using their own MetaMask wallet) handles only one thing: casting their vote.

This separation ensures that even the system administrators cannot cast votes on behalf of voters. Every vote is personally signed by the voter's own private key, which only they possess.
