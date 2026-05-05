/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import type { Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";

const router = express.Router();

// ✅ DON'T create instance here - env vars might not be loaded yet
// Instead, create inside the route handler

router.post("/create-order", async (req: Request, res: Response) => {
  try {
    const { amount, receipt } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // ✅ Create Razorpay instance HERE (after env vars are loaded)
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    console.log("Creating order with credentials:", 
      process.env.RAZORPAY_KEY_ID?.slice(0, 15) + "..."
    );

    const options = {
      amount: amount,
      currency: "INR",
      receipt: String(receipt || `receipt_${Date.now()}`),
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    console.log("✅ Order created:", order.id);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: any) {
    console.error("❌ Razorpay error:", error);
    res.status(500).json({
      error: "Failed to create order",
      details: error.error?.description || error.message,
    });
  }
});

router.post("/verify-payment", async (req: Request, res: Response) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing Razorpay verification fields" });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(500).json({ error: "Razorpay secret not configured" });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;
    if (!isValid) {
      return res.status(400).json({ verified: false, error: "Invalid payment signature" });
    }

    return res.json({ verified: true });
  } catch (error: any) {
    console.error("❌ Razorpay verify error:", error);
    return res.status(500).json({
      error: "Failed to verify payment",
      details: error?.message || "Unknown error",
    });
  }
});

export default router;
