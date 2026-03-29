const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VoteRecord", function () {
  let voteRecord;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    const VoteRecord = await ethers.getContractFactory("VoteRecord");
    voteRecord = await VoteRecord.deploy();
    await voteRecord.deployed();
  });

  it("Should record a vote", async function () {
    const voterHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("voter1"));
    const candidateId = 1;

    await voteRecord.recordVote(voterHash, candidateId);

    expect(await voteRecord.getVoteCount()).to.equal(1);
    expect(await voteRecord.verifyVote(voterHash)).to.be.true;
  });

  it("Should prevent duplicate votes", async function () {
    const voterHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("voter1"));
    const candidateId = 1;

    await voteRecord.recordVote(voterHash, candidateId);

    await expect(
      voteRecord.recordVote(voterHash, candidateId)
    ).to.be.revertedWith("Voter already voted");
  });

  it("Should retrieve vote details", async function () {
    const voterHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("voter1"));
    const candidateId = 2;

    await voteRecord.recordVote(voterHash, candidateId);

    const [hash, cId, timestamp] = await voteRecord.getVote(0);
    expect(hash).to.equal(voterHash);
    expect(cId).to.equal(candidateId);
    expect(timestamp).to.be.gt(0);
  });
});
