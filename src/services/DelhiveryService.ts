/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

const DELHIVERY_API_KEY = import.meta.env.VITE_DELHIVERY_API_KEY || "";
const DELHIVERY_BASE_URL = "https://ltl-clients-api-dev.delhivery.com";
const DELHIVERY_PICKUP_URL = import.meta.env.VITE_DELHIVERY_PICKUP_URL || "https://track.delhivery.com/fm/request/new/";
const DELHIVERY_PICKUP_TIME = import.meta.env.VITE_DELHIVERY_PICKUP_TIME || "11:00:00";
const API_URL = import.meta.env.VITE_API_URL || "";
const USE_MOCK_DELIVERY = import.meta.env.VITE_USE_MOCK_DELIVERY !== "false"; // ✅ Default to true

// Pickup location configuration
export interface PickupLocation {
  name: string;
  clientCode: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

export interface PickupRequestResponse {
  success: boolean;
  mock?: boolean;
  pickupRequestId: string;
  orderId: string;
  trackingUrl: string;
  status: string;
  message?: string;
  data?: any;
}

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
  // Inside DelhiveryService (backend)

  async createPickupRequest(params: {
    orderId: string;            // your OD000xxxx id (used as AWB + order_id)
    clientWarehouse: string;    // e.g. "test" (from Delhivery dashboard)
    expectedPackageCount?: number;
    pickupDate?: string;        // "YYYY-MM-DD" (optional; default = tomorrow)
    startTime?: string;         // "HH:MM:SS" (optional; default = "09:00:00")
  }): Promise<any> {
    const {
      orderId,
      clientWarehouse,
      expectedPackageCount,
      pickupDate,
      startTime = "09:00:00",
    } = params;

    // Mock mode (no real API call)
    if (USE_MOCK_DELIVERY || !DELHIVERY_API_KEY) {
      console.log("✅ Using mock pickup creation for order:", orderId);

      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        mock: true,
        request_id: `mock_pur_${orderId}`,
        status: "created",
      };
    }

    // Default pickup date = tomorrow
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

  // =========================
  // 5) Get Pickup Location (Plantasy)
  // =========================
  async getPickupLocation(): Promise<PickupLocation> {
    try {
      const response = await fetch(`${API_URL}/api/shipping/pickup-location`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch pickup location");
      }

      const data = await response.json();
      return data.pickupLocation as PickupLocation;
    } catch (error) {
      console.error("Error fetching pickup location:", error);
      // Return default Plantasy location
      return {
        name: "Plantasy",
        clientCode: "PLANTASY_WH1",
        addressLine1: "7-4-37/a, Raja colony",
        addressLine2: "Near DArgah Centere",
        city: "Peddapuram",
        state: "Andhra Pradesh",
        pincode: "53347",
        phone: "9876543210",
      };
    }
  },

  // =========================
  // 6) Create Pickup Request via Server (for automatic pickup)
  // =========================
  async createPickupViaServer(params: {
    orderId: string;
    orderItems?: any[];
    expectedPackageCount?: number;
  }): Promise<PickupRequestResponse> {
    const { orderId, orderItems, expectedPackageCount = 1 } = params;

    try {
      const response = await fetch(`${API_URL}/api/shipping/create-pickup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
          orderItems,
          expectedPackageCount,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server pickup creation error:", response.status, errorText);
        throw new Error(`Pickup creation failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Pickup created via server:", data);
      return data as PickupRequestResponse;
    } catch (error) {
      console.error("Error creating pickup via server:", error);
      throw error;
    }
  },

  // =========================
  // 7) Generate Tracking URL
  // =========================
  generateTrackingUrl(orderId: string): string {
    return `https://track.delhivery.com/${orderId}`;
  },

  // =========================
  // 8) Generate Shipping Label
  // =========================
  async generateLabel(params: {
    orderId: string;
    orderItems?: any[];
  }): Promise<{
    success: boolean;
    mock?: boolean;
    orderId: string;
    labelUrl: string;
    manifestUrl?: string;
    message?: string;
  }> {
    const { orderId } = params;

    try {
      const response = await fetch(`${API_URL}/api/shipping/generate-label`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Label generation error:", response.status, errorText);
        throw new Error(`Label generation failed: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Label generated:", data);
      return data;
    } catch (error) {
      console.error("Error generating label:", error);
      throw error;
    }
  },

  // =========================
  // 9) Get Label URL for Download
  // =========================
  async getLabelUrl(orderId: string): Promise<string> {
    try {
      const response = await fetch(`${API_URL}/api/shipping/label/${orderId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get label: ${response.status}`);
      }

      const data = await response.json();
      return data.labelUrl || `${API_URL}/api/shipping/label/${orderId}`;
    } catch (error) {
      console.error("Error getting label URL:", error);
      // Return direct URL as fallback
      return `${API_URL}/api/shipping/label/${orderId}`;
    }
  },

  // =========================
  // 10) Download Label (opens in new tab)
  // =========================
  downloadLabel(orderId: string): void {
    const labelUrl = `${API_URL}/api/shipping/label/${orderId}`;
    window.open(labelUrl, '_blank');
  },

  // =========================
  // 11) Create Pickup Request (New Endpoint with Token Auth)
  // =========================
  // Uses the specific Delhivery endpoint: https://track.delhivery.com/fm/request/new/
  // with Token-based authentication
  async createPickupRequestNew(params: {
    orderId: string;
    pickupLocation?: string;
    expectedPackageCount?: number;
    pickupDate?: string;
    pickupTime?: string;
  }): Promise<PickupRequestResponse> {
    const {
      orderId,
      pickupLocation = import.meta.env.VITE_WAREHOUSE_NAME || "warehouse_name",
      expectedPackageCount = 1,
      pickupDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      pickupTime = DELHIVERY_PICKUP_TIME,
    } = params;

    // Log configuration for debugging
    console.log("🔧 Delhivery Config:", {
      USE_MOCK_DELIVERY,
      hasApiKey: !!DELHIVERY_API_KEY,
      apiKeyPrefix: DELHIVERY_API_KEY ? DELHIVERY_API_KEY.substring(0, 8) + "..." : "none",
      pickupUrl: DELHIVERY_PICKUP_URL,
      pickupTime,
      pickupLocation,
    });

    // Mock mode - check both USE_MOCK_DELIVERY flag and if API key is missing
    if (USE_MOCK_DELIVERY || !DELHIVERY_API_KEY) {
      console.log("✅ Using mock pickup creation (new endpoint) for order:", orderId);
      await new Promise((resolve) => setTimeout(resolve, 500));

      return {
        mock: true,
        pickupRequestId: `mock_pur_${orderId}`,
        orderId,
        trackingUrl: `https://track.delhivery.com/${orderId}`,
        status: "created",
        success: true,
        message: "Pickup request created successfully (mock mode)",
      };
    }

    // Production mode - real API call
    console.log("🚀 Creating REAL Delhivery pickup request for order:", orderId);

    const url = DELHIVERY_PICKUP_URL;

    const body = {
      pickup_time: pickupTime,
      pickup_date: pickupDate,
      pickup_location: pickupLocation,
      expected_package_count: expectedPackageCount,
    };

    console.log("📦 Pickup Request Details:", {
      url,
      body,
      headers: {
        Authorization: `Token ${DELHIVERY_API_KEY.substring(0, 8)}...`,
        "Content-Type": "application/json",
      },
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Token ${DELHIVERY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      console.log("📥 Delhivery API Response Status:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Delhivery pickup error (new endpoint):", response.status, errorText);
        return {
          success: false,
          pickupRequestId: "",
          orderId,
          trackingUrl: "",
          status: "failed",
          message: `Pickup request failed: ${response.status} - ${errorText}`,
        };
      }

      const data = await response.json();
      console.log("✅ Delhivery pickup created successfully (new endpoint):", data);

      return {
        success: true,
        pickupRequestId: data.request_id || data.id || orderId,
        orderId,
        trackingUrl: data.tracking_url || `https://track.delhivery.com/${orderId}`,
        status: "pickup_scheduled",
        message: "Pickup request created successfully",
        data,
      };
    } catch (error) {
      console.error("❌ Error creating pickup request (new endpoint):", error);
      return {
        success: false,
        pickupRequestId: "",
        orderId,
        trackingUrl: "",
        status: "error",
        message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
};
