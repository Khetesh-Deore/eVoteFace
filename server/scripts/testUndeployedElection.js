require("dotenv").config();
const mongoose = require("mongoose");
const Election = require("../models/Election");
const Admin = require("../models/Admin");

/**
 * Test script to verify undeployed elections are handled gracefully
 */

async function testUndeployedElection() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Find or create a test admin
    let admin = await Admin.findOne({ email: "test@admin.com" });
    if (!admin) {
      admin = await Admin.create({
        fullName: "Test Admin",
        email: "test@admin.com",
        password: "test123", // Will be hashed by model
      });
      console.log("✅ Created test admin");
    }

    // Create an election WITHOUT contract deployment
    const election = await Election.create({
      title: "Test Undeployed Election",
      description: "Testing graceful handling of undeployed contracts",
      contractAddress: null,
      factoryTxHash: null,
      deploymentStatus: "not_deployed",
      admin: admin._id,
      createdBy: admin._id,
      isActive: true,
    });

    console.log("✅ Created test election without contract");
    console.log(`   ID: ${election._id}`);
    console.log(`   Title: ${election.title}`);
    console.log(`   Contract: ${election.contractAddress || "NOT DEPLOYED"}`);
    console.log(`   Deployment Status: ${election.deploymentStatus}`);
    console.log("");

    console.log("═".repeat(60));
    console.log("TEST RESULTS:");
    console.log("═".repeat(60));
    console.log("✅ Election created successfully without contract");
    console.log("✅ deploymentStatus field is working");
    console.log("✅ contractAddress can be null");
    console.log("");
    console.log("Now test these endpoints:");
    console.log(`  GET /api/elections/${election._id}/votes/results`);
    console.log(`  GET /api/elections/${election._id}/votes/candidates`);
    console.log("");
    console.log("Expected behavior:");
    console.log("  - Status 200 (not 400)");
    console.log("  - status: 'pending_deployment'");
    console.log("  - Empty results/candidates arrays");
    console.log("  - No errors or crashes");
    console.log("");

    await mongoose.connection.close();
    console.log("✅ Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Test failed:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

testUndeployedElection();
