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

// POST /api/delhivery/track-sync — sync tracking + auto-update order status
router.post("/track-sync", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: "orderId is required" });

    const result = await OrderService.syncOrderTracking(orderId);
    return res.json({ success: true, ...result });
  } catch (error: any) {
    console.error("POST /api/delhivery/track-sync error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/delhivery/sync-all — sync tracking for ALL active orders (called on admin page load)
router.post("/sync-all", verifyAuth, async (req: Request, res: Response) => {
  try {
    const snap = await admin.firestore()
      .collection("orders")
      .where("orderStatus", "in", ["CONFIRMED", "SHIPPED"])
      .get();

    if (snap.empty) return res.json({ success: true, synced: 0, updated: 0 });

    const results = await Promise.allSettled(
      snap.docs.map((doc) => OrderService.syncOrderTracking(doc.id))
    );

    let updated = 0, errors = 0;
    results.forEach((r) => {
      if (r.status === "fulfilled") { if (r.value.newOrderStatus) updated++; }
      else errors++;
    });

    console.log(`[sync-all] ${snap.size} orders checked, ${updated} status updates, ${errors} errors`);
    return res.json({ success: true, synced: snap.size, updated, errors });
  } catch (error: any) {
    console.error("POST /api/delhivery/sync-all error:", error);
    return res.status(500).json({ error: error.message });
  }
});

// POST /api/delhivery/waybill — confirm order: create waybill if needed, schedule pickup, set CONFIRMED
router.post("/waybill", verifyAuth, async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: "orderId is required" });

    // Always go through onOrderConfirm: creates waybill if missing, schedules pickup, sets CONFIRMED
    const { waybill, trackingUrl, alreadyHadWaybill } = await OrderService.onOrderConfirm(orderId);
    return res.json({ waybill, trackingUrl, alreadyHadWaybill });
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

// POST /api/delhivery/test-shipment — no auth, for DeliveryTest page debugging
// Returns full raw Delhivery response so you can see exactly what the API returns
router.post("/test-shipment", async (req: Request, res: Response) => {
  try {
    const {
      warehouseName,
      warehousePhone,
      warehouseAddress,
      warehouseCity,
      warehouseState,
      warehousePincode,
      customerName,
      customerPhone,
      customerAddress,
      customerCity,
      customerState,
      customerPincode,
    } = req.body;

    const apiKey = process.env.DELHIVERY_API_KEY || "";
    const baseUrl = process.env.DELHIVERY_BASE_URL || "https://ltl-clients-api.delhivery.com";

    if (!apiKey) {
      return res.json({
        success: false,
        mode: "mock",
        message: "DELHIVERY_API_KEY not set — running in mock mode",
        mockWaybill: `MOCK-TEST-${Date.now()}`,
      });
    }

    const testOrderId = `TEST-${Date.now()}`;
    const payload = {
      shipments: [
        {
          name: customerName || "Test Customer",
          add: customerAddress || "Test Address",
          city: customerCity || "Hyderabad",
          state: customerState || "Telangana",
          country: "India",
          pin: customerPincode || "500001",
          phone: customerPhone || "9000000000",
          order: testOrderId,
          payment_mode: "Prepaid",
          products_desc: "Test Plant",
          total_amount: 499,
          cod_amount: 0,
          return_pin: warehousePincode || "",
          return_city: warehouseCity || "",
          return_phone: warehousePhone || "",
          return_add: warehouseAddress || "",
          return_state: warehouseState || "",
          return_country: "India",
        },
      ],
      pickup_location: {
        name: warehouseName || process.env.WAREHOUSE_NAME || "",
        add: warehouseAddress || process.env.WAREHOUSE_ADDRESS_LINE1 || "",
        city: warehouseCity || process.env.WAREHOUSE_CITY || "",
        pin: warehousePincode || process.env.WAREHOUSE_PINCODE || "",
        country: "India",
        phone: warehousePhone || process.env.WAREHOUSE_PHONE || "",
      },
    };

    const formBody = `format=json&data=${encodeURIComponent(JSON.stringify(payload))}`;

    const response = await fetch(`${baseUrl}/api/cmu/create.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Token ${apiKey}`,
      },
      body: formBody,
    });

    const responseText = await response.text();
    let responseJson: any;
    try { responseJson = JSON.parse(responseText); } catch { responseJson = { raw: responseText }; }

    const pkg = responseJson?.packages?.[0];
    const failed = pkg?.status === "Fail" || responseJson?.success === false;
    const waybill = failed ? null :
      (pkg?.waybill || responseJson?.shipments?.[0]?.waybill || responseJson?.waybill || null);

    const failRemarks = failed
      ? (pkg?.remarks?.join("; ") || responseJson?.rmk || "")
      : null;

    return res.json({
      success: !!waybill,
      failed,
      failRemarks,
      errCode: pkg?.err_code || null,
      httpStatus: response.status,
      waybill,
      envWarehouseName: process.env.WAREHOUSE_NAME || "(not set)",
      envWarehouseCity: process.env.WAREHOUSE_CITY || "(not set)",
      envWarehousePincode: process.env.WAREHOUSE_PINCODE || "(not set)",
      requestPayload: payload,
      rawResponse: responseJson,
    });
  } catch (error: any) {
    console.error("POST /api/delhivery/test-shipment error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
