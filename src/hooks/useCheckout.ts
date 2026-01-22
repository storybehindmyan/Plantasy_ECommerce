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
import type { OrderData, PaymentDetails } from "../types/payment";
import { Timestamp } from "firebase/firestore";
import type { CartItem } from "../context/CartContext";


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

      // 2. Verify delivery one more time
      const deliveryAvailable =
        await DelhiveryService.verifyDeliveryAvailability(
          params.deliveryAddress.zip
        );

      if (!deliveryAvailable) {
        toast.error("Delivery not available for this location");
        setPaymentStatus("failed");
        return;
      }

      // 3. Get delivery charges
      const deliveryCharge = await DelhiveryService.getDeliveryCharges(
        params.deliveryAddress.zip
      );
      console.log("Delivery Charge:", deliveryCharge);

      
      const finalAmount = params.totalAmount + deliveryCharge;
      const amountInPaisa = Math.round(finalAmount * 100); // Convert to paisa

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
            razorpayOrderId
          );
        },
        (error) => {
          // Payment error callback
          handlePaymentError(error, orderId);
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
    razorpayOrderId: string
  ) => {
    try {
      // 1. Store payment details
      const paymentData: Omit<PaymentDetails, "createdAt"> = {
        uid: user?.uid || "",
        paymentId: razorpayResponse.razorpay_payment_id,
        transactionId: razorpayResponse.razorpay_payment_id,
        orderId,
        amount: params.totalAmount + deliveryCharge,
        paymentMethod: "Razorpay",
        transactionRef: razorpayOrderId,
        status: "SUCCESS",
      };

      await PaymentService.storePaymentDetails(paymentData);

      // 2. Create order document
      const invoiceId = `INV${Date.now().toString().slice(-10)}`;

      const orderData: Omit<OrderData, "createdAt" | "updatedAt"> = {
        uid: user?.uid || "",
        orderId,
        invoiceId,
        orderStatus: "PENDING",
        orderType: "NORMAL",
        isCancelable: true,
        isReturnEligible: true,
        deliveryAddress: params.deliveryAddress,
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
          grandTotal: params.totalAmount + deliveryCharge,
        },
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

      // 3. Clear cart items
      params.cartItems.forEach((item) => {
        removeFromCart(item.id);
      });

      // 4. Update payment status
      setPaymentStatus("success");
      toast.success("Order placed successfully!");

      // 5. Store order ID for later
      localStorage.setItem("lastOrderId", orderId);
    } catch (error) {
      console.error("Error processing payment success:", error);
      toast.error("Error creating order. Please contact support.");
      setPaymentStatus("failed");
    }
  };

  const handlePaymentError = async (error: any, orderId: string) => {
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
  };

  return {
    paymentStatus,
    currentOrderId,
    handleCheckout,
    setPaymentStatus, // Export this to reset state if needed
  };
};
