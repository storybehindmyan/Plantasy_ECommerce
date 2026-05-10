import express from "express";
import type { Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";

const router = express.Router();

const getCredentials = () => ({
  keyId: process.env.RAZORPAY_KEY_ID || "",
  keySecret: process.env.RAZORPAY_KEY_SECRET || "",
});

router.post("/create-order", async (req: Request, res: Response) => {
  try {
    const { amount, receipt } = req.body;

    if (!amount || amount < 1) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const { keyId, keySecret } = getCredentials();
    if (!keyId || !keySecret) {
      return res.status(500).json({ error: "Razorpay credentials not configured" });
    }

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: String(receipt || `receipt_${Date.now()}`),
    }) as any;

    return res.json({ orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (error: any) {
    console.error("Razorpay create-order error:", error);
    return res.status(500).json({
      error: "Failed to create order",
      details: error.error?.description || error.message,
    });
  }
});

router.post("/verify-payment", async (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: "Missing Razorpay verification fields" });
    }

    const { keySecret } = getCredentials();
    if (!keySecret) {
      return res.status(500).json({ error: "Razorpay secret not configured" });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ verified: false, error: "Invalid payment signature" });
    }

    return res.json({ verified: true });
  } catch (error: any) {
    console.error("Razorpay verify-payment error:", error);
    return res.status(500).json({
      error: "Failed to verify payment",
      details: error?.message || "Unknown error",
    });
  }
});

export default router;
