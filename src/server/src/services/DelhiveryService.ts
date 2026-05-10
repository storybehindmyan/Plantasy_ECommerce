// server/src/services/DelhiveryService.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import fetch from "node-fetch";

const DELHIVERY_API_KEY = process.env.DELHIVERY_API_KEY || "";
const DELHIVERY_BASE_URL =
  process.env.DELHIVERY_BASE_URL || "https://ltl-clients-api-dev.delhivery.com";

const USE_MOCK_DELIVERY = process.env.USE_MOCK_DELIVERY !== "false"; // default true

export interface DelhiveryAddress {
  name: string;
  phone: string;
  email?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface CreateShipmentParams {
  orderId: string;
  invoiceValue: number;
  products: { name: string; quantity: number }[];
  paymentMode: "Prepaid" | "COD";

  customer: DelhiveryAddress;

  warehouse: {
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    clientWarehouseCode: string;
  };
}

export const DelhiveryService = {
  async createShipmentAndPickup(
    params: CreateShipmentParams
  ): Promise<{ waybill: string; trackingUrl: string; raw: any }> {
    const {
      orderId,
      invoiceValue,
      products,
      paymentMode,
      customer,
      warehouse,
    } = params;

    if (USE_MOCK_DELIVERY || !DELHIVERY_API_KEY) {
      const fakeWaybill = `MOCK-${orderId}-${Date.now()}`;
      const trackingUrl = `https://www.delhivery.com/track-v2/package/${encodeURIComponent(fakeWaybill)}`;

      return {
        waybill: fakeWaybill,
        trackingUrl,
        raw: {
          mock: true,
          orderId,
          invoiceValue,
          products,
        },
      };
    }

    // 1) Create shipment/order
    const shipmentPayload = {
      pickup_location: {
        name: warehouse.name,
        add: warehouse.addressLine1,
        add2: warehouse.addressLine2 ?? "",
        city: warehouse.city,
        state: warehouse.state,
        country: "India",
        pin: warehouse.pincode,
        phone: warehouse.phone,
      },
      shipments: [
        {
          name: customer.name,
          add: customer.addressLine1,
          add2: customer.addressLine2 ?? "",
          city: customer.city,
          state: customer.state,
          country: "India",
          pin: customer.pincode,
          phone: customer.phone,
          email: customer.email ?? "",
          order: orderId,
          payment_mode: paymentMode,
          products_desc: products.map((p) => p.name).join(", "),
          total_amount: invoiceValue,
          cod_amount: paymentMode === "COD" ? invoiceValue : 0,
        },
      ],
    };

    const shipmentUrl = `${DELHIVERY_BASE_URL}/shipments`; // confirm endpoint in your docs

    const shipmentRes = await fetch(shipmentUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DELHIVERY_API_KEY}`,
      },
      body: JSON.stringify(shipmentPayload),
    });

    if (!shipmentRes.ok) {
      const text = await shipmentRes.text();
      console.error("Delhivery shipment error:", shipmentRes.status, text);
      throw new Error(`Delhivery shipment failed: ${shipmentRes.status}`);
    }

    const shipmentData = (await shipmentRes.json()) as any;

    const waybill =
      shipmentData?.shipments?.[0]?.waybill ||
      shipmentData?.packages?.[0]?.waybill ||
      shipmentData?.waybill;

    if (!waybill) {
      console.error("Delhivery shipment response:", shipmentData);
      throw new Error("No waybill found in Delhivery response");
    }

    // 2) (Optional) Create pickup request based on waybill
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const pickupDate = tomorrow.toISOString().split("T")[0];

    const pickupUrl = `${DELHIVERY_BASE_URL}/pickup_requests`;
    const pickupBody = {
      client_warehouse: warehouse.clientWarehouseCode,
      pickup_date: pickupDate,
      start_time: "09:00:00",
      expected_package_count: 1,
      shipments: [{ awb: waybill, order_id: orderId }],
    };

    try {
      const pickupRes = await fetch(pickupUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DELHIVERY_API_KEY}`,
        },
        body: JSON.stringify(pickupBody),
      });

      if (!pickupRes.ok) {
        const text = await pickupRes.text();
        console.error("Delhivery pickup error:", pickupRes.status, text);
        // Do not throw, shipment already created, just log
      } else {
        const pickupData = await pickupRes.json();
        console.log("Delhivery pickup created:", pickupData);
        (shipmentData as any).pickup = pickupData;
      }
    } catch (err) {
      console.error("Pickup request failed:", err);
    }

    const trackingUrl = `https://www.delhivery.com/track-v2/package/${encodeURIComponent(waybill)}`;

    return { waybill, trackingUrl, raw: shipmentData };
  },
};
