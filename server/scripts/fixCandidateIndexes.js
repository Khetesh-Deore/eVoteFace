require('dotenv').config();
const mongoose = require('mongoose');
const Candidate = require('../models/Candidate');

async function fixIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get all indexes
    const indexes = await Candidate.collection.getIndexes();
    console.log('\n📋 Current indexes:', Object.keys(indexes));

    // Drop the old onChainId_1 index if it exists
    try {
      await Candidate.collection.dropIndex('onChainId_1');
      console.log('✅ Dropped old onChainId_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('ℹ️  onChainId_1 index does not exist (already removed)');
      } else {
        console.error('❌ Error dropping index:', error.message);
      }
    }

    // Ensure correct indexes exist
    await Candidate.syncIndexes();
    console.log('✅ Synced indexes with model definition');

    // Show final indexes
    const finalIndexes = await Candidate.collection.getIndexes();
    console.log('\n📋 Final indexes:');
    Object.keys(finalIndexes).forEach(key => {
      console.log(`  - ${key}:`, finalIndexes[key]);
    });

    console.log('\n✅ Index fix complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixIndexes();
