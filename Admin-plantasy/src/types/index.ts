/* eslint-disable @typescript-eslint/no-explicit-any */
// User & Authentication Types
export type AdminRole = 'super_admin' | 'editor' | 'support';

export interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
  createdAt: Date;
  lastLogin: Date;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  // Use null to mean "no discount" so Firestore never receives undefined
  discountPrice: number | null;
  stock: number;
  category: string;
  sku: string;
  plantType: "Soil-less" | "Soil-Base" | "Both" | "None of the above";
  policy: "return" | "replacement" | "both" | "none";
  images: string[];
  videos?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}


// Order Types
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image?: string;
}

export interface Order {
  grandTotal: any;
  orderId: any;
  deliveryAddress: any;
  pricing: any;
  orderStatus: string;
  timestamps: any;
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Coupon Types
export type DiscountType = 'percentage' | 'flat';

export interface Coupon {
  startDate: any;
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderValue: number;
  applicableProducts: string[];
  applicableCategories: string[];
  expiryDate: Date;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  createdAt: Date;
}

// Blog Types
export interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  coverImage: string;
  galleryImages: string[];
  author: string;
  seoTitle: string;
  seoDescription: string;
  isPublished: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Review Types
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  id: string;
  productId: string;
  productName: string;
  customerId: string;
  customerName: string;
  rating: number;
  title: string;
  content: string;
  status: ReviewStatus;
  adminReply?: string;
  createdAt: Date;
}

// Support Ticket Types
// export type TicketStatus = 'open' | 'in_progress' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';

export type TicketStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export interface TicketMessage {
  id: string;
  senderId: string;
  senderName: string;
  isAdmin: boolean;
  message: string;
  createdAt: Date | { toDate: () => Date };
}

export interface SupportTicket {
  id: string;            // Firestore doc id
  Id: string;            // "SUP000654321"
  ticketId: string;      // "654321"
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  subject: string;
  message: string;       // main user message
  report?: string;       // extra report text
  status: TicketStatus;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSeen?: Date;
  messages: TicketMessage[];
}


// Dashboard Stats
export interface DashboardStats {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  activeCoupons: number;
  pendingOrders: number;
  lowStockProducts: number;
}
