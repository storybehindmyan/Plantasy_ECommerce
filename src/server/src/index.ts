import dotenv from "dotenv";
import path from "path";

// ✅ Fix: Go up ONE level from src/index.ts to reach server/.env
const envPath = path.resolve(__dirname, "../.env");
console.log("📁 Loading .env from:", envPath);
dotenv.config({ path: envPath });

// ✅ Validate required environment variables
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
  console.error("❌ ERROR: Razorpay credentials not found in .env file!");
  console.error("📁 Looking for .env at:", envPath);
  console.error("Please create .env file with:");
  console.error("RAZORPAY_KEY_ID=your_key_here");
  console.error("RAZORPAY_KEY_SECRET=your_secret_here");
  process.exit(1);
}

// ✅ Set them explicitly
process.env.RAZORPAY_KEY_ID = RAZORPAY_KEY_ID;
process.env.RAZORPAY_KEY_SECRET = RAZORPAY_KEY_SECRET;

console.log("✅ Environment variables loaded:");
console.log("   PORT:", process.env.PORT || 5000);
console.log("   RAZORPAY_KEY_ID:", RAZORPAY_KEY_ID.slice(0, 15) + "...");
console.log("   KEY TYPE:", RAZORPAY_KEY_ID.startsWith("rzp_live_") ? "🔴 LIVE" : "🟢 TEST");

import express from "express";
import cors from "cors";
import razorpayRoutes from "./routes/razorpay";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  console.log(`📡 ${req.method} ${req.url}`);
  next();
});

app.use("/api/razorpay", razorpayRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "Plantasy Backend API is running" });
});

app.listen(PORT, () => {
  console.log(`\n🚀 ===============================================`);
  console.log(`   Server running on http://localhost:${PORT}`);
  console.log(`   Razorpay: ${RAZORPAY_KEY_ID.startsWith("rzp_live_") ? "🔴 LIVE MODE" : "🟢 TEST MODE"}`);
  console.log(`===============================================\n`);
});
