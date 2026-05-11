import express from "express";
import type { Request, Response, NextFunction } from "express";
import * as admin from "firebase-admin";
import { OrderService } from "../services/OrderService";

const router = express.Router();

const verifyAuth = async (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: missing token" });
  }
  try {
    await admin.auth().verifyIdToken(auth.split(" ")[1]);
    return next();
  } catch {
    return res.status(401).json({ error: "Unauthorized: invalid token" });
  }
};

router.post("/paid", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { orderId, phone, name, email, amount } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "orderId is required" });
    }

    const { waybill, trackingUrl } = await OrderService.onOrderPaid(
      orderId,
      phone || "",
      name || "",
      Number(amount) || 0,
      email || ""
    );

    return res.json({ success: true, waybill, trackingUrl });
  } catch (error: any) {
    console.error("POST /api/orders/paid error:", error);
    return res.status(500).json({
      error: "Failed to process order",
      details: error.message || "Unknown error",
    });
  }
});

router.post("/confirm", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: "orderId is required" });
    const result = await OrderService.onOrderConfirm(orderId);
    return res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("POST /api/orders/confirm error:", error);
    return res.status(500).json({ error: error.message });
  }
});

router.post("/shipped", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: "orderId is required" });
    await OrderService.onOrderShipped(orderId);
    return res.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/orders/shipped error:", error);
    return res.status(500).json({ error: error.message });
  }
});

router.post("/delivered", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: "orderId is required" });
    await OrderService.onOrderDelivered(orderId);
    return res.json({ success: true });
  } catch (error: any) {
    console.error("POST /api/orders/delivered error:", error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
