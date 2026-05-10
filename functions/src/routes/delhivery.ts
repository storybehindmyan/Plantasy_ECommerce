import express from "express";
import type { Request, Response, NextFunction } from "express";
import * as admin from "firebase-admin";
import { DelhiveryService } from "../services/DelhiveryService";
import { OrderService } from "../services/OrderService";

const router = express.Router();

// Middleware: verify Firebase ID token (admin-only routes)
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

// GET /api/delhivery/track?waybill=XXXX
router.get("/track", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { waybill } = req.query;
    if (!waybill || typeof waybill !== "string") {
      return res.status(400).json({ error: "waybill query param is required" });
    }
    const data = await DelhiveryService.trackShipment(waybill);
    return res.json(data);
  } catch (error: any) {
    console.error("GET /api/delhivery/track error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/delhivery/track-sync — fetch latest events from Delhivery & save to Firestore
router.post("/track-sync", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: "orderId is required" });

    const orderRef = admin.firestore().collection("orders").doc(orderId);
    const snap = await orderRef.get();
    if (!snap.exists) return res.status(404).json({ error: "Order not found" });

    const order = snap.data() as any;
    const waybill =
      order.delhivery?.waybill ||
      order.waybill ||
      order.track?.replace(/^https?:\/\/.*waybill=/, "");

    if (!waybill) {
      return res.status(400).json({ error: "No waybill found for this order. Generate waybill first." });
    }

    const trackData = await DelhiveryService.trackShipment(waybill);

    // Parse Delhivery tracking response (handles both API formats)
    const scans: any[] =
      trackData?.ShipmentData?.[0]?.Shipment?.Scans ||
      trackData?.shipment_track?.[0]?.scans ||
      [];

    const events = scans.map((s: any) => ({
      status: s.ScanDetail?.Scan || s.activity || s.status || "",
      location: s.ScanDetail?.ScannedLocation || s.location || "",
      timestamp: s.ScanDetail?.ScanDateTime || s.timestamp || new Date().toISOString(),
    }));

    const latestStatus =
      trackData?.ShipmentData?.[0]?.Shipment?.Status?.Status ||
      trackData?.shipment_track?.[0]?.current_status ||
      "";

    const trackingUrl =
      order.delhivery?.trackingUrl ||
      order.trackingUrl ||
      order.track ||
      `https://www.delhivery.com/tracking?waybill=${encodeURIComponent(waybill)}`;

    await orderRef.update({
      trackingEvents: events,
      shipmentStatus: latestStatus,
      trackingUrl,
      waybill,
      "timestamps.updatedAt": admin.firestore.FieldValue.serverTimestamp(),
    });

    return res.json({ success: true, events, latestStatus, waybill, trackingUrl });
  } catch (error: any) {
    console.error("POST /api/delhivery/track-sync error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/delhivery/waybill — (re)generate waybill for an order, idempotent
router.post("/waybill", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: "orderId is required" });

    const orderRef = admin.firestore().collection("orders").doc(orderId);
    const snap = await orderRef.get();
    if (!snap.exists) return res.status(404).json({ error: "Order not found" });

    const order = snap.data() as any;

    // Idempotent: if waybill already exists, just return it
    const existing = order.delhivery?.waybill || order.waybill;
    if (existing) {
      const trackingUrl =
        order.delhivery?.trackingUrl ||
        order.trackingUrl ||
        order.track ||
        `https://www.delhivery.com/tracking?waybill=${encodeURIComponent(existing)}`;
      return res.json({ waybill: existing, trackingUrl, alreadyExists: true });
    }

    const addr = order.deliveryAddress || {};
    const phone = addr.phone || "";
    const name = `${addr.firstName || ""} ${addr.lastName || ""}`.trim();
    const amount = order.pricing?.grandTotal || 0;

    const { waybill, trackingUrl } = await OrderService.onOrderPaid(
      orderId,
      phone,
      name,
      amount
    );

    return res.json({ waybill, trackingUrl, alreadyExists: false });
  } catch (error: any) {
    console.error("POST /api/delhivery/waybill error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/delhivery/label — get shipping label URL
router.post("/label", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: "orderId is required" });

    const snap = await admin.firestore().collection("orders").doc(orderId).get();
    if (!snap.exists) return res.status(404).json({ error: "Order not found" });

    const order = snap.data() as any;
    const waybill = order.delhivery?.waybill || order.waybill;
    if (!waybill) {
      return res.status(400).json({ error: "No waybill. Generate waybill first." });
    }

    // Delhivery label URL pattern
    const labelUrl = `https://track.delhivery.com/api/p/packing_slip?wbns=${encodeURIComponent(waybill)}&token=yes`;

    await admin
      .firestore()
      .collection("orders")
      .doc(orderId)
      .update({ labelUrl, "timestamps.updatedAt": admin.firestore.FieldValue.serverTimestamp() });

    return res.json({ labelUrl, waybill });
  } catch (error: any) {
    console.error("POST /api/delhivery/label error:", error);
    return res.status(500).json({ error: error.message });
  }
});

export default router;
