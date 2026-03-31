const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Voting Contract", function () {
  let voting;
  let owner, voter1, voter2, voter3, nonVoter;

  beforeEach(async function () {
    [owner, voter1, voter2, voter3, nonVoter] = await ethers.getSigners();
    const VotingFactory = await ethers.getContractFactory("Voting");
    voting = await VotingFactory.deploy(
      "Test Election 2026",
      "A test election for automated testing"
    );
    await voting.waitForDeployment();
  });

  // ─────────────────────────────────────────────
  // DEPLOYMENT
  // ─────────────────────────────────────────────
  describe("Deployment", function () {
    it("Should set the deployer as owner", async function () {
      expect(await voting.owner()).to.equal(owner.address);
    });
    it("Should initialize in Registration phase", async function () {
      expect(await voting.currentPhase()).to.equal(0);
    });
    it("Should set election title correctly", async function () {
      expect(await voting.electionTitle()).to.equal("Test Election 2026");
    });
    it("Should initialize with zero candidates", async function () {
      expect(await voting.totalCandidates()).to.equal(0);
    });
    it("Should initialize with zero registered voters", async function () {
      expect(await voting.totalRegisteredVoters()).to.equal(0);
    });
    it("Should initialize with zero votes cast", async function () {
      expect(await voting.totalVotesCast()).to.equal(0);
    });
  });

  // ─────────────────────────────────────────────
  // CANDIDATE MANAGEMENT
  // ─────────────────────────────────────────────
  describe("Candidate Management", function () {
    it("Should allow owner to add a candidate", async function () {
      await voting.connect(owner).addCandidate("Rahul Gandhi", "INC", "https://example.com/inc.png");
      expect(await voting.totalCandidates()).to.equal(1);
    });
    it("Should assign candidate ID starting from 1", async function () {
      await voting.connect(owner).addCandidate("Candidate One", "Party A", "sym_a");
      const candidate = await voting.getCandidate(1);
      expect(candidate.id).to.equal(1);
    });
    it("Should store candidate name correctly", async function () {
      await voting.connect(owner).addCandidate("Narendra Modi", "BJP", "sym_bjp");
      const candidate = await voting.getCandidate(1);
      expect(candidate.name).to.equal("Narendra Modi");
    });
    it("Should initialize candidate vote count to zero", async function () {
      await voting.connect(owner).addCandidate("Test Candidate", "Test Party", "symbol");
      const candidate = await voting.getCandidate(1);
      expect(candidate.voteCount).to.equal(0);
    });
    it("Should NOT allow non-owner to add a candidate", async function () {
      await expect(
        voting.connect(voter1).addCandidate("Hacker", "Hacker Party", "symbol")
      ).to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount");
    });
    it("Should NOT allow adding candidate with empty name", async function () {
      await expect(
        voting.connect(owner).addCandidate("", "Some Party", "symbol")
      ).to.be.revertedWith("Voting: Candidate name cannot be empty");
    });
    it("Should NOT allow adding candidate with empty party name", async function () {
      await expect(
        voting.connect(owner).addCandidate("Some Name", "", "symbol")
      ).to.be.revertedWith("Voting: Party name cannot be empty");
    });
    it("Should add multiple candidates with sequential IDs", async function () {
      await voting.connect(owner).addCandidate("Candidate One", "Party A", "sym_a");
      await voting.connect(owner).addCandidate("Candidate Two", "Party B", "sym_b");
      await voting.connect(owner).addCandidate("Candidate Three", "Party C", "sym_c");
      expect(await voting.totalCandidates()).to.equal(3);
      const c1 = await voting.getCandidate(1);
      const c3 = await voting.getCandidate(3);
      expect(c1.name).to.equal("Candidate One");
      expect(c3.name).to.equal("Candidate Three");
    });
    it("Should return all candidates via getAllCandidates", async function () {
      await voting.connect(owner).addCandidate("Candidate One", "Party A", "sym_a");
      await voting.connect(owner).addCandidate("Candidate Two", "Party B", "sym_b");
      const allCandidates = await voting.getAllCandidates();
      expect(allCandidates.length).to.equal(2);
    });
    it("Should NOT allow adding candidates after voting starts", async function () {
      await voting.connect(owner).changePhase(1);
      await expect(
        voting.connect(owner).addCandidate("Late Candidate", "Late Party", "symbol")
      ).to.be.revertedWith("Voting: Action not allowed in current phase");
    });
    it("Should allow owner to remove a candidate", async function () {
      await voting.connect(owner).addCandidate("To Remove", "Remove Party", "sym");
      await voting.connect(owner).addCandidate("Keep This", "Keep Party", "sym2");
      await voting.connect(owner).removeCandidate(1);
      const allCandidates = await voting.getAllCandidates();
      expect(allCandidates.length).to.equal(1);
      expect(allCandidates[0].name).to.equal("Keep This");
    });
    it("Should NOT allow removing a non-existent candidate", async function () {
      await expect(
        voting.connect(owner).removeCandidate(99)
      ).to.be.revertedWith("Voting: Candidate does not exist");
    });
    it("Should NOT allow non-owner to remove candidate", async function () {
      await voting.connect(owner).addCandidate("Test", "Party", "sym");
      await expect(
        voting.connect(voter1).removeCandidate(1)
      ).to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount");
    });
    it("Should emit CandidateAdded event", async function () {
      await expect(voting.connect(owner).addCandidate("Event Test", "Event Party", "sym"))
        .to.emit(voting, "CandidateAdded");
    });
  });

  // ─────────────────────────────────────────────
  // VOTER REGISTRATION
  // ─────────────────────────────────────────────
  describe("Voter Registration", function () {
    it("Should allow owner to register a voter", async function () {
      await voting.connect(owner).registerVoter(voter1.address);
      const status = await voting.getVoterStatus(voter1.address);
      expect(status.isRegistered).to.equal(true);
    });
    it("Should increment totalRegisteredVoters after registration", async function () {
      await voting.connect(owner).registerVoter(voter1.address);
      expect(await voting.totalRegisteredVoters()).to.equal(1);
    });
    it("Should register voter with hasVoted as false", async function () {
      await voting.connect(owner).registerVoter(voter1.address);
      const status = await voting.getVoterStatus(voter1.address);
      expect(status.hasVoted).to.equal(false);
    });
    it("Should NOT allow registering the same voter twice", async function () {
      await voting.connect(owner).registerVoter(voter1.address);
      await expect(
        voting.connect(owner).registerVoter(voter1.address)
      ).to.be.revertedWith("Voting: Voter already registered");
    });
    it("Should NOT allow registering the zero address", async function () {
      await expect(
        voting.connect(owner).registerVoter(ethers.ZeroAddress)
      ).to.be.revertedWith("Voting: Invalid wallet address");
    });
    it("Should NOT allow registering the owner as a voter", async function () {
      await expect(
        voting.connect(owner).registerVoter(owner.address)
      ).to.be.revertedWith("Voting: Owner cannot be a voter");
    });
    it("Should NOT allow non-owner to register a voter", async function () {
      await expect(
        voting.connect(voter1).registerVoter(voter2.address)
      ).to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount");
    });
    it("Should NOT allow voter registration after voting starts", async function () {
      await voting.connect(owner).changePhase(1);
      await expect(
        voting.connect(owner).registerVoter(voter1.address)
      ).to.be.revertedWith("Voting: Action not allowed in current phase");
    });
    it("Should return false for unregistered address", async function () {
      const status = await voting.getVoterStatus(nonVoter.address);
      expect(status.isRegistered).to.equal(false);
    });
    it("Should emit VoterRegistered event", async function () {
      await expect(voting.connect(owner).registerVoter(voter1.address))
        .to.emit(voting, "VoterRegistered");
    });
  });

  // ─────────────────────────────────────────────
  // PHASE MANAGEMENT
  // ─────────────────────────────────────────────
  describe("Phase Management", function () {
    it("Should start in Registration phase", async function () {
      expect(await voting.currentPhase()).to.equal(0);
    });
    it("Should allow owner to advance to Voting phase", async function () {
      await voting.connect(owner).changePhase(1);
      expect(await voting.currentPhase()).to.equal(1);
    });
    it("Should allow owner to advance to Completed phase from Voting", async function () {
      await voting.connect(owner).changePhase(1);
      await voting.connect(owner).changePhase(2);
      expect(await voting.currentPhase()).to.equal(2);
    });
    it("Should NOT allow skipping phases", async function () {
      await expect(
        voting.connect(owner).changePhase(2)
      ).to.be.revertedWith("Voting: Can only advance to the next phase");
    });
    it("Should NOT allow going backward", async function () {
      await voting.connect(owner).changePhase(1);
      await expect(
        voting.connect(owner).changePhase(0)
      ).to.be.revertedWith("Voting: Can only advance to the next phase");
    });
    it("Should NOT allow non-owner to change phase", async function () {
      await expect(
        voting.connect(voter1).changePhase(1)
      ).to.be.revertedWithCustomError(voting, "OwnableUnauthorizedAccount");
    });
    it("Should emit PhaseChanged event", async function () {
      await expect(voting.connect(owner).changePhase(1))
        .to.emit(voting, "PhaseChanged");
    });
    it("Should return correct phase string for Registration", async function () {
      expect(await voting.getCurrentPhaseString()).to.equal("Registration");
    });
    it("Should return correct phase string for Voting", async function () {
      await voting.connect(owner).changePhase(1);
      expect(await voting.getCurrentPhaseString()).to.equal("Voting");
    });
    it("Should return correct phase string for Completed", async function () {
      await voting.connect(owner).changePhase(1);
      await voting.connect(owner).changePhase(2);
      expect(await voting.getCurrentPhaseString()).to.equal("Completed");
    });
  });

  // ─────────────────────────────────────────────
  // VOTE CASTING
  // ─────────────────────────────────────────────
  describe("Vote Casting", function () {
    beforeEach(async function () {
      await voting.connect(owner).addCandidate("Candidate A", "Party A", "sym_a");
      await voting.connect(owner).addCandidate("Candidate B", "Party B", "sym_b");
      await voting.connect(owner).registerVoter(voter1.address);
      await voting.connect(owner).registerVoter(voter2.address);
      await voting.connect(owner).registerVoter(voter3.address);
      await voting.connect(owner).changePhase(1);
    });

    it("Should allow registered voter to cast a vote", async function () {
      await voting.connect(voter1).castVote(1);
      const status = await voting.getVoterStatus(voter1.address);
      expect(status.hasVoted).to.equal(true);
    });
    it("Should increment candidate vote count after vote", async function () {
      await voting.connect(voter1).castVote(1);
      const candidate = await voting.getCandidate(1);
      expect(candidate.voteCount).to.equal(1);
    });
    it("Should increment totalVotesCast after vote", async function () {
      await voting.connect(voter1).castVote(1);
      expect(await voting.totalVotesCast()).to.equal(1);
    });
    it("Should record which candidate voter voted for", async function () {
      await voting.connect(voter1).castVote(2);
      const status = await voting.getVoterStatus(voter1.address);
      expect(status.votedFor).to.equal(2);
    });
    it("Should NOT allow a voter to vote twice", async function () {
      await voting.connect(voter1).castVote(1);
      await expect(
        voting.connect(voter1).castVote(1)
      ).to.be.revertedWith("Voting: Caller has already cast their vote");
    });
    it("Should NOT allow voting for a non-existent candidate", async function () {
      await expect(
        voting.connect(voter1).castVote(99)
      ).to.be.revertedWith("Voting: Candidate does not exist");
    });
    it("Should NOT allow an unregistered wallet to vote", async function () {
      await expect(
        voting.connect(nonVoter).castVote(1)
      ).to.be.revertedWith("Voting: Caller is not a registered voter");
    });
    it("Should NOT allow voting during Registration phase", async function () {
      const VotingFactory = await ethers.getContractFactory("Voting");
      const freshVoting = await VotingFactory.deploy("Fresh", "Fresh election");
      await freshVoting.waitForDeployment();
      await freshVoting.connect(owner).addCandidate("Test", "Party", "sym");
      await freshVoting.connect(owner).registerVoter(voter1.address);
      await expect(
        freshVoting.connect(voter1).castVote(1)
      ).to.be.revertedWith("Voting: Action not allowed in current phase");
    });
    it("Should NOT allow voting after election is Completed", async function () {
      await voting.connect(owner).changePhase(2);
      await expect(
        voting.connect(voter1).castVote(1)
      ).to.be.revertedWith("Voting: Action not allowed in current phase");
    });
    it("Should handle multiple voters voting for different candidates", async function () {
      await voting.connect(voter1).castVote(1);
      await voting.connect(voter2).castVote(1);
      await voting.connect(voter3).castVote(2);
      const candidateA = await voting.getCandidate(1);
      const candidateB = await voting.getCandidate(2);
      expect(candidateA.voteCount).to.equal(2);
      expect(candidateB.voteCount).to.equal(1);
      expect(await voting.totalVotesCast()).to.equal(3);
    });
    it("Should emit VoteCast event", async function () {
      await expect(voting.connect(voter1).castVote(1))
        .to.emit(voting, "VoteCast");
    });
  });

  // ─────────────────────────────────────────────
  // RESULTS AND WINNER
  // ─────────────────────────────────────────────
  describe("Results and Winner", function () {
    beforeEach(async function () {
      await voting.connect(owner).addCandidate("Winner Candidate", "Winning Party", "sym_w");
      await voting.connect(owner).addCandidate("Loser Candidate", "Losing Party", "sym_l");
      await voting.connect(owner).registerVoter(voter1.address);
      await voting.connect(owner).registerVoter(voter2.address);
      await voting.connect(owner).registerVoter(voter3.address);
      await voting.connect(owner).changePhase(1);
      await voting.connect(voter1).castVote(1);
      await voting.connect(voter2).castVote(1);
      await voting.connect(voter3).castVote(2);
      await voting.connect(owner).changePhase(2);
    });

    it("Should return correct winner after election completes", async function () {
      const winner = await voting.getWinner();
      expect(winner.name).to.equal("Winner Candidate");
      expect(winner.voteCount).to.equal(2);
    });
    it("Should NOT allow getting winner before election completes", async function () {
      const VotingFactory = await ethers.getContractFactory("Voting");
      const freshVoting = await VotingFactory.deploy("Fresh", "Fresh");
      await freshVoting.waitForDeployment();
      await freshVoting.connect(owner).addCandidate("Test", "Party", "sym");
      await freshVoting.connect(owner).registerVoter(voter1.address);
      await freshVoting.connect(owner).changePhase(1);
      await expect(freshVoting.getWinner()).to.be.revertedWith(
        "Voting: Action not allowed in current phase"
      );
    });
    it("Should return correct total votes in election stats", async function () {
      const stats = await voting.getElectionStats();
      expect(stats.numVotes).to.equal(3);
    });
    it("Should return correct candidate count in stats", async function () {
      const stats = await voting.getElectionStats();
      expect(stats.numCandidates).to.equal(2);
    });
  });
});
