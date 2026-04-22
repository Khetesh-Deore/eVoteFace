/**
 * Seeds both admin accounts — wipes any existing admin docs first.
 *   node scripts/seedAdmin.js
 *
 * Accounts created:
 *   superadmin@evoteface.com  / SuperAdmin@2025  (role: superadmin)
 *   voteradmin@evoteface.com  / VoterAdmin@2025  (role: admin)
 *
 * NOTE: Do NOT pre-hash passwords here. The Admin model's pre-save hook
 * handles hashing automatically. Passing a plain password to Admin.create()
 * is correct and intentional.
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const Admin = require("../models/Admin");

const admins = [
  {
    fullName: "eVoteFace Super Admin",
    email: "superadmin@evoteface.com",
    password: "SuperAdmin@2025",   // plain — model pre-save hook hashes it
    role: "superadmin",
  },
  {
    fullName: "eVoteFace Voter Admin",
    email: "voteradmin@evoteface.com",
    password: "VoterAdmin@2025",   // plain — model pre-save hook hashes it
    role: "admin",
  },
];

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: "evoteface" });
  console.log("✅ Connected to MongoDB");

  // Show what's currently in the DB
  const existing = await Admin.find({}).select("email role");
  console.log(
    "\n📋 Existing admins:",
    existing.length
      ? existing.map((a) => `${a.email} (${a.role})`).join(", ")
      : "none"
  );

  // Wipe all existing admins
  const deleted = await Admin.deleteMany({});
  console.log(`🗑️  Deleted ${deleted.deletedCount} existing admin(s)\n`);

  // Create fresh — plain passwords, pre-save hook hashes them
  for (const data of admins) {
    const admin = new Admin(data);
    await admin.save();                // triggers pre-save bcrypt hash
    console.log(`✅ Created: ${admin.email}`);
    console.log(`   Password: ${data.password}`);
    console.log(`   Role:     ${admin.role}\n`);
  }

  console.log("🎉 Seed complete. Login with:");
  console.log("   Super Admin → superadmin@evoteface.com / SuperAdmin@2025");
  console.log("   Voter Admin → voteradmin@evoteface.com / VoterAdmin@2025");

  process.exit(0);
};

seed().catch((e) => {
  console.error("❌ Seed failed:", e.message);
  process.exit(1);
});
