import express from "express";
import type { Request, Response, NextFunction } from "express";
import * as admin from "firebase-admin";
import { EmailService } from "../services/EmailService";

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

// POST /api/email-test/send
// Body: { type: "confirmed"|"packed"|"shipped"|"delivered", email: string }
router.post("/send", verifyAuth, async (req: Request, res: Response) => {
  const { type, email } = req.body as { type: string; email: string };

  if (!email || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email address required" });
  }

  const orderId = "TEST-ORDER-001";
  const name = "Test Customer";
  const waybill = "1234567890";
  const trackingUrl = "https://www.delhivery.com/track-v2/package/1234567890";
  const reviewUrl = "https://plantasy.co.in/review/TEST-ORDER-001";

  try {
    switch (type) {
      case "confirmed":
        await EmailService.sendOrderConfirmed(email, name, orderId, 999);
        break;
      case "packed":
        await EmailService.sendOrderPacked(email, name, orderId, waybill, trackingUrl);
        break;
      case "shipped":
        await EmailService.sendOrderShipped(email, name, orderId, waybill, trackingUrl);
        break;
      case "delivered":
        await EmailService.sendOrderDelivered(email, name, orderId, reviewUrl);
        break;
      default:
        return res.status(400).json({ error: `Unknown type: ${type}. Use confirmed|packed|shipped|delivered` });
    }

    return res.json({ success: true, message: `Test email "${type}" sent to ${email}` });
  } catch (err: any) {
    console.error("[email-test] Error:", err);
    return res.status(500).json({ error: err?.message || "Failed to send email" });
  }
});

export default router;
