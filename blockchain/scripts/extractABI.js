const fs = require("fs");
const path = require("path");

function extract(contractName, serverFile, clientFile) {
  const artifactPath = path.join(
    __dirname, `../artifacts/contracts/${contractName}.sol/${contractName}.json`
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  fs.writeFileSync(serverFile, JSON.stringify(artifact.abi, null, 2));
  fs.writeFileSync(clientFile, JSON.stringify(artifact.abi, null, 2));
  console.log(`✅ ${contractName} ABI → server + client`);
}

const serverUtils  = path.join(__dirname, "../../server/utils");
const clientUtils  = path.join(__dirname, "../../client/src/utils");

extract(
  "ElectionFactory",
  path.join(serverUtils, "ElectionFactoryABI.json"),
  path.join(clientUtils, "ElectionFactoryABI.json")
);

extract(
  "Election",
  path.join(serverUtils, "ElectionABI.json"),
  path.join(clientUtils, "ElectionABI.json")
);

const deployed = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../deployedAddresses.json"), "utf8")
);
console.log("\nFactory address:", deployed.factoryAddress);
console.log("Add to server/.env:  FACTORY_CONTRACT_ADDRESS=" + deployed.factoryAddress);
console.log("Add to client/.env:  VITE_FACTORY_CONTRACT_ADDRESS=" + deployed.factoryAddress);
