import * as admin from "firebase-admin";
import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";
import razorpayRouter from "./routes/razorpay";
import shippingRouter from "./routes/shipping";

admin.initializeApp();

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

app.use("/api/razorpay", razorpayRouter);
app.use("/api/shipping", shippingRouter);

app.get("/", (_req, res) => {
  res.json({ message: "Plantasy Backend API is running" });
});

export const api = onRequest(app);
