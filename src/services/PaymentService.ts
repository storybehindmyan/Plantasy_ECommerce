/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "../firebase/firebaseConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import type { PaymentDetails } from "../types/payment";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"; // ✅ Backend URL

export const PaymentService = {
  async storePaymentDetails(
    paymentData: Omit<PaymentDetails, "createdAt">
  ): Promise<void> {
    try {
      const paymentRef = doc(db, "payment", paymentData.paymentId);

      await setDoc(paymentRef, {
        ...paymentData,
        createdAt: serverTimestamp(),
      });

      console.log("Payment stored:", paymentData.paymentId);
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
        body: JSON.stringify({ amount }),
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
};
