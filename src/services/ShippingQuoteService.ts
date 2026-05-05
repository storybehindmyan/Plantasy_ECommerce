/* eslint-disable @typescript-eslint/no-explicit-any */

const API_URL = import.meta.env.VITE_API_URL || "";

export type ShippingQuoteItem = { productId: string; quantity: number };

export type ShippingQuoteResponse = {
  courier: "Delhivery";
  shippingCost: number;
  estimatedDelivery: string;
  billableWeightGrams?: number;
};

export const ShippingQuoteService = {
  async quote(pincode: string, items: ShippingQuoteItem[]): Promise<ShippingQuoteResponse> {
    const res = await fetch(`${API_URL}/api/shipping/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pincode, items }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to fetch shipping quote");
    }

    return (await res.json()) as any;
  },
};

