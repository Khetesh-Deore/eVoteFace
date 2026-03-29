import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';
import connectDB from '../config/db.js';

dotenv.config();

const seedAdmin = async () => {
  try {
    await connectDB();
    await Admin.deleteMany({});
    const admin = new Admin({
      username: 'admin',
      password: 'admin123',
      role: 'superadmin',
    });
    await admin.save();
    console.log('Admin seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
