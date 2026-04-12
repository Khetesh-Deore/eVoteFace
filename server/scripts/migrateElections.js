const mongoose = require("mongoose");
require("dotenv").config();

const User = require("../models/User");
const Candidate = require("../models/Candidate");
const Election = require("../models/Election");
const OTP = require("../models/OTP");

/**
 * Migration Script: Add electionId to existing data
 * 
 * This script:
 * 1. Creates a default election record if none exists
 * 2. Links all existing users to this election
 * 3. Links all existing candidates to this election
 * 4. Marks all migrated data with isLegacy: true for rollback capability
 */

async function migrate() {
  try {
    console.log("🔄 Starting migration...\n");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Step 1: Check if elections exist
    const existingElections = await Election.find();
    console.log(`📊 Found ${existingElections.length} existing election(s)`);

    let defaultElection;

    if (existingElections.length === 0) {
      // Create default election
      console.log("\n📝 Creating default election...");
      defaultElection = await Election.create({
        title: "Legacy Election 2024",
        description: "Migrated from single-election system",
        phase: "registration",
        contractAddress: process.env.CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000",
        isActive: true,
        isLegacy: true,
      });
      console.log(`✅ Created default election: ${defaultElection._id}`);
    } else {
      // Use first election as default
      defaultElection = existingElections[0];
      console.log(`✅ Using existing election: ${defaultElection._id}`);
      
      // Update election with new fields if missing
      if (!defaultElection.contractAddress) {
        defaultElection.contractAddress = process.env.CONTRACT_ADDRESS || "0x0000000000000000000000000000000000000000";
        defaultElection.isLegacy = true;
        await defaultElection.save();
        console.log("✅ Updated election with contractAddress");
      }
    }

    // Step 2: Migrate Users
    console.log("\n👥 Migrating users...");
    const usersWithoutElection = await User.find({ electionId: { $exists: false } });
    console.log(`Found ${usersWithoutElection.length} users without electionId`);

    if (usersWithoutElection.length > 0) {
      const userUpdateResult = await User.updateMany(
        { electionId: { $exists: false } },
        { 
          $set: { 
            electionId: defaultElection._id,
            isLegacy: true 
          } 
        }
      );
      console.log(`✅ Updated ${userUpdateResult.modifiedCount} users`);
    }

    // Step 3: Migrate Candidates
    console.log("\n🎯 Migrating candidates...");
    const candidatesWithoutElection = await Candidate.find({ electionId: { $exists: false } });
    console.log(`Found ${candidatesWithoutElection.length} candidates without electionId`);

    if (candidatesWithoutElection.length > 0) {
      const candidateUpdateResult = await Candidate.updateMany(
        { electionId: { $exists: false } },
        { 
          $set: { 
            electionId: defaultElection._id,
            contractAddress: defaultElection.contractAddress,
            isLegacy: true 
          } 
        }
      );
      console.log(`✅ Updated ${candidateUpdateResult.modifiedCount} candidates`);
    }

    // Step 4: Migrate OTPs (optional - they expire anyway)
    console.log("\n📧 Migrating OTPs...");
    const otpsWithoutElection = await OTP.find({ electionId: { $exists: false } });
    console.log(`Found ${otpsWithoutElection.length} OTPs without electionId`);

    if (otpsWithoutElection.length > 0) {
      const otpUpdateResult = await OTP.updateMany(
        { electionId: { $exists: false } },
        { 
          $set: { 
            electionId: defaultElection._id 
          } 
        }
      );
      console.log(`✅ Updated ${otpUpdateResult.modifiedCount} OTPs`);
    }

    // Step 5: Verification
    console.log("\n🔍 Verifying migration...");
    const totalUsers = await User.countDocuments();
    const usersWithElection = await User.countDocuments({ electionId: { $exists: true } });
    const totalCandidates = await Candidate.countDocuments();
    const candidatesWithElection = await Candidate.countDocuments({ electionId: { $exists: true } });

    console.log(`\n📊 Migration Summary:`);
    console.log(`─────────────────────────────────────────`);
    console.log(`Users: ${usersWithElection}/${totalUsers} have electionId`);
    console.log(`Candidates: ${candidatesWithElection}/${totalCandidates} have electionId`);
    console.log(`Default Election ID: ${defaultElection._id}`);
    console.log(`Contract Address: ${defaultElection.contractAddress}`);
    console.log(`─────────────────────────────────────────`);

    if (usersWithElection === totalUsers && candidatesWithElection === totalCandidates) {
      console.log("\n✅ Migration completed successfully!");
    } else {
      console.log("\n⚠️  Warning: Some documents may not have been migrated");
    }

    console.log("\n💡 To rollback, run: node server/scripts/rollbackMigration.js\n");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
}

// Run migration
migrate();
