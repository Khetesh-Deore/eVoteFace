/**
 * Reset election state in MongoDB for fresh start
 * Run: node scripts/resetElection.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const User = require("../models/User");
const Candidate = require("../models/Candidate");
const Election = require("../models/Election");
const OTP = require("../models/OTP");

const reset = async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: "evoteface" });

  // Clear candidates (new contract = new candidates)
  const cDel = await Candidate.deleteMany({});
  console.log(`✅ Deleted ${cDel.deletedCount} candidates`);

  // Clear elections
  const eDel = await Election.deleteMany({});
  console.log(`✅ Deleted ${eDel.deletedCount} election records`);

  // Clear all OTPs
  const oDel = await OTP.deleteMany({});
  console.log(`✅ Deleted ${oDel.deletedCount} OTPs`);

  // Reset all voters: clear hasVoted, walletAddress, faceEncoding for test accounts
  // Keep real voter (7894561230) face encoding but reset voting status
  const vReset = await User.updateMany(
    { role: "voter" },
    { $set: { hasVoted: false, votedAt: null } }
  );
  console.log(`✅ Reset hasVoted for ${vReset.modifiedCount} voters`);

  // Remove test voters (keep only real ones)
  const testVoterIDs = ["VTR200", "VTR099", "VTR011", "VTR003", "VTR002", "VTR001"];
  const tDel = await User.deleteMany({ voterID: { $in: testVoterIDs } });
  console.log(`✅ Removed ${tDel.deletedCount} test voters`);

  const remaining = await User.find({ role: "voter" }).select("fullName voterID email");
  console.log("\nRemaining voters:");
  remaining.forEach(v => console.log(`  - ${v.fullName} (${v.voterID}) ${v.email}`));

  console.log("\n✅ Election reset complete. New contract:", process.env.CONTRACT_ADDRESS);
  process.exit(0);
};

reset().catch(e => { console.error(e); process.exit(1); });
