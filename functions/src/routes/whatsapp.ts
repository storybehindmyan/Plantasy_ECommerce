import express from "express";
import type { Request, Response } from "express";
import { WhatsAppService } from "../services/WhatsAppService";
import { OrderService } from "../services/OrderService";

const router = express.Router();

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "plantasy_verify";

router.get("/webhook", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("WhatsApp webhook verified");
    return res.status(200).send(challenge);
  }
  return res.status(403).json({ error: "Verification failed" });
});

router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const body = req.body;

    if (body?.object !== "whatsapp_business_account") {
      return res.sendStatus(404);
    }

    const changes = body?.entry?.[0]?.changes?.[0]?.value;
    const statuses = changes?.statuses;

    if (statuses?.length) {
      for (const status of statuses) {
        console.log(`WhatsApp delivery status: ${status.id} → ${status.status}`);
      }
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error("WhatsApp webhook error:", err);
    return res.sendStatus(500);
  }
});

router.post("/cart-reminder", async (req: Request, res: Response) => {
  try {
    const { phone, name, cartUrl } = req.body;
    if (!phone) return res.status(400).json({ error: "phone is required" });

    await WhatsAppService.sendCartReminder(
      phone,
      name || "there",
      cartUrl || "https://plantasy.co.in/cart"
    );
    return res.json({ success: true });
  } catch (error: any) {
    console.error("cart-reminder error:", error);
    return res.status(500).json({ error: error.message });
  }
});

router.post("/checkout-pending", async (req: Request, res: Response) => {
  try {
    const { phone, name, amount, checkoutUrl } = req.body;
    if (!phone) return res.status(400).json({ error: "phone is required" });

    await WhatsAppService.sendCheckoutPending(
      phone,
      name || "there",
      Number(amount) || 0,
      checkoutUrl || "https://plantasy.co.in/checkout"
    );
    return res.json({ success: true });
  } catch (error: any) {
    console.error("checkout-pending error:", error);
    return res.status(500).json({ error: error.message });
  }
});

router.post("/payment-failed", async (req: Request, res: Response) => {
  try {
    const { phone, name, amount, retryUrl } = req.body;
    if (!phone) return res.status(400).json({ error: "phone is required" });

    await WhatsAppService.sendPaymentFailed(
      phone,
      name || "there",
      Number(amount) || 0,
      retryUrl || "https://plantasy.co.in/checkout"
    );
    return res.json({ success: true });
  } catch (error: any) {
    console.error("payment-failed error:", error);
    return res.status(500).json({ error: error.message });
  }
});

router.post("/delhivery-webhook", async (req: Request, res: Response) => {
  try {
    const { waybill, status, order_id } = req.body;

    console.log(`Delhivery webhook: order=${order_id}, waybill=${waybill}, status=${status}`);

    if (!order_id) return res.sendStatus(200);

    const upperStatus = String(status).toUpperCase();

    if (upperStatus.includes("OUT_FOR_DELIVERY") || upperStatus.includes("OUT FOR DELIVERY")) {
      await OrderService.onOrderShipped(order_id);
    } else if (upperStatus.includes("DELIVERED")) {
      await OrderService.onOrderDelivered(order_id);
    }

    return res.sendStatus(200);
  } catch (err) {
    console.error("Delhivery webhook error:", err);
    return res.sendStatus(500);
  }
});

export default router;
