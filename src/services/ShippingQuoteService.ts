/* eslint-disable @typescript-eslint/no-explicit-any */

const API_URL = import.meta.env.VITE_API_URL || "";

// Item with optional dimensions for accurate shipping calculation
export interface ShippingQuoteItem {
  productId: string;
  quantity: number;
  dimensions?: {
    height: string;
    width: string;
    length: string;
    weight: number;
  };
}

export type ShippingQuoteResponse = {
  courier: "Delhivery";
  shippingCost: number;
  estimatedDelivery: string;
  billableWeightGrams?: number;
  volumetricWeightKg?: number;
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

  // Helper: Format dimensions from product data
  formatItemWithDimensions(product: any, quantity: number): ShippingQuoteItem {
    return {
      productId: product.id,
      quantity,
      dimensions: product.dimensions || {
        height: "10cm",
        width: "10cm",
        length: "10cm",
        weight: 500,
      },
    };
  },

  // Helper: Calculate shipping for cart items with product dimensions
  async quoteWithProducts(
    pincode: string,
    cartItems: Array<{ id: string; quantity: number; dimensions?: any }>
  ): Promise<ShippingQuoteResponse> {
    const items: ShippingQuoteItem[] = cartItems.map((item) => ({
      productId: item.id,
      quantity: item.quantity,
      dimensions: item.dimensions,
    }));

    return this.quote(pincode, items);
  },
};