import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env with priority:
// 1) repo root .env (preferred for unified deployment)
// 2) server-local .env (fallback)
const candidateEnvPaths = [
  path.resolve(process.cwd(), "../../.env"),
  path.resolve(process.cwd(), ".env"),
  path.resolve(__dirname, "../../.env"),
  path.resolve(__dirname, "../.env"),
];
let envPath = "";
for (const p of candidateEnvPaths) {
  if (!fs.existsSync(p)) continue;
  const rawEnv = fs.readFileSync(p);
  let envText = "";
  // Handle UTF-16LE encoded .env files (common on Windows editors)
  if (rawEnv.length >= 2 && rawEnv[0] === 0xff && rawEnv[1] === 0xfe) {
    envText = rawEnv.toString("utf16le");
  } else {
    envText = rawEnv.toString("utf8");
  }
  const parsed = dotenv.parse(envText);
  if (parsed.RAZORPAY_KEY_ID && parsed.RAZORPAY_KEY_SECRET) {
    envPath = p;
    for (const [k, v] of Object.entries(parsed)) {
      if (!process.env[k]) process.env[k] = v;
    }
    break;
  }
}
if (!envPath) {
  envPath = candidateEnvPaths.find((p) => fs.existsSync(p)) || candidateEnvPaths[0];
}
console.log("📁 Loading .env from:", envPath);

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
import razorpayRoutes from "./routes/razorpay.js";
import shippingRoutes from "./routes/shipping.js";

const app = express();
const PORT = process.env.PORT || 3000;

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
app.use("/api/shipping", shippingRoutes);

app.get("/", (_req, res) => {
  res.json({ message: "Plantasy Backend API is running" });
});

app.listen(PORT, () => {
  console.log(`\n🚀 ===============================================`);
  console.log(`   Server running on http://localhost:${PORT}`);
  console.log(`   Razorpay: ${RAZORPAY_KEY_ID.startsWith("rzp_live_") ? "🔴 LIVE MODE" : "🟢 TEST MODE"}`);
  console.log(`===============================================\n`);
});
