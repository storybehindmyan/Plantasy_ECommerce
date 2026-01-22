/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

const DELHIVERY_API_KEY = import.meta.env.VITE_DELHIVERY_API_KEY || "";
const DELHIVERY_BASE_URL = "https://ltl-clients-api-dev.delhivery.com";
const USE_MOCK_DELIVERY = import.meta.env.VITE_USE_MOCK_DELIVERY !== "false"; // ✅ Default to true

export const DelhiveryService = {
  // =========================
  // 1) Verify PIN Serviceability
  // =========================
  async verifyDeliveryAvailability(pinCode: string): Promise<boolean> {
    // Use mock mode by default for development
    if (USE_MOCK_DELIVERY || !DELHIVERY_API_KEY) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      // Validate Indian PIN code format (6 digits)
      return /^\d{6}$/.test(pinCode);
    }

    try {
      console.log("Verifying delivery for PIN:", pinCode);

      const response = await fetch(
        `${DELHIVERY_BASE_URL}/pincode-service/${pinCode}?weight=1`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${DELHIVERY_API_KEY}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Delhivery API error:", errorText);

        // Fallback to mock
        console.log("⚠️ Falling back to mock verification");
        return /^\d{6}$/.test(pinCode);
      }

      const data = (await response.json()) as any;
      console.log("Delhivery response:", data);

      const isServiceable =
        data?.delivery_codes?.[0]?.postal_code?.pin === pinCode ||
        data?.serviceable === true;

      return isServiceable;
    } catch (error) {
      console.error("Error verifying delivery:", error);
      return /^\d{6}$/.test(pinCode);
    }
  },

  // =========================
  // 2) Simple Delivery Charge (test)
  // =========================
  async getDeliveryCharges(
    pinCode: string,
    _weight: number = 0.5
  ): Promise<number> {
    const isServiceable = await this.verifyDeliveryAvailability(pinCode);
    if (!isServiceable) return 0;

    // Flat rate for testing
    return 50; // ₹50
  },

  // =========================
  // 3) Create Pickup Request
  // =========================
  async createPickupRequest(params: {
    orderId: string; // your OD000xxxx id
    clientWarehouse: string; // e.g. "test" (from Delhivery dashboard)
    expectedPackageCount?: number;
    pickupDate?: string; // "YYYY-MM-DD" (optional; default = tomorrow)
    startTime?: string; // "HH:MM:SS" (optional; default = "09:00:00")
  }): Promise<any> {
    const {
      orderId,
      clientWarehouse,
      expectedPackageCount = 1,
      pickupDate,
      startTime = "09:00:00",
    } = params;

    // In mock mode, just simulate success
    if (USE_MOCK_DELIVERY || !DELHIVERY_API_KEY) {
      console.log("✅ Using mock pickup creation for order:", orderId);

      await new Promise((resolve) => setTimeout(resolve, 500));

      // Return a fake pickup object
      return {
        mock: true,
        request_id: `mock_pur_${orderId}`,
        status: "created",
      };
    }

    const date =
      pickupDate ??
      new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const url = `${DELHIVERY_BASE_URL}/pickup_requests`;

    const body = {
      client_warehouse: clientWarehouse,
      pickup_date: date,
      start_time: startTime,
      expected_package_count: expectedPackageCount,
      shipments: [
        {
          awb: orderId,
          order_id: orderId,
        },
      ],
    };

    console.log("Creating Delhivery pickup:", body);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DELHIVERY_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Delhivery pickup error:", res.status, text);
      throw new Error(`Pickup failed: ${res.status}`);
    }

    const data = (await res.json()) as any;
    console.log("Delhivery pickup created:", data);
    return data;
  },

  // =========================
  // 4) Cancel Pickup Request
  // =========================
  async cancelPickupRequest(pickupRequestId: string): Promise<any> {
    // In mock mode, simulate cancel
    if (USE_MOCK_DELIVERY || !DELHIVERY_API_KEY) {
      console.log("✅ Using mock cancel for pickup:", pickupRequestId);

      await new Promise((resolve) => setTimeout(resolve, 500));
      return {
        mock: true,
        request_id: pickupRequestId,
        status: "cancelled",
      };
    }

    const url = `${DELHIVERY_BASE_URL}/pickup_requests/${pickupRequestId}`;

    console.log("Cancelling Delhivery pickup:", pickupRequestId);

    const res = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${DELHIVERY_API_KEY}`,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Delhivery cancel error:", res.status, text);
      throw new Error(`Cancel failed: ${res.status}`);
    }

    const data = await res.json();
    console.log("Delhivery pickup cancelled:", data);
    return data;
  },
};
