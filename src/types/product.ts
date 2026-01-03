/* eslint-disable @typescript-eslint/no-explicit-any */
// src/types/product.ts
export type ProductCategory =
  | "plants"
  | "pots"
  | "seeds"
  | "subscriptions"
  | "sale"
  | "new-arrivals"
  | string;

export interface Product {
  id: string;
  category: ProductCategory;
  coverImage: string;
  hoverImage?: string;
  images?: string[];
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  stock?: number;
  isActive?: boolean;
  badge?: string; // e.g. "New Arrival", "Sale"
  createdAt?: any;
  updatedAt?: any;
}
