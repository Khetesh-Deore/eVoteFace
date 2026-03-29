import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Candidate from '../models/Candidate.js';
import connectDB from '../config/db.js';

dotenv.config();

const candidates = [
  { name: 'Candidate A', party: 'Party A', partySymbol: '🔔' },
  { name: 'Candidate B', party: 'Party B', partySymbol: '🌾' },
  { name: 'Candidate C', party: 'Party C', partySymbol: '🔱' },
];

const seedCandidates = async () => {
  try {
    await connectDB();
    await Candidate.deleteMany({});
    await Candidate.insertMany(candidates);
    console.log('Candidates seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding candidates:', error);
    process.exit(1);
  }
};

seedCandidates();
