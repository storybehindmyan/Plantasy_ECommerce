/* eslint-disable @typescript-eslint/no-explicit-any */

const API_URL = import.meta.env.VITE_API_URL || "";

export type ShippingQuoteItem = { productId: string; quantity: number };

export type ShippingQuoteResponse = {
  courier: "Delhivery";
  shippingCost: number;
  estimatedDelivery: string;
  serviceable: boolean;
  serviceType?: string;
  devMode?: boolean;
  billableWeightGrams?: number;
  error?: string;
};

export const ShippingQuoteService = {
  async quote(pincode: string, items: ShippingQuoteItem[]): Promise<ShippingQuoteResponse> {
    const res = await fetch(`${API_URL}/api/shipping/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pincode, items }),
    });

    const data = (await res.json()) as any;

    if (!res.ok || data.serviceable === false) {
      throw new Error(data.error || "Delivery not available for this location");
    }

    return data as ShippingQuoteResponse;
  },
};

