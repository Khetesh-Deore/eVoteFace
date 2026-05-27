const mongoose = require("mongoose");
const dns = require("dns");
const { Resolver } = require("dns").promises;

// Use Google DNS to resolve SRV records — fixes querySrv ECONNREFUSED
// on networks where the default DNS blocks MongoDB SRV lookups
dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
dns.setDefaultResultOrder("ipv4first");

const RETRY_DELAY_MS = 5000;
const MAX_RETRIES = 5;

const connectDB = async (retryCount = 0) => {
  try {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error("MONGODB_URI is not set in .env file");
    }

    const conn = await mongoose.connect(uri, {
      dbName: "evoteface",
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      retryWrites: true,
      family: 4,
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB disconnected. Reconnecting in 5s...");
      setTimeout(() => connectDB(), RETRY_DELAY_MS);
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ MongoDB error:", err.message);
    });

    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconnected");
    });

  } catch (error) {
    console.error(`❌ MongoDB connection failed (attempt ${retryCount + 1}): ${error.message}`);

    if (retryCount < MAX_RETRIES) {
      console.log(`🔄 Retrying in ${RETRY_DELAY_MS / 1000}s...`);
      setTimeout(() => connectDB(retryCount + 1), RETRY_DELAY_MS);
    } else {
      console.error("❌ All retries exhausted. Check MONGODB_URI and Atlas Network Access.");
      process.exit(1);
    }
  }
};

module.exports = connectDB;
