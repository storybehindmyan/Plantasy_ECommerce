/* eslint-disable @typescript-eslint/no-explicit-any */

const API_URL = import.meta.env.VITE_API_URL || "";

export const DelhiveryService = {
  // PIN serviceability — proxied through the backend so no API key is exposed in the browser
  async verifyDeliveryAvailability(pinCode: string): Promise<boolean> {
    if (!/^\d{6}$/.test(pinCode)) return false;

    try {
      const res = await fetch(`${API_URL}/api/shipping/verify/${pinCode}`);
      if (!res.ok) return /^\d{6}$/.test(pinCode);
      const data = (await res.json()) as any;
      return data?.available === true || data?.serviceable === true;
    } catch {
      return /^\d{6}$/.test(pinCode);
    }
  },

  // Delivery charge — proxied through the backend
  async getDeliveryCharges(pinCode: string, _weight: number = 0.5): Promise<number> {
    try {
      const res = await fetch(`${API_URL}/api/shipping/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode: pinCode, items: [{ productId: "fallback", quantity: 1 }] }),
      });
      if (!res.ok) return 50;
      const data = (await res.json()) as any;
      return typeof data?.shippingCost === "number" ? data.shippingCost : 50;
    } catch {
      return 50;
    }
  },
};
