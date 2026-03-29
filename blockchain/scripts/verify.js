const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

async function verify() {
  console.log('🔍 eVoteFace Blockchain Verification Script\n');

  try {
    // 1. Check Network Connection
    console.log('1️⃣  Checking Network Connection...');
    const network = await hre.ethers.provider.getNetwork();
    console.log(`   ✅ Connected to: ${network.name} (Chain ID: ${network.chainId})`);

    // 2. Check Account Balance
    console.log('\n2️⃣  Checking Account Balance...');
    const [signer] = await hre.ethers.getSigners();
    const balance = await hre.ethers.provider.getBalance(signer.address);
    const balanceInEth = hre.ethers.formatEther(balance);
    console.log(`   ✅ Account: ${signer.address}`);
    console.log(`   ✅ Balance: ${balanceInEth} ETH`);

    if (parseFloat(balanceInEth) === 0) {
      console.log('   ⚠️  WARNING: Account has 0 balance. Get testnet tokens from faucet.');
    }

    // 3. Check Contract Deployment
    console.log('\n3️⃣  Checking Contract Deployment...');
    const contractPath = path.join(__dirname, '../artifacts/contracts/VoteRecord.sol/VoteRecord.json');
    
    if (!fs.existsSync(contractPath)) {
      console.log('   ❌ Contract artifact not found. Run: npx hardhat compile');
      return false;
    }
    console.log('   ✅ Contract artifact found');

    // 4. Deploy Test Contract
    console.log('\n4️⃣  Deploying Test Contract...');
    const VoteRecord = await hre.ethers.getContractFactory('VoteRecord');
    const contract = await VoteRecord.deploy();
    await contract.waitForDeployment();
    const contractAddress = await contract.getAddress();
    console.log(`   ✅ Contract deployed at: ${contractAddress}`);

    // 5. Test Contract Functions
    console.log('\n5️⃣  Testing Contract Functions...');

    // Test recordVote
    console.log('   Testing recordVote()...');
    const voterHash = hre.ethers.keccak256(hre.ethers.toUtf8Bytes('voter123'));
    const candidateId = 1;
    const tx1 = await contract.recordVote(voterHash, candidateId);
    await tx1.wait();
    console.log(`   ✅ recordVote() successful`);

    // Test getVoteCount
    console.log('   Testing getVoteCount()...');
    const voteCount = await contract.getVoteCount();
    console.log(`   ✅ Total votes: ${voteCount}`);

    // Test verifyVote
    console.log('   Testing verifyVote()...');
    const hasVoted = await contract.verifyVote(voterHash);
    console.log(`   ✅ Voter has voted: ${hasVoted}`);

    // Test getVote
    console.log('   Testing getVote()...');
    const vote = await contract.getVote(0);
    console.log(`   ✅ Vote retrieved: Candidate ${vote.candidateId}`);

    // Test getAllVotes
    console.log('   Testing getAllVotes()...');
    const allVotes = await contract.getAllVotes();
    console.log(`   ✅ All votes count: ${allVotes.length}`);

    // 6. Test Duplicate Vote Prevention
    console.log('\n6️⃣  Testing Duplicate Vote Prevention...');
    try {
      await contract.recordVote(voterHash, 2);
      console.log('   ❌ Duplicate vote was allowed (SECURITY ISSUE!)');
      return false;
    } catch (error) {
      console.log('   ✅ Duplicate vote prevented');
    }

    // 7. Verify Transaction Hash
    console.log('\n7️⃣  Verifying Transaction Hash...');
    const txHash = tx1.hash;
    const receipt = await hre.ethers.provider.getTransactionReceipt(txHash);
    console.log(`   ✅ Transaction Hash: ${txHash}`);
    console.log(`   ✅ Block Number: ${receipt.blockNumber}`);
    console.log(`   ✅ Gas Used: ${receipt.gasUsed}`);

    // 8. Summary
    console.log('\n✅ All Verification Tests Passed!\n');
    console.log('📋 Summary:');
    console.log(`   Network: ${network.name}`);
    console.log(`   Account: ${signer.address}`);
    console.log(`   Balance: ${balanceInEth} ETH`);
    console.log(`   Contract: ${contractAddress}`);
    console.log(`   Total Votes: ${voteCount}`);
    console.log(`   Transaction Hash: ${txHash}\n`);

    return true;
  } catch (error) {
    console.error('\n❌ Verification Failed:');
    console.error(error.message);
    return false;
  }
}

verify()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
