const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ElectionFactory", function () {
  let factory, owner, admin1, admin2, stranger;
  const now = Math.floor(Date.now() / 1000);
  const start = now + 3600;
  const end   = now + 7200;

  beforeEach(async function () {
    [owner, admin1, admin2, stranger] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ElectionFactory");
    factory = await Factory.deploy();
    await factory.waitForDeployment();
  });

  // ── Deployment ──────────────────────────────────────────────────────────

  describe("Deployment", function () {
    it("sets deployer as platformOwner", async function () {
      expect(await factory.platformOwner()).to.equal(owner.address);
    });

    it("marks deployer as platform admin", async function () {
      expect(await factory.platformAdmins(owner.address)).to.equal(true);
    });

    it("starts with zero elections", async function () {
      expect(await factory.getTotalElections()).to.equal(0);
    });
  });

  // ── Admin Management ────────────────────────────────────────────────────

  describe("Admin Management", function () {
    it("owner can add a platform admin", async function () {
      await factory.connect(owner).addPlatformAdmin(admin1.address);
      expect(await factory.platformAdmins(admin1.address)).to.equal(true);
    });

    it("emits AdminAdded event", async function () {
      await expect(factory.connect(owner).addPlatformAdmin(admin1.address))
        .to.emit(factory, "AdminAdded");
    });

    it("owner can remove a platform admin", async function () {
      await factory.connect(owner).addPlatformAdmin(admin1.address);
      await factory.connect(owner).removePlatformAdmin(admin1.address);
      expect(await factory.platformAdmins(admin1.address)).to.equal(false);
    });

    it("emits AdminRemoved event", async function () {
      await factory.connect(owner).addPlatformAdmin(admin1.address);
      await expect(factory.connect(owner).removePlatformAdmin(admin1.address))
        .to.emit(factory, "AdminRemoved");
    });

    it("non-owner cannot add admin", async function () {
      await expect(
        factory.connect(stranger).addPlatformAdmin(admin1.address)
      ).to.be.revertedWith("Factory: caller is not platform owner");
    });

    it("non-owner cannot remove admin", async function () {
      await factory.connect(owner).addPlatformAdmin(admin1.address);
      await expect(
        factory.connect(stranger).removePlatformAdmin(admin1.address)
      ).to.be.revertedWith("Factory: caller is not platform owner");
    });

    it("cannot remove platform owner from admins", async function () {
      await expect(
        factory.connect(owner).removePlatformAdmin(owner.address)
      ).to.be.revertedWith("Factory: cannot remove platform owner");
    });

    it("cannot add zero address as admin", async function () {
      await expect(
        factory.connect(owner).addPlatformAdmin(ethers.ZeroAddress)
      ).to.be.revertedWith("Factory: invalid address");
    });

    it("cannot add same admin twice", async function () {
      await factory.connect(owner).addPlatformAdmin(admin1.address);
      await expect(
        factory.connect(owner).addPlatformAdmin(admin1.address)
      ).to.be.revertedWith("Factory: already a platform admin");
    });
  });

  // ── Election Creation ───────────────────────────────────────────────────

  describe("Election Creation", function () {
    beforeEach(async function () {
      await factory.connect(owner).addPlatformAdmin(admin1.address);
    });

    it("platform admin can create an election", async function () {
      await factory.connect(admin1).createElection(
        "Test Election", "Description", start, end, admin1.address
      );
      expect(await factory.getTotalElections()).to.equal(1);
    });

    it("platform owner can create an election", async function () {
      await factory.connect(owner).createElection(
        "Owner Election", "Desc", start, end, owner.address
      );
      expect(await factory.getTotalElections()).to.equal(1);
    });

    it("stranger cannot create an election", async function () {
      await expect(
        factory.connect(stranger).createElection(
          "Hack", "Desc", start, end, stranger.address
        )
      ).to.be.revertedWith("Factory: caller is not a platform admin");
    });

    it("returns deployed election address", async function () {
      const tx = await factory.connect(admin1).createElection(
        "Election A", "Desc", start, end, admin1.address
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        l => l.fragment && l.fragment.name === "ElectionCreated"
      );
      expect(event).to.not.be.undefined;
      const electionAddr = event.args[0];
      expect(electionAddr).to.not.equal(ethers.ZeroAddress);
    });

    it("getAllElections returns all deployed addresses", async function () {
      await factory.connect(admin1).createElection("E1", "D", start, end, admin1.address);
      await factory.connect(admin1).createElection("E2", "D", start, end, admin1.address);
      const all = await factory.getAllElections();
      expect(all.length).to.equal(2);
    });

    it("getElectionsByAdmin returns only that admin's elections", async function () {
      await factory.connect(owner).addPlatformAdmin(admin2.address);
      await factory.connect(admin1).createElection("E1", "D", start, end, admin1.address);
      await factory.connect(admin2).createElection("E2", "D", start, end, admin2.address);
      await factory.connect(admin1).createElection("E3", "D", start, end, admin1.address);

      const admin1Elections = await factory.getElectionsByAdmin(admin1.address);
      const admin2Elections = await factory.getElectionsByAdmin(admin2.address);

      expect(admin1Elections.length).to.equal(2);
      expect(admin2Elections.length).to.equal(1);
    });

    it("emits ElectionCreated event with correct args", async function () {
      await expect(
        factory.connect(admin1).createElection("My Election", "Desc", start, end, admin1.address)
      ).to.emit(factory, "ElectionCreated");
    });

    it("rejects empty title", async function () {
      await expect(
        factory.connect(admin1).createElection("", "Desc", start, end, admin1.address)
      ).to.be.revertedWith("Factory: title cannot be empty");
    });

    it("rejects zero admin address", async function () {
      await expect(
        factory.connect(admin1).createElection("E", "D", start, end, ethers.ZeroAddress)
      ).to.be.revertedWith("Factory: invalid admin address");
    });

    it("rejects startTime >= endTime", async function () {
      await expect(
        factory.connect(admin1).createElection("E", "D", end, start, admin1.address)
      ).to.be.revertedWith("Factory: startTime must be before endTime");
    });

    it("deployed election has correct admin", async function () {
      const tx = await factory.connect(admin1).createElection(
        "E", "D", start, end, admin2.address
      );
      const receipt = await tx.wait();
      const event = receipt.logs.find(l => l.fragment?.name === "ElectionCreated");
      const electionAddr = event.args[0];

      const Election = await ethers.getContractFactory("Election");
      const election = Election.attach(electionAddr);
      expect(await election.electionAdmin()).to.equal(admin2.address);
    });
  });

  async function getBlockTimestamp() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp;
  }
});
