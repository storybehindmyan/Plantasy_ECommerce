import * as admin from "firebase-admin";
import { DelhiveryService } from "./DelhiveryService";
import { WhatsAppService } from "./WhatsAppService";
import { EmailService } from "./EmailService";

const db = () => admin.firestore();

export const OrderService = {
  async onOrderPaid(
    orderId: string,
    phone: string,
    customerName: string,
    amount: number,
    emailOverride = ""
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
      email: addr.email || emailOverride || "",
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

    // Notify customer: order placed (WhatsApp + Email in parallel)
    await Promise.allSettled([
      WhatsAppService.sendOrderConfirmed(customer.phone, customer.name, orderId, invoiceValue),
      EmailService.sendOrderConfirmed(customer.email, customer.name, orderId, invoiceValue),
    ]);

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
    let alreadyHadWaybill = !!waybill;
    // Always recompute correct tracking URL (overwrites any old /tracking?waybill= format)
    let trackingUrl: string = waybill
      ? `https://www.delhivery.com/track-v2/package/${encodeURIComponent(waybill)}`
      : "";

    if (!waybill) {
      // Waybill not created yet — create it first
      const amount = order.pricing?.grandTotal || 0;
      const result = await this.onOrderPaid(orderId, phone, name, amount);
      waybill = result.waybill;
      trackingUrl = result.trackingUrl;
    }

    // Always schedule pickup (whether waybill was just created or pre-existing)
    let pickupError: string | null = null;
    try {
      await DelhiveryService.schedulePickup(waybill, warehouseName);
      console.log(`Order ${orderId}: pickup scheduled for waybill ${waybill}`);
    } catch (err: any) {
      pickupError = err.message;
      console.error(`Order ${orderId}: pickup scheduling failed:`, err.message);
    }

    // Recompute after waybill may have been freshly created
    trackingUrl = `https://www.delhivery.com/track-v2/package/${encodeURIComponent(waybill)}`;

    await orderRef.update({
      orderStatus: "CONFIRMED",
      pickupScheduled: !pickupError,
      trackingUrl,
      track: trackingUrl,
      "delhivery.trackingUrl": trackingUrl,
      "timestamps.confirmedAt": admin.firestore.FieldValue.serverTimestamp(),
      "timestamps.updatedAt": admin.firestore.FieldValue.serverTimestamp(),
    });

    // Notify customer: order packed + tracking info (WhatsApp + Email in parallel)
    const packedEmail = (order.deliveryAddress?.email as string) || "";
    await Promise.allSettled([
      WhatsAppService.sendOrderShippingInfo(phone, name, orderId, waybill, trackingUrl),
      EmailService.sendOrderPacked(packedEmail, name, orderId, waybill, trackingUrl),
    ]);

    return { waybill, trackingUrl, alreadyHadWaybill, pickupError } as any;
  },

  async onOrderShipped(orderId: string): Promise<void> {
    const snap = await db().collection("orders").doc(orderId).get();
    if (!snap.exists) return;

    const order = snap.data() as any;
    const phone = order.deliveryAddress?.phone || "";
    const waybill = order.delhivery?.waybill || "";
    const trackingUrl = order.delhivery?.trackingUrl || "";

    const shippedEmail = (order.deliveryAddress?.email as string) || "";
    const shippedName = `${order.deliveryAddress?.firstName || ""} ${order.deliveryAddress?.lastName || ""}`.trim();
    if (phone && waybill) {
      await Promise.allSettled([
        WhatsAppService.sendOrderShipped(phone, orderId, waybill, trackingUrl),
        EmailService.sendOrderShipped(shippedEmail, shippedName, orderId, waybill, trackingUrl),
      ]);
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

    const trackingUrl = `https://www.delhivery.com/track-v2/package/${encodeURIComponent(waybill)}`;

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

    const customerEmail = (addr.email as string) || "";
    if (newOrderStatus === "SHIPPED" && phone) {
      await Promise.allSettled([
        WhatsAppService.sendOrderShipped(phone, orderId, waybill, trackingUrl),
        EmailService.sendOrderShipped(customerEmail, customerName, orderId, waybill, trackingUrl),
      ]);
    } else if (newOrderStatus === "DELIVERED") {
      const reviewUrl = `https://plantasy.co.in/review/${orderId}`;
      await Promise.allSettled([
        phone ? WhatsAppService.sendOrderDelivered(phone, customerName, orderId, reviewUrl) : Promise.resolve(),
        EmailService.sendOrderDelivered(customerEmail, customerName, orderId, reviewUrl),
      ]);
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

    const deliveredEmail = (addr.email as string) || "";
    await Promise.allSettled([
      phone ? WhatsAppService.sendOrderDelivered(phone, name, orderId, reviewUrl) : Promise.resolve(),
      EmailService.sendOrderDelivered(deliveredEmail, name, orderId, reviewUrl),
    ]);

    await db().collection("orders").doc(orderId).update({
      orderStatus: "DELIVERED",
      "timestamps.deliveredAt": admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  },
};
