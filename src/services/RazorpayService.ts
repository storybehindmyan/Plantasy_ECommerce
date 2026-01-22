/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;

export const RazorpayService = {
  async loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => {
        console.log("✅ Razorpay script loaded");
        resolve(true);
      };
      script.onerror = () => {
        console.error("❌ Failed to load Razorpay script");
        resolve(false);
      };
      document.body.appendChild(script);
    });
  },

  async initiatePayment(
    amount: number,
    orderId: string,
    userEmail: string,
    phone: string,
    onSuccess: (response: any) => void,
    onError: (error: any) => void
  ): Promise<void> {
    const scriptLoaded = await this.loadRazorpayScript();
    if (!scriptLoaded) {
      onError(new Error("Failed to load Razorpay"));
      return;
    }

    // ✅ Check if key exists
    if (!RAZORPAY_KEY_ID) {
      console.error("❌ VITE_RAZORPAY_KEY_ID not set in .env.local");
      onError(new Error("Razorpay key not configured"));
      return;
    }

    console.log("🔑 Using Razorpay Key:", RAZORPAY_KEY_ID.slice(0, 10) + "...");
    console.log("💰 Amount:", amount, "paisa");
    console.log("📝 Order ID:", orderId);

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: amount,
      currency: "INR",
      name: "Plantasy",
      description: `Order Payment`,
      order_id: orderId, // ✅ Must be valid Razorpay order ID
      handler: function (response: any) {
        console.log("✅ Payment Success:", response);
        onSuccess(response);
      },
      prefill: {
        email: userEmail,
        contact: phone,
      },
      theme: {
        color: "#BF6D40",
      },
      modal: {
        ondismiss: function () {
          console.log("❌ Payment modal dismissed");
          onError(new Error("Payment cancelled by user"));
        },
      },
    };

    console.log("🚀 Opening Razorpay with options:", options);

    try {
      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', function (response: any) {
        console.error("❌ Payment failed:", response.error);
        onError(response.error);
      });
      razorpay.open();
    } catch (error) {
      console.error("❌ Error opening Razorpay:", error);
      onError(error);
    }
  },
};
