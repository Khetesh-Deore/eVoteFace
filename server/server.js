require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");

const app = express();

// ── Connect Database ──
connectDB();

// ── Middleware ──
app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? process.env.CLIENT_URL
    : "*",
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ──
app.use("/api/auth",    require("./routes/auth"));
app.use("/api/voters",  require("./routes/voters"));
app.use("/api/otp",     require("./routes/otp"));
app.use("/api/face",    require("./routes/face"));
app.use("/api/votes",   require("./routes/votes"));
app.use("/api/admin",   require("./routes/admin"));

// ── Health check ──
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "eVoteFace API", timestamp: new Date() });
});

// ── 404 handler ──
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// ── Error handler ──
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ eVoteFace server running on port ${PORT}`);
});
