const { ethers, network } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const log = (msg) => { process.stdout.write(msg + "\n"); fs.appendFileSync("deploy_out.txt", msg + "\n"); };

  log("─────────────────────────────────────");
  log("eVoteFace v2 — Deploying ElectionFactory");
  log("─────────────────────────────────────");

  const [deployer] = await ethers.getSigners();
  log("Deploying from: " + deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  log("Balance: " + ethers.formatEther(balance) + " ETH");
  if (balance === 0n) throw new Error("No ETH — get Sepolia test ETH from a faucet.");

  const Factory = await ethers.getContractFactory("ElectionFactory");
  const factory = await Factory.deploy();
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  log("✅ ElectionFactory deployed to: " + factoryAddress);
  log("   Tx hash: " + factory.deploymentTransaction().hash);

  const info = {
    network: network.name,
    factoryAddress,
    deployerAddress: deployer.address,
    deployedAt: new Date().toISOString(),
    transactionHash: factory.deploymentTransaction().hash,
  };

  const outPath = path.join(__dirname, "../deployedAddresses.json");
  fs.writeFileSync(outPath, JSON.stringify(info, null, 2));
  log("✅ Saved to deployedAddresses.json");

  log("\nNEXT STEPS:");
  log("  FACTORY_CONTRACT_ADDRESS=" + factoryAddress);
  log("  Add to server/.env and client/.env");
  log("  Then run: node scripts/extractABI.js");
  log("─────────────────────────────────────");
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
