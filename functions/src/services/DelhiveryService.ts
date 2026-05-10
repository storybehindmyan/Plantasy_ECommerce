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
  weightKg?: number;
  customer: DelhiveryAddress;
  warehouse: {
    name: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    clientWarehouseCode?: string;
  };
}

export const DelhiveryService = {
  async createShipmentAndPickup(
    params: CreateShipmentParams
  ): Promise<{ waybill: string; trackingUrl: string; raw: any }> {
    const { orderId, invoiceValue, products, paymentMode, customer, warehouse } = params;
    const weightKg = params.weightKg || parseFloat(process.env.DEFAULT_PACKAGE_WEIGHT || "0.5");

    // Sanitize phone: strip country code, spaces, dashes — Delhivery needs exactly 10 digits
    const sanitizePhone = (p: string) => p.replace(/\D/g, "").replace(/^91/, "").slice(-10);
    const customerPhone = sanitizePhone(customer.phone);
    const warehousePhone = sanitizePhone(warehouse.phone);

    if (USE_MOCK) {
      const fakeWaybill = `MOCK-${orderId}-${Date.now()}`;
      console.log(`[Delhivery MOCK] Shipment created for order ${orderId}: ${fakeWaybill}`);
      return {
        waybill: fakeWaybill,
        trackingUrl: `https://www.delhivery.com/tracking?waybill=${encodeURIComponent(fakeWaybill)}`,
        raw: { mock: true, orderId, invoiceValue, products },
      };
    }

    // Standard Delhivery Express API uses form-encoded body + Token auth
    const expressPayload = {
      shipments: [
        {
          name: customer.name,
          add: [customer.addressLine1, customer.addressLine2].filter(Boolean).join(", "),
          city: customer.city,
          state: customer.state,
          country: "India",
          pin: customer.pincode,
          phone: customerPhone,
          email: customer.email ?? "",
          order: orderId,
          payment_mode: paymentMode,
          products_desc: products.map((p) => p.name).join(", "),
          total_amount: invoiceValue,
          cod_amount: paymentMode === "COD" ? invoiceValue : 0,
          weight: weightKg,
          return_pin: warehouse.pincode,
          return_city: warehouse.city,
          return_phone: warehousePhone,
          return_add: [warehouse.addressLine1, warehouse.addressLine2].filter(Boolean).join(", "),
          return_state: warehouse.state,
          return_country: "India",
        },
      ],
      pickup_location: {
        name: warehouse.name,
        add: warehouse.addressLine1,
        city: warehouse.city,
        pin: warehouse.pincode,
        country: "India",
        phone: warehousePhone,
      },
    };

    const formBody = `format=json&data=${encodeURIComponent(JSON.stringify(expressPayload))}`;

    const shipmentRes = await fetch(`${DELHIVERY_BASE_URL}/api/cmu/create.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Token ${DELHIVERY_API_KEY}`,
      },
      body: formBody,
    });

    if (!shipmentRes.ok) {
      const text = await shipmentRes.text();
      throw new Error(`Delhivery shipment failed: ${shipmentRes.status} ${text}`);
    }

    const shipmentData = (await shipmentRes.json()) as any;

    // Check for package-level failure and include the actual Delhivery remarks in the error
    const pkg = shipmentData?.packages?.[0];
    if (pkg?.status === "Fail" || shipmentData?.success === false) {
      const remarks = pkg?.remarks?.join("; ") || shipmentData?.rmk || "Unknown error";
      const errCode = pkg?.err_code || "";
      console.error("Delhivery package failed:", JSON.stringify(shipmentData));
      throw new Error(`Delhivery error ${errCode}: ${remarks}`);
    }

    const waybill =
      shipmentData?.packages?.[0]?.waybill ||
      shipmentData?.shipments?.[0]?.waybill ||
      shipmentData?.waybill;

    if (!waybill) {
      console.error("Delhivery response:", JSON.stringify(shipmentData));
      throw new Error("No waybill in Delhivery response");
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const pickupDate = tomorrow.toISOString().split("T")[0];

    try {
      const pickupBody = {
        pickup_time: `${pickupDate} 10:00:00`,
        pickup_date: pickupDate,
        pickup_location: warehouse.name,
        expected_package_count: 1,
        shipment_id: [waybill],
      };
      console.log(`[Delhivery] Scheduling pickup for waybill ${waybill}:`, JSON.stringify(pickupBody));

      const pickupRes = await fetch(`${DELHIVERY_BASE_URL}/fm/request/new/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${DELHIVERY_API_KEY}`,
        },
        body: JSON.stringify(pickupBody),
      });

      const pickupText = await pickupRes.text();
      if (!pickupRes.ok) {
        console.error(`[Delhivery] Pickup scheduling failed ${pickupRes.status}:`, pickupText);
      } else {
        console.log(`[Delhivery] Pickup scheduled OK:`, pickupText);
      }
    } catch (err) {
      console.error("[Delhivery] Pickup request exception (shipment still created):", err);
    }

    const trackingUrl = `https://www.delhivery.com/tracking?waybill=${encodeURIComponent(waybill)}`;
    return { waybill, trackingUrl, raw: shipmentData };
  },

  async trackShipment(waybill: string): Promise<any> {
    if (USE_MOCK) {
      return {
        mock: true,
        ShipmentData: [{
          Shipment: {
            Status: { Status: "In Transit" },
            Scans: [
              { ScanDetail: { Scan: "Picked Up", ScannedLocation: "Hyderabad", ScanDateTime: new Date(Date.now() - 172800000).toISOString() } },
              { ScanDetail: { Scan: "In Transit", ScannedLocation: "Bengaluru Hub", ScanDateTime: new Date(Date.now() - 86400000).toISOString() } },
              { ScanDetail: { Scan: "Out For Delivery", ScannedLocation: "Bengaluru City", ScanDateTime: new Date(Date.now() - 3600000).toISOString() } },
            ],
          },
        }],
      };
    }

    const res = await fetch(
      `${DELHIVERY_BASE_URL}/api/v1/packages/json/?waybill=${encodeURIComponent(waybill)}&verbose=true`,
      {
        headers: {
          Authorization: `Token ${DELHIVERY_API_KEY}`,
          Accept: "application/json",
        },
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Delhivery track failed: ${res.status} ${text}`);
    }

    return await res.json();
  },
};
