/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import type { Request, Response } from "express";
import Razorpay from "razorpay";

const router = express.Router();

// ✅ DON'T create instance here - env vars might not be loaded yet
// Instead, create inside the route handler

router.post("/create-order", async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;

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
      receipt: `receipt_${Date.now()}`,
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

export default router;
