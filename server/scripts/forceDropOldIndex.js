require('dotenv').config();
const mongoose = require('mongoose');

async function forceDropIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('candidates');

    // List all indexes
    const indexes = await collection.indexes();
    console.log('\n📋 Current indexes:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.name}:`, idx.key);
    });

    // Try to drop onChainId_1 index
    try {
      await collection.dropIndex('onChainId_1');
      console.log('\n✅ Successfully dropped onChainId_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('\nℹ️  onChainId_1 index does not exist');
      } else {
        console.error('\n❌ Error dropping index:', error.message);
      }
    }

    // Create the correct compound index
    try {
      await collection.createIndex(
        { electionId: 1, onChainId: 1 },
        { unique: true, sparse: true, name: 'electionId_1_onChainId_1' }
      );
      console.log('✅ Created compound index: electionId_1_onChainId_1');
    } catch (error) {
      if (error.code === 85 || error.code === 86) {
        console.log('ℹ️  Compound index already exists');
      } else {
        console.error('❌ Error creating index:', error.message);
      }
    }

    // List final indexes
    const finalIndexes = await collection.indexes();
    console.log('\n📋 Final indexes:');
    finalIndexes.forEach(idx => {
      console.log(`  - ${idx.name}:`, idx.key);
    });

    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

forceDropIndex();
