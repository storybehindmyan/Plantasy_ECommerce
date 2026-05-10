/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { toast } from "sonner";
import { generateOrderId } from "../utils/orderIdGenerator";
import { PaymentService } from "../services/PaymentService";
import { RazorpayService } from "../services/RazorpayService";
import { orderService } from "../services/OrderService";
import { DelhiveryService } from "../services/DelhiveryService";
import { ShippingQuoteService } from "../services/ShippingQuoteService";
import type { OrderData, PaymentDetails } from "../types/payment";
import { Timestamp } from "firebase/firestore";
import type { CartItem } from "../context/CartContext";
import {getDoc, setDoc, doc} from "firebase/firestore"; 
import { db } from "../firebase/firebaseConfig";

const API_URL = import.meta.env.VITE_API_URL || "";

interface CheckoutParams {
  deliveryAddress: any;
  cartItems: CartItem[];
  totalAmount: number;
  pricing: any;
}

export const useCheckout = () => {
  const { user } = useAuth();
  const { removeFromCart } = useCart();
  const [paymentStatus, setPaymentStatus] = useState<
    "idle" | "pending" | "success" | "failed"
  >("idle");
  const [currentOrderId, setCurrentOrderId] = useState<string>("");

  const handleCheckout = async (params: CheckoutParams) => {
    try {
      if (!user?.uid) {
        toast.error("Please login to continue");
        setPaymentStatus("failed");
        return;
      }

      setPaymentStatus("pending");

      // 1. Generate Order ID
      const orderId = generateOrderId();
      setCurrentOrderId(orderId);

      // 2. Use shippingCharge from caller if provided; otherwise fetch from API
      let deliveryCharge = Number(params.pricing?.shippingCharge) || 0;
      let estimatedDelivery: string | null = null;
      if (!deliveryCharge) {
        try {
          const quote = await ShippingQuoteService.quote(
            params.deliveryAddress.zip,
            params.cartItems.map((it) => ({
              productId: it.id,
              quantity: it.quantity,
            }))
          );
          deliveryCharge = Number(quote.shippingCost) || 0;
          estimatedDelivery = quote.estimatedDelivery || null;
        } catch (e) {
          console.error("Shipping quote failed, falling back:", e);
          const deliveryAvailable = await DelhiveryService.verifyDeliveryAvailability(
            params.deliveryAddress.zip
          );
          if (!deliveryAvailable) {
            toast.error("Delivery not available for this location");
            setPaymentStatus("failed");
            return;
          }
          deliveryCharge = await DelhiveryService.getDeliveryCharges(
            params.deliveryAddress.zip
          );
        }
      }

      // 3. Compute final amount using exact values from caller
      const finalAmount =
        Number(params.pricing?.subTotal || 0) +
        Number(params.pricing?.tax || 0) -
        Number(params.pricing?.discount || 0) +
        deliveryCharge;
      const amountInPaisa = Math.round(finalAmount * 100);

      // 4. Create Razorpay order (backend)
      const razorpayOrderId = await PaymentService.createRazorpayOrder(
        amountInPaisa
      );

      // 5. Initiate Razorpay payment
      await RazorpayService.initiatePayment(
        amountInPaisa,
        razorpayOrderId,
        user.email || "",
        params.deliveryAddress.phone,
        async (response) => {
          // Payment success callback
          await handlePaymentSuccess(
            response,
            orderId,
            params,
            deliveryCharge,
            razorpayOrderId,
            estimatedDelivery,
            finalAmount
          );
        },
        (error) => {
          // Payment error callback
          handlePaymentError(error, orderId, params.deliveryAddress?.phone || "", finalAmount);
        }
      );
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Error initiating checkout. Please try again.");
      setPaymentStatus("failed");
    }
  };

  const handlePaymentSuccess = async (
    razorpayResponse: any,
    orderId: string,
    params: CheckoutParams,
    deliveryCharge: number,
    razorpayOrderId: string,
    estimatedDelivery: string | null,
    finalAmount: number
  ) => {
    try {
      await PaymentService.verifyRazorpayPayment({
        razorpay_order_id: razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature: razorpayResponse.razorpay_signature,
      });

      // 1. Store payment details
      const paymentData: Omit<PaymentDetails, "createdAt"> = {
        uid: user?.uid || "",
        paymentId: razorpayResponse.razorpay_payment_id,
        transactionId: razorpayResponse.razorpay_payment_id,
        orderId,
        amount: finalAmount,
        paymentMethod: "Razorpay",
        transactionRef: razorpayOrderId,
        status: "SUCCESS",
      };

      await PaymentService.storePaymentDetails(paymentData);

      // 2. Sanitize deliveryAddress to avoid undefined fields
      const addr = params.deliveryAddress || {};
      const safeDeliveryAddress = {
        firstName: addr.firstName ?? "",
        lastName: addr.lastName ?? "",
        addressLine1: addr.addressLine1 ?? "",
        addressLine2: addr.addressLine2 ?? "",
        city: addr.city ?? "",
        region: addr.region ?? "",
        zip: addr.zip ?? "",
        country: addr.country ?? "", // <-- no undefined
        phone: addr.phone ?? "",
      };

      // 3. Create order document
      const invoiceId = `INV${Date.now().toString().slice(-10)}`;

      const orderData: Omit<OrderData, "createdAt" | "updatedAt"> = {
        uid: user?.uid || "",
        orderId,
        invoiceId,
        orderStatus: "PENDING",
        orderType: "NORMAL",
        isCancelable: true,
        isReturnEligible: true,
        deliveryAddress: safeDeliveryAddress,
        items: params.cartItems.map((item) => ({
          productId: item.id,
          productName: item.name,
          productImage: item.coverImage,
          price: item.price,
          quantity: item.quantity,
          totalPrice: item.price * item.quantity,
          type: item.type,
        })),
        payment: {
          paymentId: razorpayResponse.razorpay_payment_id,
          paymentMethod: "RAZORPAY",
          paymentStatus: "PAID",
          transactionRef: razorpayOrderId,
        },
        pricing: {
          subTotal: params.pricing.subTotal,
          tax: params.pricing.tax,
          discount: params.pricing.discount,
          couponCode: params.pricing.couponCode || "",
          shippingCharge: deliveryCharge,
          grandTotal: finalAmount,
        },
        estimatedDelivery: estimatedDelivery || "",
        timestamps: {
          orderedAt: Timestamp.now(),
          confirmedAt: Timestamp.now(),
          shippedAt: null,
          deliveredAt: null,
          updatedAt: Timestamp.now(),
        },
        track: "",
      };

      await orderService.createOrder(orderData);

      //Add orderId in user's order history array
      const userOrdersRef = doc(db, "users", user?.uid || "");
      const userOrdersSnap = await getDoc(userOrdersRef);
      if (userOrdersSnap.exists()) {
        const userData = userOrdersSnap.data();
        const existingOrders: string[] = userData.orders || [];
        await setDoc(
          userOrdersRef,
          { orders: [...existingOrders, orderId] },
          { merge: true }
        );
      }else{
        console.error("User document does not exist to update order history");
      }

      // 4. Clear cart items
      params.cartItems.forEach((item) => {
        removeFromCart(item.id);
      });


      // 5. Trigger Delhivery shipment + WhatsApp confirmation via backend
      try {
        const addr = params.deliveryAddress || {};
        await fetch(`${API_URL}/api/orders/paid`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            phone: addr.phone || "",
            name: `${addr.firstName || ""} ${addr.lastName || ""}`.trim(),
            amount: finalAmount,
          }),
        });
      } catch (e) {
        console.error("Order post-processing failed (non-critical):", e);
      }

      // 6. Update payment status
      setPaymentStatus("success");
      toast.success("Order placed successfully!");

      // 7. Store order ID for later
      localStorage.setItem("lastOrderId", orderId);
    } catch (error) {
      console.error("Error processing payment success:", error);
      toast.error("Error creating order. Please contact support.");
      setPaymentStatus("failed");
    }
  };

  const handlePaymentError = async (error: any, orderId: string, phone = "", amount = 0) => {
    try {
      // Store failed payment attempt
      const paymentData: Omit<PaymentDetails, "createdAt"> = {
        uid: user?.uid || "",
        paymentId: `FAILED_${Date.now()}`,
        transactionId: `FAILED_${Date.now()}`,
        orderId,
        amount: 0,
        paymentMethod: "RAZORPAY",
        transactionRef: "FAILED",
        status: "FAILED",
      };

      await PaymentService.storePaymentDetails(paymentData);
    } catch (err) {
      console.error("Error storing failed payment:", err);
    }

    setPaymentStatus("failed");
    toast.error(error.message || "Payment failed. Please try again.");

    try {
      if (phone) {
        await fetch(`${API_URL}/api/whatsapp/payment-failed`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone,
            name: "",
            amount,
            retryUrl: "https://plantasy.co.in/checkout",
          }),
        });
      }
    } catch (e) {
      console.error("WhatsApp payment-failed notification error:", e);
    }
  };

  return {
    paymentStatus,
    currentOrderId,
    handleCheckout,
    setPaymentStatus, // Export this to reset state if needed
  };
};
