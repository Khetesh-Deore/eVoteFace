require("dotenv").config();
const mongoose = require("mongoose");
const Election = require("../models/Election");

async function listAllElections() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    const elections = await Election.find({}).sort({ createdAt: -1 });

    console.log(`📊 Total Elections: ${elections.length}\n`);
    console.log("═".repeat(80));

    elections.forEach((election, i) => {
      console.log(`${i + 1}. ${election.title}`);
      console.log(`   ID: ${election._id}`);
      console.log(`   Phase: ${election.phase}`);
      console.log(`   Contract: ${election.contractAddress || "NOT DEPLOYED"}`);
      console.log(`   Factory TX: ${election.factoryTxHash || "N/A"}`);
      console.log(`   Active: ${election.isActive}`);
      console.log(`   Created: ${election.createdAt}`);
      console.log("");
    });

    console.log("═".repeat(80));

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

listAllElections();
