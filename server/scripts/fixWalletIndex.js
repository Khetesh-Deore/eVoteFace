require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { MongoClient } = require("mongodb");

const run = async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const col = client.db("evoteface").collection("users");

  // List all indexes
  const indexes = await col.indexes();
  console.log("Current indexes:", indexes.map(i => i.name));

  // Drop ALL wallet-related indexes
  for (const idx of indexes) {
    if (idx.key && idx.key.walletAddress !== undefined) {
      try {
        await col.dropIndex(idx.name);
        console.log("✅ Dropped index:", idx.name);
      } catch (e) {
        console.log("Could not drop:", idx.name, e.message);
      }
    }
  }

  // Set walletAddress to undefined (remove the field entirely from docs with no wallet)
  const r = await col.updateMany(
    { $or: [{ walletAddress: "" }, { walletAddress: null }] },
    { $unset: { walletAddress: "" } }
  );
  console.log(`✅ Removed walletAddress field from ${r.modifiedCount} users`);

  // Recreate correct sparse unique index (skips documents where field doesn't exist)
  await col.createIndex({ walletAddress: 1 }, { unique: true, sparse: true, name: "walletAddress_sparse" });
  console.log("✅ Created sparse unique index");

  await client.close();
  process.exit(0);
};

run().catch(e => { console.error(e.message); process.exit(1); });
