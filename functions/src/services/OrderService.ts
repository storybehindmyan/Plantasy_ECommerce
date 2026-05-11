import * as admin from "firebase-admin";
import { DelhiveryService } from "./DelhiveryService";
import { WhatsAppService } from "./WhatsAppService";
import { EmailService } from "./EmailService";

const db = () => admin.firestore();

async function getCustomerEmail(order: any): Promise<string> {
  const email = (order.deliveryAddress?.email as string) || "";
  if (email) return email;
  const uid = order.uid || order.userId || "";
  if (!uid) return "";
  try {
    const userRecord = await admin.auth().getUser(uid);
    return userRecord.email || "";
  } catch {
    return "";
  }
}

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
    const packedEmail = await getCustomerEmail(order);
    await Promise.allSettled([
      WhatsAppService.sendOrderShippingInfo(phone, name, orderId, waybill, trackingUrl),
      packedEmail ? EmailService.sendOrderPacked(packedEmail, name, orderId, waybill, trackingUrl) : Promise.resolve(),
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

    const shippedEmail = await getCustomerEmail(order);
    const shippedName = `${order.deliveryAddress?.firstName || ""} ${order.deliveryAddress?.lastName || ""}`.trim();
    await Promise.allSettled([
      phone && waybill ? WhatsAppService.sendOrderShipped(phone, orderId, waybill, trackingUrl) : Promise.resolve(),
      shippedEmail ? EmailService.sendOrderShipped(shippedEmail, shippedName, orderId, waybill, trackingUrl) : Promise.resolve(),
    ]);

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

    const customerEmail = await getCustomerEmail(order);
    if (newOrderStatus === "SHIPPED") {
      await Promise.allSettled([
        phone && waybill ? WhatsAppService.sendOrderShipped(phone, orderId, waybill, trackingUrl) : Promise.resolve(),
        customerEmail ? EmailService.sendOrderShipped(customerEmail, customerName, orderId, waybill, trackingUrl) : Promise.resolve(),
      ]);
    } else if (newOrderStatus === "DELIVERED") {
      const reviewUrl = `https://plantasy.co.in/review/${orderId}`;
      await Promise.allSettled([
        phone ? WhatsAppService.sendOrderDelivered(phone, customerName, orderId, reviewUrl) : Promise.resolve(),
        customerEmail ? EmailService.sendOrderDelivered(customerEmail, customerName, orderId, reviewUrl) : Promise.resolve(),
      ]);
    }

    console.log(`[syncOrderTracking] Order ${orderId}: Delhivery="${latestDelhiveryStatus}" → newStatus=${newOrderStatus || "no change"}`);
    return { waybill, events, latestDelhiveryStatus, newOrderStatus };
  },

  async resendEmail(orderId: string, type: string): Promise<void> {
    const snap = await db().collection("orders").doc(orderId).get();
    if (!snap.exists) throw new Error(`Order ${orderId} not found`);
    const order = snap.data() as any;
    const addr = order.deliveryAddress || {};
    const name = `${addr.firstName || ""} ${addr.lastName || ""}`.trim() || "Customer";
    const email = await getCustomerEmail(order);
    if (!email) throw new Error("No email address found for this order");
    const waybill = order.waybill || order.delhivery?.waybill || "";
    const trackingUrl = order.trackingUrl || order.delhivery?.trackingUrl || "";
    const reviewUrl = `https://plantasy.co.in/review/${orderId}`;
    const invoiceValue = order.pricing?.grandTotal || 0;
    switch (type) {
      case "confirmed": await EmailService.sendOrderConfirmed(email, name, orderId, invoiceValue); break;
      case "packed":    await EmailService.sendOrderPacked(email, name, orderId, waybill, trackingUrl); break;
      case "shipped":   await EmailService.sendOrderShipped(email, name, orderId, waybill, trackingUrl); break;
      case "delivered": await EmailService.sendOrderDelivered(email, name, orderId, reviewUrl); break;
      default: throw new Error(`Unknown email type: ${type}`);
    }
    console.log(`[resendEmail] Sent '${type}' email to ${email} for order ${orderId}`);
  },

  async onOrderDelivered(orderId: string): Promise<void> {
    const snap = await db().collection("orders").doc(orderId).get();
    if (!snap.exists) return;

    const order = snap.data() as any;
    const addr = order.deliveryAddress || {};
    const phone = addr.phone || "";
    const name = `${addr.firstName || ""} ${addr.lastName || ""}`.trim();
    const reviewUrl = `https://plantasy.co.in/review/${orderId}`;

    const deliveredEmail = await getCustomerEmail(order);
    await Promise.allSettled([
      phone ? WhatsAppService.sendOrderDelivered(phone, name, orderId, reviewUrl) : Promise.resolve(),
      deliveredEmail ? EmailService.sendOrderDelivered(deliveredEmail, name, orderId, reviewUrl) : Promise.resolve(),
    ]);

    await db().collection("orders").doc(orderId).update({
      orderStatus: "DELIVERED",
      "timestamps.deliveredAt": admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  },
};
