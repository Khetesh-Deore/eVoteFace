const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ElectionFactory", function () {
  let ElectionFactory, factory;
  let Voting;
  let owner, admin1, admin2;

  beforeEach(async function () {
    [owner, admin1, admin2] = await ethers.getSigners();

    // Deploy Factory
    ElectionFactory = await ethers.getContractFactory("ElectionFactory");
    factory = await ElectionFactory.deploy();
    await factory.waitForDeployment();

    // Get Voting contract factory for verification
    Voting = await ethers.getContractFactory("Voting");
  });

  describe("Deployment", function () {
    it("Should initialize with electionCounter = 0", async function () {
      expect(await factory.electionCounter()).to.equal(0);
    });
  });

  describe("Create Election", function () {
    it("Should create a new election and increment counter", async function () {
      const tx = await factory.connect(admin1).createElection("Presidential Election 2024", "National election");
      await tx.wait();

      expect(await factory.electionCounter()).to.equal(1);
    });

    it("Should deploy a new Voting contract", async function () {
      const tx = await factory.connect(admin1).createElection("Presidential Election 2024", "National election");
      const receipt = await tx.wait();

      const electionRecord = await factory.elections(1);
      expect(electionRecord.contractAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("Should emit ElectionCreated event with correct parameters", async function () {
      const tx = await factory.connect(admin1).createElection("Presidential Election 2024", "National election");
      
      await expect(tx)
        .to.emit(factory, "ElectionCreated");
      
      const electionAddress = await factory.getElectionAddress(1);
      const record = await factory.elections(1);
      
      expect(record.electionId).to.equal(1);
      expect(record.contractAddress).to.equal(electionAddress);
      expect(record.title).to.equal("Presidential Election 2024");
      expect(record.admin).to.equal(admin1.address);
    });

    it("Should transfer ownership of Voting contract to creator", async function () {
      await factory.connect(admin1).createElection("Presidential Election 2024", "National election");
      
      const electionAddress = await factory.getElectionAddress(1);
      const votingContract = Voting.attach(electionAddress);
      
      expect(await votingContract.owner()).to.equal(admin1.address);
    });

    it("Should store correct election record", async function () {
      await factory.connect(admin1).createElection("Presidential Election 2024", "National election");
      
      const record = await factory.elections(1);
      expect(record.electionId).to.equal(1);
      expect(record.title).to.equal("Presidential Election 2024");
      expect(record.admin).to.equal(admin1.address);
      expect(record.contractAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("Should revert if title is empty", async function () {
      await expect(
        factory.connect(admin1).createElection("", "Description")
      ).to.be.revertedWith("ElectionFactory: Title cannot be empty");
    });

    it("Should allow multiple elections by same admin", async function () {
      await factory.connect(admin1).createElection("Election 1", "First");
      await factory.connect(admin1).createElection("Election 2", "Second");

      expect(await factory.electionCounter()).to.equal(2);
    });

    it("Should allow multiple elections by different admins", async function () {
      await factory.connect(admin1).createElection("Election 1", "Admin1");
      await factory.connect(admin2).createElection("Election 2", "Admin2");

      const record1 = await factory.elections(1);
      const record2 = await factory.elections(2);

      expect(record1.admin).to.equal(admin1.address);
      expect(record2.admin).to.equal(admin2.address);
    });
  });

  describe("Get Election Address", function () {
    beforeEach(async function () {
      await factory.connect(admin1).createElection("Test Election", "Test");
    });

    it("Should return correct election address", async function () {
      const address = await factory.getElectionAddress(1);
      const record = await factory.elections(1);
      expect(address).to.equal(record.contractAddress);
    });

    it("Should revert for invalid election ID (0)", async function () {
      await expect(factory.getElectionAddress(0))
        .to.be.revertedWith("ElectionFactory: Invalid election ID");
    });

    it("Should revert for non-existent election ID", async function () {
      await expect(factory.getElectionAddress(999))
        .to.be.revertedWith("ElectionFactory: Invalid election ID");
    });
  });

  describe("Get All Elections", function () {
    it("Should return empty array when no elections", async function () {
      const elections = await factory.getAllElections();
      expect(elections.length).to.equal(0);
    });

    it("Should return all elections", async function () {
      await factory.connect(admin1).createElection("Election 1", "First");
      await factory.connect(admin2).createElection("Election 2", "Second");
      await factory.connect(admin1).createElection("Election 3", "Third");

      const elections = await factory.getAllElections();
      expect(elections.length).to.equal(3);
      expect(elections[0].title).to.equal("Election 1");
      expect(elections[1].title).to.equal("Election 2");
      expect(elections[2].title).to.equal("Election 3");
    });
  });

  describe("Get Elections By Admin", function () {
    beforeEach(async function () {
      await factory.connect(admin1).createElection("Admin1 Election 1", "First");
      await factory.connect(admin2).createElection("Admin2 Election 1", "Second");
      await factory.connect(admin1).createElection("Admin1 Election 2", "Third");
    });

    it("Should return elections created by specific admin", async function () {
      const admin1Elections = await factory.getElectionsByAdmin(admin1.address);
      expect(admin1Elections.length).to.equal(2);
      expect(admin1Elections[0].title).to.equal("Admin1 Election 1");
      expect(admin1Elections[1].title).to.equal("Admin1 Election 2");
    });

    it("Should return empty array for admin with no elections", async function () {
      const ownerElections = await factory.getElectionsByAdmin(owner.address);
      expect(ownerElections.length).to.equal(0);
    });
  });

  describe("Get Election", function () {
    beforeEach(async function () {
      await factory.connect(admin1).createElection("Test Election", "Test Description");
    });

    it("Should return correct election record", async function () {
      const election = await factory.getElection(1);
      expect(election.electionId).to.equal(1);
      expect(election.title).to.equal("Test Election");
      expect(election.admin).to.equal(admin1.address);
    });

    it("Should revert for invalid election ID", async function () {
      await expect(factory.getElection(0))
        .to.be.revertedWith("ElectionFactory: Invalid election ID");
      
      await expect(factory.getElection(999))
        .to.be.revertedWith("ElectionFactory: Invalid election ID");
    });
  });

  describe("Integration with Voting Contract", function () {
    it("Created Voting contract should have correct electionId", async function () {
      await factory.connect(admin1).createElection("Test Election", "Test");
      
      const electionAddress = await factory.getElectionAddress(1);
      const votingContract = Voting.attach(electionAddress);
      
      expect(await votingContract.electionId()).to.equal(1);
      expect(await votingContract.electionTitle()).to.equal("Test Election");
      expect(await votingContract.electionDescription()).to.equal("Test");
    });

    it("Admin should be able to manage created election", async function () {
      await factory.connect(admin1).createElection("Test Election", "Test");
      
      const electionAddress = await factory.getElectionAddress(1);
      const votingContract = Voting.attach(electionAddress);
      
      // Admin should be able to add candidates
      await votingContract.connect(admin1).addCandidate("Candidate 1", "Party A", "SymbolA");
      
      const candidates = await votingContract.getAllCandidates();
      expect(candidates.length).to.equal(1);
      expect(candidates[0].name).to.equal("Candidate 1");
    });
  });
});
