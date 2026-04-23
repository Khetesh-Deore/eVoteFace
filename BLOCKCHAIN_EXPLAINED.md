# How eVoteFace Uses Blockchain — Explained for Everyone

> This document explains the blockchain part of eVoteFace in plain, simple language.
> No technical background needed. Read from top to bottom.

---

## First — What is a Blockchain? (In Simple Words)

Imagine a **notebook** that:
- Is shared with thousands of people around the world
- Once you write something in it, **nobody can erase or change it**
- Everyone can read what's written
- No single person or company controls it

That notebook is a blockchain.

In eVoteFace, every vote is written into this notebook. Once your vote is recorded, **not even the system creators can change it**. This is what makes the voting system trustworthy.

---

## The Blockchain We Use — Ethereum Sepolia

We use **Ethereum** — one of the world's most popular blockchains.

Specifically, we use **Sepolia** — which is a test version of Ethereum. It works exactly like the real Ethereum but uses fake money (test ETH) so we don't spend real money during development and testing.

Think of Sepolia like a **practice ground** — same rules, same security, no real money.

You can see every transaction publicly at:
**https://sepolia.etherscan.io**

---

## What is a Smart Contract? (The Voting Machine)

A **smart contract** is a computer program that lives on the blockchain.

Think of it like a **vending machine**:
- You put in money and press a button
- The machine automatically gives you the item
- No human is involved
- The machine follows its rules exactly, every time

In eVoteFace, the smart contract is the **voting machine**. When a voter casts their vote:
- The contract checks if they are registered
- The contract checks if they have already voted
- If everything is correct, it records the vote permanently
- No human can interfere with this process

---

## Our Two Smart Contracts

### Contract 1 — ElectionFactory (The Factory)

**Address:** `0x0493732CE8A223fedbC7FEE3f5780D7c46385eb5`

Think of this as a **factory that builds voting booths**.

When the admin wants to create a new election, they call this factory. The factory automatically builds a brand new, independent voting booth (a new Election contract) for that election.

This means:
- Presidential Election gets its own voting booth
- Governor Election gets its own voting booth
- Each booth is completely separate and independent

The factory is deployed **once** and never changes.

---

### Contract 2 — Election (The Voting Booth)

One of these is created **for every election**.

This is where the actual voting happens. Think of it as a **sealed ballot box** that:
- Only accepts votes from registered voters
- Counts votes automatically
- Cannot be opened or tampered with
- Announces the winner when the election ends

---

## The Three Phases of an Election

Every election goes through exactly three stages, in order:

```
REGISTRATION  ──────────►  VOTING  ──────────►  COMPLETED
(Setup stage)              (Voting open)         (Election over)
```

### Phase 1 — Registration
- Admin adds candidates to the ballot
- Admin registers approved voters
- No votes can be cast yet
- Think of this as **setting up the polling station**

### Phase 2 — Voting
- Voters can now cast their votes
- No new candidates or voters can be added
- Think of this as **election day**

### Phase 3 — Completed
- Voting is closed
- Winner is announced
- Results are permanently visible to everyone
- Think of this as **counting day and announcement**

**Important rule:** You can only move forward through phases. Once voting starts, you cannot go back to registration (unless zero votes have been cast).

---

## How a Vote Gets Recorded — Step by Step

When a voter clicks "Cast Vote", here is exactly what happens:

### Step 1 — The Voter Signs the Vote
The voter's MetaMask wallet (like a digital pen) signs the vote transaction. This proves the vote came from that specific wallet. Nobody else can sign with your wallet because only you have the private key (like a secret password).

### Step 2 — The Transaction Goes to Ethereum
The signed vote is sent to the Ethereum Sepolia network — thousands of computers around the world receive it.

### Step 3 — The Smart Contract Checks Everything
The Election smart contract automatically checks:
- ✓ Is this wallet registered for this election?
- ✓ Has this wallet already voted?
- ✓ Is the election currently in Voting phase?
- ✓ Does the chosen candidate exist?

If any check fails, the vote is rejected. If all pass, the vote is accepted.

### Step 4 — The Vote is Written to the Blockchain
The vote is permanently recorded. The candidate's vote count increases by 1. This cannot be undone.

### Step 5 — A Transaction Hash is Generated
Every blockchain transaction gets a unique ID called a **transaction hash** — like a receipt number. For example:
`0xabc123def456...`

The voter can use this hash to verify their vote on Etherscan at any time.

---

## What Gets Stored on the Blockchain vs Database

Not everything is stored on the blockchain. Here is the split:

### Stored on Blockchain (Permanent, Public, Tamper-proof)
| What | Why on Blockchain |
|------|------------------|
| Candidate names and parties | Cannot be changed after election starts |
| Registered voter wallet addresses | Proves who is allowed to vote |
| Each vote cast | Permanent, cannot be deleted |
| Vote counts per candidate | Automatically tallied |
| Election phase | Controls what actions are allowed |
| Winner | Announced automatically |

### Stored in Database (MongoDB)
| What | Why in Database |
|------|----------------|
| Voter personal details (name, email, etc.) | Private information, not public |
| Face photos | Large files, stored on Cloudinary |
| OTP codes | Temporary, deleted after use |
| Admin accounts | System management |

---

## Why Blockchain Makes Voting Trustworthy

### Problem with Traditional Online Voting
In a normal website, votes are stored in a database. The company running the website could:
- Change vote counts
- Delete votes
- Add fake votes
- Shut down the system

Voters have no way to verify their vote was counted correctly.

### How Blockchain Solves This

**1. Nobody can change a recorded vote**
Once a vote is written to the blockchain, it is mathematically impossible to change it without the entire network noticing. The blockchain is protected by cryptography.

**2. Anyone can verify results**
Every vote is publicly visible on Etherscan. Anyone — including journalists, opposition parties, or ordinary citizens — can count the votes themselves and verify the result.

**3. No single point of failure**
The blockchain runs on thousands of computers worldwide. Even if our server goes down, the votes are safe on the blockchain.

**4. The code is the law**
The smart contract code defines the rules. The contract cannot be bribed, threatened, or convinced to break its own rules. It executes exactly as programmed, every time.

---

## MetaMask — The Voter's Digital Identity

**MetaMask** is a browser extension (like an add-on for Chrome or Firefox) that manages Ethereum wallets.

Think of it as a **digital passport and pen combined**:
- It holds your unique wallet address (like a passport number)
- It signs transactions with your private key (like a signature)
- Only you can sign with your wallet

When a voter connects MetaMask to eVoteFace:
- The system sees their wallet address
- Checks if that address is registered on the smart contract
- If registered, allows them to proceed to voting

**Important:** The wallet address is like a public ID. Anyone can see it. But only the person with the private key (stored secretly in MetaMask) can use it to sign transactions.

---

## Gas Fees — The Small Cost of Voting

Every action on the Ethereum blockchain requires a small fee called **gas**. This fee pays the computers (called miners/validators) that process and record the transaction.

In eVoteFace:
- **Admin pays gas** for: creating elections, adding candidates, registering voters, changing phases
- **Voter pays gas** for: casting their vote

On Sepolia testnet, gas is paid with **free test ETH** available from faucets (websites that give free test ETH). No real money is involved.

On a real deployment (mainnet), gas would cost a small amount of real ETH — typically a few cents to a few dollars depending on network congestion.

---

## The Factory Pattern — Why We Use It

Instead of one big voting contract for all elections, we use a **factory pattern**:

```
ElectionFactory (one, permanent)
    |
    |── creates ──► Election Contract for "Presidential Election 2025"
    |── creates ──► Election Contract for "Governor Election 2025"
    |── creates ──► Election Contract for "Student Council Election"
```

**Benefits:**
- Each election is completely isolated — a problem in one cannot affect another
- Unlimited elections can be created
- Each election has its own vote counts, candidates, and voters
- Results for each election are independently verifiable

---

## Verifying Your Vote on Etherscan

After voting, every voter receives a **transaction hash** — a unique receipt for their vote.

To verify your vote was recorded:
1. Go to **https://sepolia.etherscan.io**
2. Paste your transaction hash in the search box
3. You will see:
   - The transaction was successful (green checkmark)
   - Which contract received the vote
   - The wallet address that sent the vote
   - The exact time it was recorded

This is **public proof** that your vote exists on the blockchain.

---

## The Admin Wallet — Who Controls the Contracts

The admin has a special Ethereum wallet:
**Address:** `0x5b979D566867F2f5abaEE5d51292E1bd1740f103`

This wallet is the **election administrator** on the blockchain. It has special powers:
- Add candidates to the ballot
- Register voter wallets
- Change election phases
- Announce the winner

The private key for this wallet is stored securely on the server. It is never shared with anyone.

**Important:** Even the admin cannot change votes once cast. The smart contract only allows the admin to manage the election setup — not the votes themselves.

---

## Summary — Why This System is Secure

| Security Feature | How Blockchain Provides It |
|-----------------|---------------------------|
| Votes cannot be changed | Blockchain is immutable |
| No double voting | Smart contract checks wallet history |
| Results are transparent | Anyone can read the blockchain |
| No central authority | Runs on thousands of computers |
| Voter identity verified | MetaMask wallet + face + OTP |
| Audit trail | Every action has a transaction hash |
| No fake votes | Only registered wallets can vote |

---

## In One Sentence

> eVoteFace uses the Ethereum blockchain as an **incorruptible, transparent, and permanent voting ledger** — ensuring that every vote is counted exactly once, cannot be changed by anyone, and can be verified by everyone.
