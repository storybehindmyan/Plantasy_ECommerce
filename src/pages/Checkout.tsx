/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import AddressForm from "../components/AddressForm";
import CheckoutSummary from "../components/CheckoutSummary";
import PaymentModal from "../components/PaymentModal";
import { useCheckout } from "../hooks/useCheckout";
import { toast } from "sonner";
import { DelhiveryService } from "../services/DelhiveryService";

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cart, cartTotal } = useCart();
  const { user } = useAuth();
  const { paymentStatus, currentOrderId, handleCheckout } = useCheckout();
  

  const [deliveryAddress, setDeliveryAddress] = useState<any | null>(null);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [isLoadingDelivery, setIsLoadingDelivery] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Redirect if no items in cart
  if (!cart || cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-32">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">
            Your cart is empty
          </h1>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-[#c16e41] text-white rounded-lg hover:bg-[#a05a32] transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // Redirect if not logged in
  if (!user?.uid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-32">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">
            Please login to continue
          </h1>
          <button
            onClick={() => navigate("/login")}
            className="px-6 py-3 bg-[#c16e41] text-white rounded-lg hover:bg-[#a05a32] transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleAddressSubmit = async (address: any) => {
    try {
      setIsLoadingDelivery(true);
      setDeliveryAddress(address);

      // Get delivery charges
      const charges = await DelhiveryService.getDeliveryCharges(address.zip);
      setDeliveryCharge(charges);

      toast.success("Address verified successfully!");
    } catch (error) {
      console.error("Error processing address:", error);
      toast.error("Error processing address");
      setDeliveryAddress(null);
    } finally {
      setIsLoadingDelivery(false);
    }
  };

  const handlePaymentClick = async () => {
    if (!deliveryAddress) {
      toast.error("Please provide delivery address");
      return;
    }

     if (paymentStatus === "idle") {
    setShowPaymentModal(true);
  }
    // Calculate pricing
    const subtotal = cartTotal;
    const tax = Math.round(subtotal * 0.05); // 5% tax
    const finalTotal = subtotal + tax + deliveryCharge;

    setShowPaymentModal(true);

    await handleCheckout({
    deliveryAddress,
    cartItems: cart,
    totalAmount: finalTotal,
    pricing: {
      subTotal: subtotal,
      tax,
      discount: 0,
      couponCode: "",
      shippingCharge: deliveryCharge,
      grandTotal: finalTotal,
    },
  });
};

  const subtotal = cartTotal;
  const tax = Math.round(subtotal * 0.05);
  // const finalTotal = subtotal + tax + deliveryCharge;

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-12">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-12 text-gray-800">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Checkout Area */}
          <div className="lg:col-span-2 space-y-8">
            {!deliveryAddress ? (
              <AddressForm
                onAddressSubmit={handleAddressSubmit}
                isLoading={isLoadingDelivery}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Delivery Address
                  </h2>
                  <button
                    onClick={() => setDeliveryAddress(null)}
                    className="text-[#c16e41] hover:text-[#a05a32] underline"
                  >
                    Change
                  </button>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold text-gray-800 mb-2">
                    {deliveryAddress.firstName} {deliveryAddress.lastName}
                  </p>
                  <p className="text-gray-600 text-sm mb-1">
                    {deliveryAddress.addressLine1}
                  </p>
                  {deliveryAddress.addressLine2 && (
                    <p className="text-gray-600 text-sm mb-1">
                      {deliveryAddress.addressLine2}
                    </p>
                  )}
                  <p className="text-gray-600 text-sm mb-1">
                    {deliveryAddress.city}, {deliveryAddress.region}{" "}
                    {deliveryAddress.zip}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {deliveryAddress.country}
                  </p>
                  <p className="text-gray-600 text-sm mt-2">
                    Phone: {deliveryAddress.phone}
                  </p>
                </div>

                {/* Payment Button */}
                <button
                  onClick={handlePaymentClick}
                  disabled={paymentStatus === "pending"}
                  className="w-full mt-8 px-6 py-4 bg-[#c16e41] text-white font-bold text-lg rounded-lg hover:bg-[#a05a32] disabled:opacity-50 transition-colors"
                >
                  {paymentStatus === "pending"
                    ? "Processing Payment..."
                    : "Proceed to Payment"}
                </button>
              </div>
            )}
          </div>

          {/* Summary Sidebar */}
          <div className="lg:col-span-1">
            <CheckoutSummary
              cartItems={cart}
              deliveryAddress={deliveryAddress}
              pricing={{
                subTotal: subtotal,
                tax,
                discount: 0,
                couponCode: "",
              }}
              deliveryCharge={deliveryCharge}
            />
          </div>
        </div>
      </div>

      {/* Payment Status Modal */}
      <PaymentModal
    isOpen={showPaymentModal}
    status={paymentStatus}
    orderId={currentOrderId}
    message="Payment could not be processed"
    onClose={() => {
      setShowPaymentModal(false);
      if (paymentStatus === "success") {
        // Clear cart and navigate
        navigate("/profile/orders");
      }
    }}
  />
    </div>
  );
};

export default Checkout;
