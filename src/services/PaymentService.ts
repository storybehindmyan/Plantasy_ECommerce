/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "../firebase/firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import type { PaymentDetails } from "../types/payment";

/** Same origin in dev/preview (Vite middleware); override for a remote API if needed */
const API_URL = import.meta.env.VITE_API_URL || "";

export const PaymentService = {
  async storePaymentDetails(
    paymentData: Omit<PaymentDetails, "createdAt">
  ): Promise<void> {
    try {
      const paymentRef = doc(db, "payments", paymentData.paymentId);

      await setDoc(paymentRef, {
        ...paymentData,
        createdAt: serverTimestamp(),
      });

      // console.log("Payment stored:", paymentData.paymentId);
    } catch (error) {
      console.error("Error storing payment:", error);
      throw error;
    }
  },

  async createRazorpayOrder(amount: number): Promise<string> {
    try {
      // ✅ Use correct backend URL
      const response = await fetch(`${API_URL}/api/razorpay/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          receipt: `rcpt_${Date.now()}`,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Backend error:", errorText);
        throw new Error("Failed to create order");
      }

      const data = (await response.json()) as any;
      return data.orderId;
    } catch (error) {
      console.error("Error creating Razorpay order:", error);
      throw error;
    }
  },

  async verifyRazorpayPayment(payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Promise<void> {
    const response = await fetch(`${API_URL}/api/razorpay/verify-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || "Payment signature verification failed");
    }

    const data = (await response.json()) as { verified?: boolean };
    if (!data.verified) {
      throw new Error("Payment signature is invalid");
    }
  },
};