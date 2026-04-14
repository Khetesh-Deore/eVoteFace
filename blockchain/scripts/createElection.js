const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const deployedPath = path.join(__dirname, "../deployedAddresses.json");
  if (!fs.existsSync(deployedPath)) {
    throw new Error("deployedAddresses.json not found. Run deployFactory.js first.");
  }

  const { factoryAddress } = JSON.parse(fs.readFileSync(deployedPath, "utf8"));
  console.log("Using factory:", factoryAddress);

  const [deployer] = await ethers.getSigners();
  const factory = await ethers.getContractAt("ElectionFactory", factoryAddress);

  const now = Math.floor(Date.now() / 1000);
  const startTime = now + 3600;   // 1 hour from now
  const endTime   = now + 86400;  // 24 hours from now

  console.log("Creating test election...");
  const tx = await factory.connect(deployer).createElection(
    "eVoteFace General Election 2026",
    "Secure decentralized voting with face recognition and blockchain",
    startTime,
    endTime,
    deployer.address   // deployer is the election admin
  );

  const receipt = await tx.wait();
  const event = receipt.logs.find(l => l.fragment?.name === "ElectionCreated");
  const electionAddress = event.args[0];

  console.log("✅ Election created at:", electionAddress);
  console.log("   Admin:", deployer.address);
  console.log("   Tx hash:", tx.hash);

  // Verify by reading the deployed election
  const election = await ethers.getContractAt("Election", electionAddress);
  console.log("   Title:", await election.title());
  console.log("   Phase:", await election.getCurrentPhaseString());
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
