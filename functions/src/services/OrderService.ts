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

    const { waybill, trackingUrl, raw } = await DelhiveryService.createShipmentAndPickup({
      orderId,
      invoiceValue,
      products,
      paymentMode: "Prepaid",
      customer,
      warehouse: {
        name: process.env.WAREHOUSE_NAME || "Plantasy Warehouse",
        phone: process.env.WAREHOUSE_PHONE || "9999999999",
        addressLine1: process.env.WAREHOUSE_ADDRESS_LINE1 || "",
        addressLine2: process.env.WAREHOUSE_ADDRESS_LINE2 || "",
        city: process.env.WAREHOUSE_CITY || "",
        state: process.env.WAREHOUSE_STATE || "",
        pincode: process.env.WAREHOUSE_PINCODE || "",
      },
    });

    await orderRef.update({
      orderStatus: "CONFIRMED",
      "delhivery.waybill": waybill,
      "delhivery.trackingUrl": trackingUrl,
      "delhivery.raw": raw,
      track: trackingUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await WhatsAppService.sendOrderConfirmed(
      customer.phone,
      customer.name,
      orderId,
      invoiceValue
    );

    console.log(`Order ${orderId} processed: waybill=${waybill}`);
    return { waybill, trackingUrl };
  },

  // Admin-triggered confirmation — idempotent: skips waybill creation if already exists
  async onOrderConfirm(orderId: string): Promise<{ waybill: string; trackingUrl: string; alreadyHadWaybill: boolean }> {
    const orderRef = db().collection("orders").doc(orderId);
    const snap = await orderRef.get();
    if (!snap.exists) throw new Error(`Order ${orderId} not found`);

    const order = snap.data() as any;
    const existing = order.delhivery?.waybill || order.waybill;

    if (existing) {
      // Already confirmed with waybill — just ensure status is CONFIRMED
      await orderRef.update({
        orderStatus: "CONFIRMED",
        "timestamps.confirmedAt": admin.firestore.FieldValue.serverTimestamp(),
        "timestamps.updatedAt": admin.firestore.FieldValue.serverTimestamp(),
      });
      return {
        waybill: existing,
        trackingUrl: order.delhivery?.trackingUrl || order.trackingUrl || order.track || `https://www.delhivery.com/tracking?waybill=${encodeURIComponent(existing)}`,
        alreadyHadWaybill: true,
      };
    }

    // No waybill yet — create shipment and send WhatsApp
    const addr = order.deliveryAddress || {};
    const phone = addr.phone || "";
    const name = `${addr.firstName || ""} ${addr.lastName || ""}`.trim();
    const amount = order.pricing?.grandTotal || 0;

    const { waybill, trackingUrl } = await this.onOrderPaid(orderId, phone, name, amount);

    // Send WhatsApp shipping confirmation with tracking link
    await WhatsAppService.sendOrderShippingInfo(phone, name, orderId, waybill, trackingUrl);

    return { waybill, trackingUrl, alreadyHadWaybill: false };
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
