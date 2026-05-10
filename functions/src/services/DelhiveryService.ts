const DELHIVERY_API_KEY = process.env.DELHIVERY_API_KEY || "";
const DELHIVERY_BASE_URL =
  process.env.DELHIVERY_BASE_URL || "https://ltl-clients-api.delhivery.com";
const USE_MOCK = !DELHIVERY_API_KEY || process.env.USE_MOCK_DELIVERY === "true";

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
    const { orderId, invoiceValue, products, paymentMode, customer, warehouse } = params;

    if (USE_MOCK) {
      const fakeWaybill = `MOCK-${orderId}-${Date.now()}`;
      console.log(`[Delhivery MOCK] Shipment created for order ${orderId}: ${fakeWaybill}`);
      return {
        waybill: fakeWaybill,
        trackingUrl: `https://www.delhivery.com/tracking?waybill=${encodeURIComponent(fakeWaybill)}`,
        raw: { mock: true, orderId, invoiceValue, products },
      };
    }

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

    const shipmentRes = await fetch(`${DELHIVERY_BASE_URL}/shipments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DELHIVERY_API_KEY}`,
      },
      body: JSON.stringify(shipmentPayload),
    });

    if (!shipmentRes.ok) {
      const text = await shipmentRes.text();
      throw new Error(`Delhivery shipment failed: ${shipmentRes.status} ${text}`);
    }

    const shipmentData = (await shipmentRes.json()) as any;
    const waybill =
      shipmentData?.shipments?.[0]?.waybill ||
      shipmentData?.packages?.[0]?.waybill ||
      shipmentData?.waybill;

    if (!waybill) {
      throw new Error("No waybill in Delhivery response");
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const pickupDate = tomorrow.toISOString().split("T")[0];

    try {
      const pickupRes = await fetch(`${DELHIVERY_BASE_URL}/pickup_requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DELHIVERY_API_KEY}`,
        },
        body: JSON.stringify({
          client_warehouse: warehouse.clientWarehouseCode,
          pickup_date: pickupDate,
          start_time: "09:00:00",
          expected_package_count: 1,
          shipments: [{ awb: waybill, order_id: orderId }],
        }),
      });

      if (!pickupRes.ok) {
        const text = await pickupRes.text();
        console.error("Delhivery pickup error:", pickupRes.status, text);
      }
    } catch (err) {
      console.error("Pickup request failed (shipment still created):", err);
    }

    const trackingUrl = `https://www.delhivery.com/tracking?waybill=${encodeURIComponent(waybill)}`;
    return { waybill, trackingUrl, raw: shipmentData };
  },
};
