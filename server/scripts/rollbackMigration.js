const mongoose = require("mongoose");
require("dotenv").config();

const User = require("../models/User");
const Candidate = require("../models/Candidate");
const Election = require("../models/Election");
const OTP = require("../models/OTP");

/**
 * Rollback Script: Remove electionId from migrated data
 * 
 * This script:
 * 1. Removes electionId from all documents marked as isLegacy: true
 * 2. Removes the legacy election record
 * 3. Restores the system to single-election state
 */

async function rollback() {
  try {
    console.log("🔄 Starting rollback...\n");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Step 1: Rollback Users
    console.log("👥 Rolling back users...");
    const userRollbackResult = await User.updateMany(
      { isLegacy: true },
      { 
        $unset: { 
          electionId: "",
          isLegacy: "" 
        } 
      }
    );
    console.log(`✅ Rolled back ${userRollbackResult.modifiedCount} users`);

    // Step 2: Rollback Candidates
    console.log("\n🎯 Rolling back candidates...");
    const candidateRollbackResult = await Candidate.updateMany(
      { isLegacy: true },
      { 
        $unset: { 
          electionId: "",
          contractAddress: "",
          isLegacy: "" 
        } 
      }
    );
    console.log(`✅ Rolled back ${candidateRollbackResult.modifiedCount} candidates`);

    // Step 3: Rollback OTPs
    console.log("\n📧 Rolling back OTPs...");
    const otpRollbackResult = await OTP.updateMany(
      { electionId: { $exists: true } },
      { 
        $unset: { 
          electionId: "" 
        } 
      }
    );
    console.log(`✅ Rolled back ${otpRollbackResult.modifiedCount} OTPs`);

    // Step 4: Remove legacy elections
    console.log("\n🗑️  Removing legacy elections...");
    const electionDeleteResult = await Election.deleteMany({ isLegacy: true });
    console.log(`✅ Deleted ${electionDeleteResult.deletedCount} legacy election(s)`);

    // Step 5: Verification
    console.log("\n🔍 Verifying rollback...");
    const usersWithElection = await User.countDocuments({ electionId: { $exists: true } });
    const candidatesWithElection = await Candidate.countDocuments({ electionId: { $exists: true } });
    const legacyElections = await Election.countDocuments({ isLegacy: true });

    console.log(`\n📊 Rollback Summary:`);
    console.log(`─────────────────────────────────────────`);
    console.log(`Users with electionId: ${usersWithElection}`);
    console.log(`Candidates with electionId: ${candidatesWithElection}`);
    console.log(`Legacy elections remaining: ${legacyElections}`);
    console.log(`─────────────────────────────────────────`);

    if (usersWithElection === 0 && candidatesWithElection === 0 && legacyElections === 0) {
      console.log("\n✅ Rollback completed successfully!");
      console.log("System restored to single-election state\n");
    } else {
      console.log("\n⚠️  Warning: Some documents may not have been rolled back");
    }

  } catch (error) {
    console.error("❌ Rollback failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
}

// Run rollback
rollback();
