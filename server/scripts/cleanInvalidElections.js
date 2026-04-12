require("dotenv").config();
const mongoose = require("mongoose");
const Election = require("../models/Election");
const blockchainService = require("../utils/blockchain");

/**
 * Script to clean up elections with invalid contract addresses
 * This will:
 * 1. Find all elections with contract addresses
 * 2. Test if the contract is valid by trying to call getElectionStats()
 * 3. Clear the contract address for invalid contracts
 */

async function cleanInvalidElections() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Initialize blockchain service
    await blockchainService.init();
    console.log("✅ Blockchain service initialized");

    // Find all elections with contract addresses
    const elections = await Election.find({ 
      contractAddress: { $exists: true, $ne: null, $ne: "" } 
    });

    console.log(`\n📊 Found ${elections.length} elections with contract addresses\n`);

    let validCount = 0;
    let invalidCount = 0;
    const invalidElections = [];

    for (const election of elections) {
      try {
        console.log(`Testing election: ${election.title} (${election._id})`);
        console.log(`  Contract: ${election.contractAddress}`);

        // Try to get stats from the contract
        const contract = blockchainService.getElectionContractReadOnly(
          election.contractAddress
        );
        const stats = await contract.getElectionStats();
        
        console.log(`  ✅ Valid - Title: ${stats.title}, Phase: ${stats.phase}`);
        validCount++;
      } catch (error) {
        console.log(`  ❌ Invalid - Error: ${error.message}`);
        invalidCount++;
        invalidElections.push({
          id: election._id,
          title: election.title,
          contractAddress: election.contractAddress,
          error: error.message,
        });
      }
      console.log("");
    }

    // Summary
    console.log("═".repeat(60));
    console.log("SUMMARY:");
    console.log(`  Valid contracts: ${validCount}`);
    console.log(`  Invalid contracts: ${invalidCount}`);
    console.log("═".repeat(60));

    if (invalidElections.length > 0) {
      console.log("\n⚠️  Invalid Elections Found:\n");
      invalidElections.forEach((e, i) => {
        console.log(`${i + 1}. ${e.title}`);
        console.log(`   ID: ${e.id}`);
        console.log(`   Contract: ${e.contractAddress}`);
        console.log(`   Error: ${e.error}\n`);
      });

      // Ask for confirmation to clean
      console.log("═".repeat(60));
      console.log("🔧 FIXING INVALID ELECTIONS...");
      console.log("   Setting contractAddress to null for invalid elections");
      console.log("═".repeat(60));

      for (const invalid of invalidElections) {
        await Election.findByIdAndUpdate(invalid.id, {
          contractAddress: null,
          factoryTxHash: null,
        });
        console.log(`✅ Cleared contract address for: ${invalid.title}`);
      }

      console.log(`\n✅ Fixed ${invalidElections.length} invalid elections`);
      console.log("   These elections can now be redeployed from the admin panel\n");
    } else {
      console.log("\n✅ All elections have valid contract addresses!\n");
    }

    await mongoose.connection.close();
    console.log("✅ Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Script failed:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the script
cleanInvalidElections();
