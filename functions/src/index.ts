import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";
import razorpayRouter from "./routes/razorpay";
import shippingRouter from "./routes/shipping";
import ordersRouter from "./routes/orders";
import whatsappRouter from "./routes/whatsapp";
import delhiveryRouter from "./routes/delhivery";
import emailTestRouter from "./routes/emailTest";

admin.initializeApp();

const app = express();

const ALLOWED_ORIGINS = [
  "https://plantasy.co.in",
  "https://www.plantasy.co.in",
  "https://plantasy-bharat.web.app",
  "https://plantasy-bharat.firebaseapp.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin) || process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.use("/api/razorpay", razorpayRouter);
app.use("/api/shipping", shippingRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/whatsapp", whatsappRouter);
app.use("/api/delhivery", delhiveryRouter);
app.use("/api/email-test", emailTestRouter);

app.get("/", (_req, res) => {
  res.json({ message: "Plantasy Backend API is running" });
});

// v2
export const api = onRequest(app);
