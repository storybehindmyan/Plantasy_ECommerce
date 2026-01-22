/* eslint-disable @typescript-eslint/no-explicit-any */
export interface PaymentDetails {
  uid: string;
  paymentId: string;
  transactionId: string;
  orderId: string;
  amount: number;
  paymentMethod: string;
  transactionRef: string;
  status: "PENDING" | "SUCCESS" | "FAILED";
  createdAt: any; // Timestamp
}

export interface OrderData {
  uid: string;
  orderId: string;
  invoiceId: string;
  orderStatus: string;
  orderType: string;
  isCancelable: boolean;
  isReturnEligible: boolean;
  
  deliveryAddress: {
    firstName: string;
    lastName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    region: string;
    zip: string;
    country: string;
  };
  
  items: Array<{
    productId: string;
    productName: string;
    productImage: string;
    price: number;
    quantity: number;
    totalPrice: number;
    type: string;
  }>;
  
  payment: {
    paymentId: string;
    paymentMethod: string;
    paymentStatus: string;
    transactionRef: string;
  };
  
  pricing: {
    subTotal: number;
    tax: number;
    discount: number;
    couponCode?: string;
    shippingCharge: number;
    grandTotal: number;
  };
  
  timestamps: {
    orderedAt: any;
    confirmedAt?: any;
    shippedAt?: any;
    deliveredAt?: any;
    updatedAt: any;
  };
  
  track?: string;
  createdAt: any;
  updatedAt: any;
}
