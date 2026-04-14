const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Election", function () {
  let factory, election;
  let owner, electionAdmin, voter1, voter2, voter3, stranger;
  const now   = Math.floor(Date.now() / 1000);
  const start = now + 3600;
  const end   = now + 7200;

  async function deployElection(adminAddr) {
    const tx = await factory.connect(owner).createElection(
      "Test Election 2026", "A test election", start, end, adminAddr
    );
    const receipt = await tx.wait();
    const event = receipt.logs.find(l => l.fragment?.name === "ElectionCreated");
    const addr = event.args[0];
    const Election = await ethers.getContractFactory("Election");
    return Election.attach(addr);
  }

  beforeEach(async function () {
    [owner, electionAdmin, voter1, voter2, voter3, stranger] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("ElectionFactory");
    factory = await Factory.deploy();
    await factory.waitForDeployment();

    election = await deployElection(electionAdmin.address);
  });

  // ── Deployment ──────────────────────────────────────────────────────────

  describe("Deployment", function () {
    it("sets electionAdmin correctly", async function () {
      expect(await election.electionAdmin()).to.equal(electionAdmin.address);
    });

    it("sets factory address correctly", async function () {
      expect(await election.factory()).to.equal(await factory.getAddress());
    });

    it("initializes in Registration phase", async function () {
      expect(await election.currentPhase()).to.equal(0);
    });

    it("sets title and description", async function () {
      expect(await election.title()).to.equal("Test Election 2026");
      expect(await election.description()).to.equal("A test election");
    });

    it("initializes counters to zero", async function () {
      expect(await election.totalCandidates()).to.equal(0);
      expect(await election.totalRegisteredVoters()).to.equal(0);
      expect(await election.totalVotesCast()).to.equal(0);
    });
  });

  // ── Candidate Management ────────────────────────────────────────────────

  describe("Candidate Management", function () {
    it("admin can add a candidate", async function () {
      await election.connect(electionAdmin).addCandidate("Alice", "Party A", "https://cdn.example.com/a.png");
      expect(await election.totalCandidates()).to.equal(1);
    });

    it("candidate ID starts from 1", async function () {
      await election.connect(electionAdmin).addCandidate("Alice", "Party A", "sym");
      const c = await election.getCandidate(1);
      expect(c.id).to.equal(1);
      expect(c.name).to.equal("Alice");
    });

    it("non-admin cannot add candidate", async function () {
      await expect(
        election.connect(stranger).addCandidate("Hack", "Party X", "sym")
      ).to.be.revertedWith("Election: caller is not admin");
    });

    it("rejects empty name", async function () {
      await expect(
        election.connect(electionAdmin).addCandidate("", "Party A", "sym")
      ).to.be.revertedWith("Election: name cannot be empty");
    });

    it("rejects empty partyName", async function () {
      await expect(
        election.connect(electionAdmin).addCandidate("Alice", "", "sym")
      ).to.be.revertedWith("Election: partyName cannot be empty");
    });

    it("cannot add candidate after voting starts", async function () {
      await election.connect(electionAdmin).changePhase(1);
      await expect(
        election.connect(electionAdmin).addCandidate("Late", "Party", "sym")
      ).to.be.revertedWith("Election: action not allowed in current phase");
    });

    it("admin can remove a candidate", async function () {
      await election.connect(electionAdmin).addCandidate("Alice", "Party A", "sym");
      await election.connect(electionAdmin).addCandidate("Bob", "Party B", "sym");
      await election.connect(electionAdmin).removeCandidate(1);
      const all = await election.getAllCandidates();
      expect(all.length).to.equal(1);
      expect(all[0].name).to.equal("Bob");
    });

    it("cannot remove non-existent candidate", async function () {
      await expect(
        election.connect(electionAdmin).removeCandidate(99)
      ).to.be.revertedWith("Election: candidate does not exist");
    });

    it("getAllCandidates returns all active candidates", async function () {
      await election.connect(electionAdmin).addCandidate("Alice", "Party A", "sym");
      await election.connect(electionAdmin).addCandidate("Bob", "Party B", "sym");
      const all = await election.getAllCandidates();
      expect(all.length).to.equal(2);
    });

    it("emits CandidateAdded event", async function () {
      await expect(
        election.connect(electionAdmin).addCandidate("Alice", "Party A", "sym")
      ).to.emit(election, "CandidateAdded");
    });
  });

  // ── Voter Registration ──────────────────────────────────────────────────

  describe("Voter Registration", function () {
    it("admin can register a voter", async function () {
      await election.connect(electionAdmin).registerVoter(voter1.address);
      const status = await election.getVoterStatus(voter1.address);
      expect(status.isRegistered).to.equal(true);
      expect(status.hasVoted).to.equal(false);
    });

    it("increments totalRegisteredVoters", async function () {
      await election.connect(electionAdmin).registerVoter(voter1.address);
      expect(await election.totalRegisteredVoters()).to.equal(1);
    });

    it("non-admin cannot register voter", async function () {
      await expect(
        election.connect(stranger).registerVoter(voter1.address)
      ).to.be.revertedWith("Election: caller is not admin");
    });

    it("cannot register same voter twice", async function () {
      await election.connect(electionAdmin).registerVoter(voter1.address);
      await expect(
        election.connect(electionAdmin).registerVoter(voter1.address)
      ).to.be.revertedWith("Election: voter already registered");
    });

    it("cannot register zero address", async function () {
      await expect(
        election.connect(electionAdmin).registerVoter(ethers.ZeroAddress)
      ).to.be.revertedWith("Election: invalid address");
    });

    it("admin CANNOT register themselves as voter in their own election", async function () {
      await expect(
        election.connect(electionAdmin).registerVoter(electionAdmin.address)
      ).to.be.revertedWith("Election: admin cannot be a voter in their own election");
    });

    it("admin wallet CAN be registered as voter in a DIFFERENT election", async function () {
      // Deploy a second election with a different admin
      const election2 = await deployElection(voter1.address);
      // voter1 is admin of election2 — they can register electionAdmin as a voter
      await election2.connect(voter1).registerVoter(electionAdmin.address);
      const status = await election2.getVoterStatus(electionAdmin.address);
      expect(status.isRegistered).to.equal(true);
    });

    it("cannot register voter after voting starts", async function () {
      await election.connect(electionAdmin).changePhase(1);
      await expect(
        election.connect(electionAdmin).registerVoter(voter1.address)
      ).to.be.revertedWith("Election: action not allowed in current phase");
    });

    it("emits VoterRegistered event", async function () {
      await expect(
        election.connect(electionAdmin).registerVoter(voter1.address)
      ).to.emit(election, "VoterRegistered");
    });
  });

  // ── Phase Management ────────────────────────────────────────────────────

  describe("Phase Management", function () {
    it("starts in Registration phase", async function () {
      expect(await election.currentPhase()).to.equal(0);
    });

    it("admin can advance Registration → Voting", async function () {
      await election.connect(electionAdmin).changePhase(1);
      expect(await election.currentPhase()).to.equal(1);
    });

    it("admin can advance Voting → Completed", async function () {
      await election.connect(electionAdmin).changePhase(1);
      await election.connect(electionAdmin).changePhase(2);
      expect(await election.currentPhase()).to.equal(2);
    });

    it("non-admin cannot change phase", async function () {
      await expect(
        election.connect(stranger).changePhase(1)
      ).to.be.revertedWith("Election: caller is not admin");
    });

    it("cannot skip phases (Registration → Completed)", async function () {
      await expect(
        election.connect(electionAdmin).changePhase(2)
      ).to.be.revertedWith("Election: invalid phase transition");
    });

    it("phase reset Voting → Registration works when NO votes cast", async function () {
      await election.connect(electionAdmin).changePhase(1);
      await election.connect(electionAdmin).changePhase(0); // reset
      expect(await election.currentPhase()).to.equal(0);
    });

    it("phase reset Voting → Registration BLOCKED when votes exist", async function () {
      await election.connect(electionAdmin).addCandidate("Alice", "Party A", "sym");
      await election.connect(electionAdmin).registerVoter(voter1.address);
      await election.connect(electionAdmin).changePhase(1);
      await election.connect(voter1).castVote(1);

      await expect(
        election.connect(electionAdmin).changePhase(0)
      ).to.be.revertedWith("Election: cannot reset phase after votes have been cast");
    });

    it("cannot go Completed → Voting", async function () {
      await election.connect(electionAdmin).changePhase(1);
      await election.connect(electionAdmin).changePhase(2);
      await expect(
        election.connect(electionAdmin).changePhase(1)
      ).to.be.revertedWith("Election: invalid phase transition");
    });

    it("emits PhaseChanged event", async function () {
      await expect(
        election.connect(electionAdmin).changePhase(1)
      ).to.emit(election, "PhaseChanged");
    });

    it("getCurrentPhaseString returns correct strings", async function () {
      expect(await election.getCurrentPhaseString()).to.equal("Registration");
      await election.connect(electionAdmin).changePhase(1);
      expect(await election.getCurrentPhaseString()).to.equal("Voting");
      await election.connect(electionAdmin).changePhase(2);
      expect(await election.getCurrentPhaseString()).to.equal("Completed");
    });
  });

  // ── Vote Casting ────────────────────────────────────────────────────────

  describe("Vote Casting", function () {
    beforeEach(async function () {
      await election.connect(electionAdmin).addCandidate("Alice", "Party A", "sym_a");
      await election.connect(electionAdmin).addCandidate("Bob", "Party B", "sym_b");
      await election.connect(electionAdmin).registerVoter(voter1.address);
      await election.connect(electionAdmin).registerVoter(voter2.address);
      await election.connect(electionAdmin).registerVoter(voter3.address);
      await election.connect(electionAdmin).changePhase(1);
    });

    it("registered voter can cast a vote", async function () {
      await election.connect(voter1).castVote(1);
      const status = await election.getVoterStatus(voter1.address);
      expect(status.hasVoted).to.equal(true);
      expect(status.votedFor).to.equal(1);
    });

    it("increments candidate voteCount", async function () {
      await election.connect(voter1).castVote(1);
      const c = await election.getCandidate(1);
      expect(c.voteCount).to.equal(1);
    });

    it("increments totalVotesCast", async function () {
      await election.connect(voter1).castVote(1);
      expect(await election.totalVotesCast()).to.equal(1);
    });

    it("voter cannot vote twice", async function () {
      await election.connect(voter1).castVote(1);
      await expect(
        election.connect(voter1).castVote(1)
      ).to.be.revertedWith("Election: caller has already voted");
    });

    it("unregistered wallet cannot vote", async function () {
      await expect(
        election.connect(stranger).castVote(1)
      ).to.be.revertedWith("Election: caller is not a registered voter");
    });

    it("cannot vote for non-existent candidate", async function () {
      await expect(
        election.connect(voter1).castVote(99)
      ).to.be.revertedWith("Election: candidate does not exist");
    });

    it("cannot vote during Registration phase", async function () {
      const election2 = await deployElection(electionAdmin.address);
      await election2.connect(electionAdmin).addCandidate("Alice", "Party A", "sym");
      await election2.connect(electionAdmin).registerVoter(voter1.address);
      await expect(
        election2.connect(voter1).castVote(1)
      ).to.be.revertedWith("Election: action not allowed in current phase");
    });

    it("cannot vote during Completed phase", async function () {
      await election.connect(electionAdmin).changePhase(2);
      await expect(
        election.connect(voter1).castVote(1)
      ).to.be.revertedWith("Election: action not allowed in current phase");
    });

    it("multiple voters, correct counts", async function () {
      await election.connect(voter1).castVote(1);
      await election.connect(voter2).castVote(1);
      await election.connect(voter3).castVote(2);

      const c1 = await election.getCandidate(1);
      const c2 = await election.getCandidate(2);
      expect(c1.voteCount).to.equal(2);
      expect(c2.voteCount).to.equal(1);
      expect(await election.totalVotesCast()).to.equal(3);
    });

    it("emits VoteCast event", async function () {
      await expect(
        election.connect(voter1).castVote(1)
      ).to.emit(election, "VoteCast");
    });
  });

  // ── Results & Winner ────────────────────────────────────────────────────

  describe("Results and Winner", function () {
    beforeEach(async function () {
      await election.connect(electionAdmin).addCandidate("Winner", "Party W", "sym_w");
      await election.connect(electionAdmin).addCandidate("Loser", "Party L", "sym_l");
      await election.connect(electionAdmin).registerVoter(voter1.address);
      await election.connect(electionAdmin).registerVoter(voter2.address);
      await election.connect(electionAdmin).registerVoter(voter3.address);
      await election.connect(electionAdmin).changePhase(1);
      await election.connect(voter1).castVote(1);
      await election.connect(voter2).castVote(1);
      await election.connect(voter3).castVote(2);
      await election.connect(electionAdmin).changePhase(2);
    });

    it("getWinner returns candidate with most votes", async function () {
      const winner = await election.getWinner();
      expect(winner.name).to.equal("Winner");
      expect(winner.voteCount).to.equal(2);
    });

    it("getWinner reverts before Completed phase", async function () {
      const election2 = await deployElection(electionAdmin.address);
      await election2.connect(electionAdmin).addCandidate("Alice", "Party A", "sym");
      await election2.connect(electionAdmin).registerVoter(voter1.address);
      await election2.connect(electionAdmin).changePhase(1);
      await expect(election2.getWinner()).to.be.revertedWith("Election: election not completed");
    });

    it("getElectionStats returns correct values", async function () {
      const stats = await election.getElectionStats();
      expect(stats._numVotes).to.equal(3);
      expect(stats._numCandidates).to.equal(2);
      expect(stats._phase).to.equal("Completed");
    });
  });

  async function getBlockTimestamp() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp;
  }
});
