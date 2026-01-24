// server/src/services/OrderService.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { admin } from "../firebase/firebaseAdmin";
import {
  DelhiveryService,
  type CreateShipmentParams,
} from "./DelhiveryService";

const db = admin.firestore();

export const OrderService = {
  async onOrderPaid(orderId: string): Promise<void> {
    const orderRef = db.collection("orders").doc(orderId);
    const snap = await orderRef.get();

    if (!snap.exists) {
      throw new Error(`Order ${orderId} not found`);
    }

    const order = snap.data() as any;

    // Your frontend saved address as deliveryAddress, not shipping
    const addr = order.deliveryAddress || {};

    const customer = {
      name: `${addr.firstName || ""} ${addr.lastName || ""}`.trim(),
      phone: addr.phone || "",
      email: addr.email || "",
      addressLine1: addr.addressLine1 || "",
      addressLine2: addr.addressLine2 || "",
      city: addr.city || "",
      state: addr.region || addr.state || "",
      pincode: addr.zip || addr.pincode || "",
    };

    // Convert items to product descriptors for Delhivery
    const products = (order.items || []).map((item: any) => ({
      name: item.productName || item.name || item.title || "Product",
      quantity: item.quantity || item.qty || 1,
    }));

    const invoiceValue =
      order.pricing?.grandTotal ||
      order.totalAmount ||
      order.grandTotal ||
      order.amount ||
      0;

    const params: CreateShipmentParams = {
      orderId,
      invoiceValue,
      products,
      paymentMode: "Prepaid",
      customer,
      warehouse: {
        name: process.env.WAREHOUSE_NAME || "Warehouse",
        phone: process.env.WAREHOUSE_PHONE || "0000000000",
        addressLine1: process.env.WAREHOUSE_ADDRESS_LINE1 || "",
        addressLine2: process.env.WAREHOUSE_ADDRESS_LINE2 || "",
        city: process.env.WAREHOUSE_CITY || "",
        state: process.env.WAREHOUSE_STATE || "",
        pincode: process.env.WAREHOUSE_PINCODE || "",
        clientWarehouseCode:
          process.env.WAREHOUSE_CLIENT_CODE || "DEFAULT_WH",
      },
    };

    // 1) Create shipment + pickup at Delhivery
    const { waybill, trackingUrl, raw } =
      await DelhiveryService.createShipmentAndPickup(params);

    // 2) Update Firestore order with tracking details
    await orderRef.update({
      orderStatus: "PAID", // or status field, match your schema
      "delhivery.waybill": waybill,
      "delhivery.trackingUrl": trackingUrl,
      "delhivery.raw": raw,
      track: trackingUrl,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  },
};
