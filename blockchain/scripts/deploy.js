const hre = require("hardhat");

async function main() {
  console.log("Deploying VoteRecord contract...");

  const VoteRecord = await hre.ethers.getContractFactory("VoteRecord");
  const voteRecord = await VoteRecord.deploy();

  await voteRecord.deployed();

  console.log("VoteRecord deployed to:", voteRecord.address);

  // Save contract address
  const fs = require("fs");
  const contractInfo = {
    address: voteRecord.address,
    abi: VoteRecord.interface.format("json"),
    network: hre.network.name,
    deployedAt: new Date().toISOString(),
  };

  fs.writeFileSync(
    "./contract-info.json",
    JSON.stringify(contractInfo, null, 2)
  );

  console.log("Contract info saved to contract-info.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
