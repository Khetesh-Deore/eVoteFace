require('dotenv').config();
const mongoose = require('mongoose');
const Candidate = require('../models/Candidate');

async function cleanDuplicates() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all candidates
    const candidates = await Candidate.find({}).sort({ createdAt: 1 });
    console.log(`\n📊 Total candidates: ${candidates.length}`);

    // Group by electionId and onChainId
    const groups = {};
    candidates.forEach(c => {
      const key = `${c.electionId}_${c.onChainId}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(c);
    });

    // Find duplicates
    let duplicateCount = 0;
    let removedCount = 0;

    for (const key in groups) {
      const group = groups[key];
      if (group.length > 1) {
        duplicateCount++;
        console.log(`\n⚠️  Found ${group.length} duplicates for ${key}:`);
        
        // Keep the first one (oldest), remove the rest
        const [keep, ...remove] = group;
        console.log(`   ✓ Keeping: ${keep._id} (${keep.name}) - created ${keep.createdAt}`);
        
        for (const candidate of remove) {
          console.log(`   ✗ Removing: ${candidate._id} (${candidate.name}) - created ${candidate.createdAt}`);
          await Candidate.deleteOne({ _id: candidate._id });
          removedCount++;
        }
      }
    }

    if (duplicateCount === 0) {
      console.log('\n✅ No duplicates found!');
    } else {
      console.log(`\n✅ Cleaned up ${removedCount} duplicate candidates from ${duplicateCount} groups`);
    }

    // Show final count by election
    const pipeline = [
      {
        $group: {
          _id: '$electionId',
          count: { $sum: 1 },
          candidates: { $push: { name: '$name', onChainId: '$onChainId' } }
        }
      }
    ];
    
    const summary = await Candidate.aggregate(pipeline);
    console.log('\n📊 Candidates by election:');
    summary.forEach(s => {
      console.log(`\n  Election ${s._id}: ${s.count} candidates`);
      s.candidates.forEach(c => {
        console.log(`    - ${c.name} (onChainId: ${c.onChainId})`);
      });
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

cleanDuplicates();
