require('dotenv').config();
const mongoose = require('mongoose');

const fix = async () => {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: 'evoteface' });
  
  const db = mongoose.connection.db;
  const collection = db.collection('candidates');
  
  console.log('Dropping incorrect indexes...\n');
  
  // Drop all wrong indexes
  const indexesToDrop = [
    'onChainId_1',
    'onChainId_1_election_1',
    'election_1',
    'onChainId_1_electionId_1',
    'electionId_1',
    'contractAddress_1'
  ];
  
  for (const indexName of indexesToDrop) {
    try {
      await collection.dropIndex(indexName);
      console.log(`✓ Dropped ${indexName}`);
    } catch (e) {
      console.log(`  ${indexName} does not exist`);
    }
  }
  
  console.log('\n✓ Cleanup complete!');
  console.log('\nRemaining indexes:');
  const indexes = await collection.indexes();
  indexes.forEach(idx => console.log(`  - ${idx.name}`));
  
  await mongoose.disconnect();
  process.exit(0);
};

fix().catch(e => { console.error(e); process.exit(1); });
