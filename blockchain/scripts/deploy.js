const { ethers, hre, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("─────────────────────────────────────");
  console.log("eVoteFace — Deploying Voting Contract");
  console.log("─────────────────────────────────────");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying from address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", ethers.formatEther(balance), "ETH");

  if (balance === 0n) {
    throw new Error("Deployer has no ETH. Get Sepolia test ETH from a faucet.");
  }

  console.log("\nDeploying Voting.sol...");
  const VotingFactory = await ethers.getContractFactory("Voting");

  const voting = await VotingFactory.deploy(
    "eVoteFace General Election 2026",
    "Secure decentralized voting with face recognition and blockchain"
  );

  await voting.waitForDeployment();

  const contractAddress = await voting.getAddress();
  console.log("✅ Voting contract deployed to:", contractAddress);
  console.log("Transaction hash:", voting.deploymentTransaction().hash);

  // Save deployment info
  const deploymentInfo = {
    localhost: {},
    sepolia: {},
  };

  // Load existing if present
  const outputPath = path.join(__dirname, "../deployedAddresses.json");
  if (fs.existsSync(outputPath)) {
    const existing = JSON.parse(fs.readFileSync(outputPath, "utf8"));
    Object.assign(deploymentInfo, existing);
  }

  const networkName = network.name;
  deploymentInfo[networkName] = {
    contractAddress,
    deployerAddress: deployer.address,
    deployedAt: new Date().toISOString(),
    transactionHash: voting.deploymentTransaction().hash,
    chainId: networkName === "sepolia" ? 11155111 : 31337,
  };

  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n✅ Deployment info saved to deployedAddresses.json");

  console.log("\n─────────────────────────────────────");
  console.log("NEXT STEPS:");
  console.log("─────────────────────────────────────");
  console.log("1. Add to server/.env and client/.env:");
  console.log("   CONTRACT_ADDRESS=" + contractAddress);
  console.log("\n2. Run the ABI extractor:");
  console.log("   node scripts/extractABI.js");
  console.log("─────────────────────────────────────");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
