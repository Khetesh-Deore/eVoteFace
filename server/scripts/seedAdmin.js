/**
 * Run once to create the first admin account:
 * node scripts/seedAdmin.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: "evoteface" });

  const existing = await Admin.findOne({ email: "admin@evoteface.com" });
  if (existing) {
    console.log("Admin already exists:", existing.email);
    process.exit(0);
  }

  const hashed = await bcrypt.hash("Admin@2025", 12);
  const admin = await Admin.create({
    fullName: "eVoteFace Admin",
    email: "admin@evoteface.com",
    password: hashed,
    role: "superadmin",
  });

  console.log("✅ Admin created:");
  console.log("   Email:   ", admin.email);
  console.log("   Password: Admin@2025");
  console.log("   Role:    ", admin.role);
  process.exit(0);
};

seed().catch((e) => { console.error(e); process.exit(1); });
