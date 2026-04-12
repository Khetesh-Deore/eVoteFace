const mongoose = require("mongoose");
require("dotenv").config();

const User = require("../models/User");
const Candidate = require("../models/Candidate");
const Election = require("../models/Election");

/**
 * Verification Script: Check migration status
 * 
 * This script verifies:
 * 1. All users have electionId
 * 2. All candidates have electionId
 * 3. Elections have contractAddress
 * 4. No orphaned data
 */

async function verify() {
  try {
    console.log("🔍 Verifying migration status...\n");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Check Elections
    console.log("📋 Elections:");
    const elections = await Election.find();
    console.log(`Total elections: ${elections.length}`);
    
    for (const election of elections) {
      console.log(`\n  Election: ${election.title}`);
      console.log(`  ID: ${election._id}`);
      console.log(`  Contract: ${election.contractAddress}`);
      console.log(`  Phase: ${election.phase}`);
      console.log(`  Legacy: ${election.isLegacy || false}`);
      
      // Count related data
      const userCount = await User.countDocuments({ electionId: election._id });
      const candidateCount = await Candidate.countDocuments({ electionId: election._id });
      
      console.log(`  Users: ${userCount}`);
      console.log(`  Candidates: ${candidateCount}`);
    }

    // Check Users
    console.log("\n\n👥 Users:");
    const totalUsers = await User.countDocuments();
    const usersWithElection = await User.countDocuments({ electionId: { $exists: true, $ne: null } });
    const usersWithoutElection = await User.countDocuments({ electionId: { $exists: false } });
    const legacyUsers = await User.countDocuments({ isLegacy: true });
    
    console.log(`Total users: ${totalUsers}`);
    console.log(`With electionId: ${usersWithElection}`);
    console.log(`Without electionId: ${usersWithoutElection}`);
    console.log(`Legacy users: ${legacyUsers}`);

    // Check Candidates
    console.log("\n🎯 Candidates:");
    const totalCandidates = await Candidate.countDocuments();
    const candidatesWithElection = await Candidate.countDocuments({ electionId: { $exists: true, $ne: null } });
    const candidatesWithoutElection = await Candidate.countDocuments({ electionId: { $exists: false } });
    const legacyCandidates = await Candidate.countDocuments({ isLegacy: true });
    
    console.log(`Total candidates: ${totalCandidates}`);
    console.log(`With electionId: ${candidatesWithElection}`);
    console.log(`Without electionId: ${candidatesWithoutElection}`);
    console.log(`Legacy candidates: ${legacyCandidates}`);

    // Check for orphaned data
    console.log("\n🔗 Checking for orphaned data...");
    
    const usersWithInvalidElection = await User.find({ 
      electionId: { $exists: true, $ne: null } 
    }).populate('electionId');
    
    let orphanedUsers = 0;
    for (const user of usersWithInvalidElection) {
      if (!user.electionId) {
        orphanedUsers++;
      }
    }
    
    const candidatesWithInvalidElection = await Candidate.find({ 
      electionId: { $exists: true, $ne: null } 
    }).populate('electionId');
    
    let orphanedCandidates = 0;
    for (const candidate of candidatesWithInvalidElection) {
      if (!candidate.electionId) {
        orphanedCandidates++;
      }
    }
    
    console.log(`Orphaned users: ${orphanedUsers}`);
    console.log(`Orphaned candidates: ${orphanedCandidates}`);

    // Final Status
    console.log("\n" + "=".repeat(50));
    console.log("📊 MIGRATION STATUS");
    console.log("=".repeat(50));
    
    const isFullyMigrated = 
      usersWithoutElection === 0 && 
      candidatesWithoutElection === 0 &&
      orphanedUsers === 0 &&
      orphanedCandidates === 0;
    
    if (isFullyMigrated) {
      console.log("✅ Migration is COMPLETE and VALID");
      console.log("All data properly linked to elections");
    } else {
      console.log("⚠️  Migration is INCOMPLETE or has ISSUES");
      if (usersWithoutElection > 0) {
        console.log(`  - ${usersWithoutElection} users need electionId`);
      }
      if (candidatesWithoutElection > 0) {
        console.log(`  - ${candidatesWithoutElection} candidates need electionId`);
      }
      if (orphanedUsers > 0) {
        console.log(`  - ${orphanedUsers} users have invalid electionId`);
      }
      if (orphanedCandidates > 0) {
        console.log(`  - ${orphanedCandidates} candidates have invalid electionId`);
      }
      console.log("\n💡 Run: node server/scripts/migrateElections.js");
    }
    console.log("=".repeat(50) + "\n");

  } catch (error) {
    console.error("❌ Verification failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
}

// Run verification
verify();
