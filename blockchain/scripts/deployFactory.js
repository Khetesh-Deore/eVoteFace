const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying ElectionFactory contract...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy ElectionFactory
  const ElectionFactory = await hre.ethers.getContractFactory("ElectionFactory");
  const factory = await ElectionFactory.deploy();
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("\n✅ ElectionFactory deployed to:", factoryAddress);

  // Save deployment info
  const deploymentInfo = {
    factoryAddress: factoryAddress,
    network: hre.network.name,
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
  };

  const deploymentPath = path.join(__dirname, "../deployedAddresses.json");
  let existingData = {};
  
  if (fs.existsSync(deploymentPath)) {
    existingData = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
  }

  existingData.factory = deploymentInfo;
  fs.writeFileSync(deploymentPath, JSON.stringify(existingData, null, 2));

  console.log("\n📝 Deployment info saved to deployedAddresses.json");

  // Extract and save Factory ABI
  const factoryArtifact = await hre.artifacts.readArtifact("ElectionFactory");
  const factoryABIPath = path.join(__dirname, "../artifacts/contracts/ElectionFactory.sol/ElectionFactoryABI.json");
  fs.writeFileSync(factoryABIPath, JSON.stringify(factoryArtifact.abi, null, 2));

  // Copy to server and client
  const serverABIPath = path.join(__dirname, "../../server/utils/ElectionFactoryABI.json");
  const clientABIPath = path.join(__dirname, "../../client/src/utils/ElectionFactoryABI.json");
  
  fs.writeFileSync(serverABIPath, JSON.stringify(factoryArtifact.abi, null, 2));
  fs.writeFileSync(clientABIPath, JSON.stringify(factoryArtifact.abi, null, 2));

  console.log("✅ Factory ABI copied to server and client\n");

  console.log("─────────────────────────────────────────");
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("─────────────────────────────────────────");
  console.log("Factory Address:", factoryAddress);
  console.log("Network:", hre.network.name);
  console.log("Deployer:", deployer.address);
  console.log("─────────────────────────────────────────\n");

  console.log("🎯 Next Steps:");
  console.log("1. Update .env files with FACTORY_ADDRESS=" + factoryAddress);
  console.log("2. Verify contract on Etherscan (if on testnet/mainnet)");
  console.log("3. Test creating elections via factory\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
