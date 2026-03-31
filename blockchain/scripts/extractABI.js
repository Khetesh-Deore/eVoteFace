const fs = require("fs");
const path = require("path");

const artifactPath = path.join(__dirname, "../artifacts/contracts/Voting.sol/Voting.json");

if (!fs.existsSync(artifactPath)) {
  console.error("❌ Artifact not found. Run: npx hardhat compile");
  process.exit(1);
}

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
const abi = artifact.abi;

const serverPath = path.join(__dirname, "../../server/utils/VotingABI.json");
const clientPath = path.join(__dirname, "../../client/src/utils/VotingABI.json");

fs.writeFileSync(serverPath, JSON.stringify(abi, null, 2));
console.log("✅ ABI written to server/utils/VotingABI.json");

fs.writeFileSync(clientPath, JSON.stringify(abi, null, 2));
console.log("✅ ABI written to client/src/utils/VotingABI.json");

const deployInfoPath = path.join(__dirname, "../deployedAddresses.json");
if (fs.existsSync(deployInfoPath)) {
  const info = JSON.parse(fs.readFileSync(deployInfoPath, "utf8"));
  const network = info.sepolia?.contractAddress ? "sepolia" : "localhost";
  console.log("\nContract Address (" + network + "):", info[network]?.contractAddress);
  console.log("Add this to server/.env and client/.env as CONTRACT_ADDRESS");
}
