import * as admin from "firebase-admin";
import { DelhiveryService } from "./DelhiveryService";
import { WhatsAppService } from "./WhatsAppService";

const db = () => admin.firestore();

export const OrderService = {
  async onOrderPaid(
    orderId: string,
    phone: string,
    customerName: string,
    amount: number
  ): Promise<{ waybill: string; trackingUrl: string }> {
    const orderRef = db().collection("orders").doc(orderId);
    const snap = await orderRef.get();

    if (!snap.exists) {
      throw new Error(`Order ${orderId} not found in Firestore`);
    }

    const order = snap.data() as any;
    const addr = order.deliveryAddress || {};

    const customer = {
      name: customerName || `${addr.firstName || ""} ${addr.lastName || ""}`.trim(),
      phone: phone || addr.phone || "",
      email: addr.email || "",
      addressLine1: addr.addressLine1 || "",
      addressLine2: addr.addressLine2 || "",
      city: addr.city || "",
      state: addr.region || addr.state || "",
      pincode: addr.zip || addr.pincode || "",
    };

    const products = (order.items || []).map((item: any) => ({
      name: item.productName || item.name || "Product",
      quantity: item.quantity || 1,
    }));

    const invoiceValue =
      order.pricing?.grandTotal || order.totalAmount || order.grandTotal || amount || 0;

    const warehouse = {
      name: process.env.WAREHOUSE_NAME || "Plantasy",
      phone: process.env.WAREHOUSE_PHONE || "9999999999",
      addressLine1: process.env.WAREHOUSE_ADDRESS_LINE1 || "",
      addressLine2: process.env.WAREHOUSE_ADDRESS_LINE2 || "",
      city: process.env.WAREHOUSE_CITY || "",
      state: process.env.WAREHOUSE_STATE || "",
      pincode: process.env.WAREHOUSE_PINCODE || "",
    };

    const { waybill, trackingUrl, raw } = await DelhiveryService.createShipment({
      orderId,
      invoiceValue,
      products,
      paymentMode: "Prepaid",
      customer,
      warehouse,
    });

    // Status stays PENDING — admin will confirm when packed
    await orderRef.update({
      orderStatus: "PENDING",
      waybill,
      trackingUrl,
      "delhivery.waybill": waybill,
      "delhivery.trackingUrl": trackingUrl,
      "delhivery.raw": raw,
      track: trackingUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // WhatsApp: order placed confirmation
    await WhatsAppService.sendOrderConfirmed(
      customer.phone,
      customer.name,
      orderId,
      invoiceValue
    );

    console.log(`Order ${orderId}: waybill created=${waybill}, awaiting admin confirmation`);
    return { waybill, trackingUrl };
  },

  // Admin confirms order (packed & ready) — schedules Delhivery pickup
  async onOrderConfirm(orderId: string): Promise<{ waybill: string; trackingUrl: string; alreadyHadWaybill: boolean }> {
    const orderRef = db().collection("orders").doc(orderId);
    const snap = await orderRef.get();
    if (!snap.exists) throw new Error(`Order ${orderId} not found`);

    const order = snap.data() as any;
    const addr = order.deliveryAddress || {};
    const phone = addr.phone || "";
    const name = `${addr.firstName || ""} ${addr.lastName || ""}`.trim();
    const warehouseName = process.env.WAREHOUSE_NAME || "Plantasy";

    let waybill: string = order.delhivery?.waybill || order.waybill || "";
    let trackingUrl: string = order.delhivery?.trackingUrl || order.trackingUrl || order.track || "";
    let alreadyHadWaybill = !!waybill;

    if (!waybill) {
      // Waybill not created yet (edge case) — create it now
      const amount = order.pricing?.grandTotal || 0;
      const result = await this.onOrderPaid(orderId, phone, name, amount);
      waybill = result.waybill;
      trackingUrl = result.trackingUrl;
    } else {
      // Waybill exists — schedule pickup now (Admin packed the order)
      try {
        await DelhiveryService.schedulePickup(waybill, warehouseName);
        console.log(`Order ${orderId}: pickup scheduled for waybill ${waybill}`);
      } catch (err: any) {
        console.error(`Order ${orderId}: pickup scheduling failed (continuing):`, err.message);
      }
    }

    await orderRef.update({
      orderStatus: "CONFIRMED",
      "timestamps.confirmedAt": admin.firestore.FieldValue.serverTimestamp(),
      "timestamps.updatedAt": admin.firestore.FieldValue.serverTimestamp(),
    });

    // WhatsApp: order packed + tracking info
    await WhatsAppService.sendOrderShippingInfo(phone, name, orderId, waybill, trackingUrl);

    return { waybill, trackingUrl, alreadyHadWaybill };
  },

  async onOrderShipped(orderId: string): Promise<void> {
    const snap = await db().collection("orders").doc(orderId).get();
    if (!snap.exists) return;

    const order = snap.data() as any;
    const phone = order.deliveryAddress?.phone || "";
    const waybill = order.delhivery?.waybill || "";
    const trackingUrl = order.delhivery?.trackingUrl || "";

    if (phone && waybill) {
      await WhatsAppService.sendOrderShipped(phone, orderId, waybill, trackingUrl);
    }

    await db().collection("orders").doc(orderId).update({
      orderStatus: "SHIPPED",
      "timestamps.shippedAt": admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  },

  // Maps Delhivery tracking status → our order status and auto-updates Firestore
  async syncOrderTracking(orderId: string): Promise<{
    waybill: string;
    events: any[];
    latestDelhiveryStatus: string;
    newOrderStatus: string | null;
  }> {
    const orderRef = db().collection("orders").doc(orderId);
    const snap = await orderRef.get();
    if (!snap.exists) throw new Error(`Order ${orderId} not found`);

    const order = snap.data() as any;
    const waybill = order.delhivery?.waybill || order.waybill || "";
    if (!waybill) throw new Error("No waybill found for this order");

    const trackData = await DelhiveryService.trackShipment(waybill);

    const scans: any[] =
      trackData?.ShipmentData?.[0]?.Shipment?.Scans ||
      trackData?.shipment_track?.[0]?.scans || [];

    const events = scans.map((s: any) => ({
      status: s.ScanDetail?.Scan || s.activity || s.status || "",
      location: s.ScanDetail?.ScannedLocation || s.location || "",
      timestamp: s.ScanDetail?.ScanDateTime || s.timestamp || new Date().toISOString(),
    }));

    const latestDelhiveryStatus: string =
      trackData?.ShipmentData?.[0]?.Shipment?.Status?.Status ||
      trackData?.shipment_track?.[0]?.current_status || "";

    // Map Delhivery status → our order status
    const statusLower = latestDelhiveryStatus.toLowerCase();
    let newOrderStatus: string | null = null;
    const currentStatus: string = (order.orderStatus || "").toUpperCase();

    if (
      statusLower.includes("delivered") &&
      currentStatus !== "DELIVERED"
    ) {
      newOrderStatus = "DELIVERED";
    } else if (
      (statusLower.includes("picked up") ||
        statusLower.includes("in transit") ||
        statusLower.includes("out for delivery") ||
        statusLower.includes("manifested")) &&
      currentStatus !== "DELIVERED" &&
      currentStatus !== "SHIPPED"
    ) {
      newOrderStatus = "SHIPPED";
    }

    const trackingUrl =
      order.delhivery?.trackingUrl || order.trackingUrl || order.track ||
      `https://www.delhivery.com/tracking?waybill=${encodeURIComponent(waybill)}`;

    const updatePayload: any = {
      trackingEvents: events,
      shipmentStatus: latestDelhiveryStatus,
      trackingUrl,
      waybill,
      "timestamps.updatedAt": admin.firestore.FieldValue.serverTimestamp(),
    };

    if (newOrderStatus) {
      updatePayload.orderStatus = newOrderStatus;
      if (newOrderStatus === "SHIPPED") {
        updatePayload["timestamps.shippedAt"] = admin.firestore.FieldValue.serverTimestamp();
      } else if (newOrderStatus === "DELIVERED") {
        updatePayload["timestamps.deliveredAt"] = admin.firestore.FieldValue.serverTimestamp();
      }
    }

    await orderRef.update(updatePayload);

    // Send WhatsApp notifications on status transitions
    const addr = order.deliveryAddress || {};
    const phone = addr.phone || "";
    const customerName = `${addr.firstName || ""} ${addr.lastName || ""}`.trim();

    if (newOrderStatus === "SHIPPED" && phone) {
      await WhatsAppService.sendOrderShipped(phone, orderId, waybill, trackingUrl).catch(console.error);
    } else if (newOrderStatus === "DELIVERED" && phone) {
      const reviewUrl = `https://plantasy.co.in/review/${orderId}`;
      await WhatsAppService.sendOrderDelivered(phone, customerName, orderId, reviewUrl).catch(console.error);
    }

    console.log(`[syncOrderTracking] Order ${orderId}: Delhivery="${latestDelhiveryStatus}" → newStatus=${newOrderStatus || "no change"}`);
    return { waybill, events, latestDelhiveryStatus, newOrderStatus };
  },

  async onOrderDelivered(orderId: string): Promise<void> {
    const snap = await db().collection("orders").doc(orderId).get();
    if (!snap.exists) return;

    const order = snap.data() as any;
    const addr = order.deliveryAddress || {};
    const phone = addr.phone || "";
    const name = `${addr.firstName || ""} ${addr.lastName || ""}`.trim();
    const reviewUrl = `https://plantasy.co.in/review/${orderId}`;

    if (phone) {
      await WhatsAppService.sendOrderDelivered(phone, name, orderId, reviewUrl);
    }

    await db().collection("orders").doc(orderId).update({
      orderStatus: "DELIVERED",
      "timestamps.deliveredAt": admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  },
};
