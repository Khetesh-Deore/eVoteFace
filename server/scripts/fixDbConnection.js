/**
 * eVoteFace — Database Connection Diagnostic & Fix Script
 *
 * Run this whenever MongoDB won't connect:
 *   node scripts/fixDbConnection.js
 *
 * What it does:
 *   1. Checks MONGODB_URI is set in .env
 *   2. Tests if your DNS can resolve MongoDB SRV records
 *   3. Tests if port 27017 is reachable
 *   4. Tries connecting with default DNS
 *   5. If that fails, tries Google DNS (8.8.8.8) — the known fix
 *   6. Reports exactly what is wrong and how to fix it
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const dns = require("dns");
const net = require("net");
const mongoose = require("mongoose");

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const RESET = "\x1b[0m";

const ok = (msg) => console.log(`${GREEN}✅ ${msg}${RESET}`);
const fail = (msg) => console.log(`${RED}❌ ${msg}${RESET}`);
const warn = (msg) => console.log(`${YELLOW}⚠️  ${msg}${RESET}`);
const info = (msg) => console.log(`${BLUE}ℹ️  ${msg}${RESET}`);
const sep = () => console.log("─".repeat(60));

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Step 1: Check .env ──────────────────────────────────────
function checkEnv() {
  sep();
  console.log("STEP 1: Checking environment variables");
  sep();

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    fail("MONGODB_URI is not set in server/.env");
    console.log("\nFix: Add this to server/.env:");
    console.log('  MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?appName=xmega');
    return null;
  }

  if (!uri.startsWith("mongodb+srv://") && !uri.startsWith("mongodb://")) {
    fail("MONGODB_URI has wrong format. Must start with mongodb+srv:// or mongodb://");
    return null;
  }

  if (!uri.includes("@")) {
    fail("MONGODB_URI is missing credentials (no @ symbol found)");
    return null;
  }

  if (uri.includes(" ")) {
    fail("MONGODB_URI has spaces — remove them");
    return null;
  }

  ok(`MONGODB_URI found (length: ${uri.length})`);

  // Extract cluster hostname
  const match = uri.match(/@([^/?]+)/);
  const host = match ? match[1] : null;
  if (host) ok(`Cluster host: ${host}`);

  return uri;
}

// ── Step 2: Test SRV DNS with default DNS ───────────────────
async function testDefaultDns(uri) {
  sep();
  console.log("STEP 2: Testing SRV DNS with your network's default DNS");
  sep();

  const match = uri.match(/mongodb\+srv:\/\/[^@]+@([^/?]+)/);
  if (!match) {
    warn("Could not extract hostname from URI — skipping DNS test");
    return false;
  }

  const host = match[1];
  const srvName = `_mongodb._tcp.${host}`;

  return new Promise((resolve) => {
    dns.resolveSrv(srvName, (err, addresses) => {
      if (err) {
        fail(`Default DNS cannot resolve SRV record: ${err.message}`);
        warn("This is the root cause of querySrv ECONNREFUSED");
        info("Your ISP/router DNS is blocking MongoDB SRV lookups");
        resolve(false);
      } else {
        ok(`Default DNS resolved SRV — found ${addresses.length} server(s)`);
        resolve(true);
      }
    });
  });
}

// ── Step 3: Test SRV DNS with Google DNS ────────────────────
async function testGoogleDns(uri) {
  sep();
  console.log("STEP 3: Testing SRV DNS with Google DNS (8.8.8.8)");
  sep();

  // Temporarily switch to Google DNS
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
  dns.setDefaultResultOrder("ipv4first");

  const match = uri.match(/mongodb\+srv:\/\/[^@]+@([^/?]+)/);
  if (!match) {
    warn("Could not extract hostname — skipping");
    return false;
  }

  const host = match[1];
  const srvName = `_mongodb._tcp.${host}`;

  return new Promise((resolve) => {
    dns.resolveSrv(srvName, (err, addresses) => {
      if (err) {
        fail(`Google DNS also failed: ${err.message}`);
        info("This may be a firewall blocking port 53 (DNS) entirely");
        resolve(false);
      } else {
        ok(`Google DNS resolved SRV — found ${addresses.length} server(s)`);
        addresses.forEach((a) => info(`  → ${a.name}:${a.port}`));
        resolve(true);
      }
    });
  });
}

// ── Step 4: Test port 27017 ─────────────────────────────────
async function testPort() {
  sep();
  console.log("STEP 4: Testing TCP connection to port 27017");
  sep();

  const host = "ac-5grzhv2-shard-00-00.q8vckf1.mongodb.net";

  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(8000);

    socket.connect(27017, host, () => {
      ok(`Port 27017 is reachable on ${host}`);
      socket.destroy();
      resolve(true);
    });

    socket.on("error", (err) => {
      fail(`Port 27017 is BLOCKED: ${err.message}`);
      warn("Your network/firewall is blocking outbound port 27017");
      info("Try: mobile hotspot, different WiFi, or VPN");
      socket.destroy();
      resolve(false);
    });

    socket.on("timeout", () => {
      fail("Port 27017 connection timed out");
      socket.destroy();
      resolve(false);
    });
  });
}

// ── Step 5: Try actual MongoDB connection ───────────────────
async function tryConnect(uri, useGoogleDns) {
  sep();
  console.log(`STEP 5: Attempting MongoDB connection ${useGoogleDns ? "(with Google DNS)" : "(with default DNS)"}`);
  sep();

  if (useGoogleDns) {
    dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
    dns.setDefaultResultOrder("ipv4first");
  }

  try {
    await mongoose.connect(uri, {
      dbName: "evoteface",
      serverSelectionTimeoutMS: 20000,
      family: 4,
    });

    ok(`MongoDB connected! Host: ${mongoose.connection.host}`);
    await mongoose.disconnect();
    return true;
  } catch (err) {
    fail(`Connection failed: ${err.message}`);
    return false;
  }
}

// ── Main ────────────────────────────────────────────────────
async function main() {
  console.log("\n" + "═".repeat(60));
  console.log("  eVoteFace — MongoDB Connection Diagnostic Tool");
  console.log("═".repeat(60) + "\n");

  // Step 1
  const uri = checkEnv();
  if (!uri) {
    console.log("\n❌ Cannot continue — fix .env first\n");
    process.exit(1);
  }

  // Step 2
  const defaultDnsWorks = await testDefaultDns(uri);

  // Step 3
  const googleDnsWorks = await testGoogleDns(uri);

  // Step 4
  const portOpen = await testPort();

  // Step 5 — try connecting
  let connected = false;

  if (defaultDnsWorks) {
    connected = await tryConnect(uri, false);
  }

  if (!connected && googleDnsWorks) {
    connected = await tryConnect(uri, true);
  }

  // ── Final Report ──────────────────────────────────────────
  sep();
  console.log("DIAGNOSIS REPORT");
  sep();

  if (connected) {
    ok("MongoDB Atlas is reachable and working!");
    console.log("");

    if (!defaultDnsWorks && googleDnsWorks) {
      warn("Your network DNS blocks MongoDB SRV lookups");
      info("The fix is already applied in server/config/db.js");
      info("Google DNS (8.8.8.8) is used automatically — no action needed");
    } else {
      ok("Everything is working normally");
    }
  } else {
    fail("Could not connect to MongoDB Atlas");
    console.log("\nPossible causes and fixes:\n");

    if (!portOpen) {
      console.log("  1. PORT BLOCKED");
      console.log("     Your network blocks outbound port 27017");
      console.log("     Fix: Use mobile hotspot or a different network\n");
    }

    if (!googleDnsWorks) {
      console.log("  2. DNS COMPLETELY BLOCKED");
      console.log("     Both your DNS and Google DNS fail");
      console.log("     Fix: Check firewall settings or use VPN\n");
    }

    console.log("  3. ATLAS IP WHITELIST");
    console.log("     Go to cloud.mongodb.com → Network Access");
    console.log("     Add 0.0.0.0/0 to allow all IPs\n");

    console.log("  4. WRONG CREDENTIALS");
    console.log("     Check username/password in MONGODB_URI in server/.env\n");

    console.log("  5. CLUSTER PAUSED");
    console.log("     Go to cloud.mongodb.com → your cluster");
    console.log("     Click Resume if it shows as Paused\n");
  }

  sep();
  console.log("");
  process.exit(connected ? 0 : 1);
}

main().catch((err) => {
  console.error("Script error:", err.message);
  process.exit(1);
});
