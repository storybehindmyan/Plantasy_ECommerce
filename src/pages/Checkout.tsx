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
import { MapPin, Truck, CheckCircle } from "lucide-react";
import { DelhiveryService } from "../services/DelhiveryService";
import { ShippingQuoteService } from "../services/ShippingQuoteService";

type CheckoutStep = "address" | "delivery" | "payment";

const STEPS = [
  { key: "address", label: "Address" },
  { key: "delivery", label: "Delivery" },
  { key: "payment", label: "Payment" },
] as const;

const Checkout: React.FC = () => {
  const navigate = useNavigate();
  const { cart, cartTotal } = useCart();
  const { user } = useAuth();
  const { paymentStatus, currentOrderId, handleCheckout } = useCheckout();

  const [step, setStep] = useState<CheckoutStep>("address");
  const [deliveryAddress, setDeliveryAddress] = useState<any | null>(null);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [estimatedDelivery, setEstimatedDelivery] = useState<string | null>(null);
  const [courierName, setCourierName] = useState("Delhivery");
  const [isLoadingDelivery, setIsLoadingDelivery] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const subtotal = cartTotal;
  const tax = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + tax + deliveryCharge;

  if (!cart || cart.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-32">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">Your cart is empty</h1>
          <button onClick={() => navigate("/")} className="px-6 py-3 bg-[#c16e41] text-white rounded-lg hover:bg-[#a05a32] transition-colors">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  if (!user?.uid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-32">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">Please login to continue</h1>
          <button onClick={() => navigate("/login")} className="px-6 py-3 bg-[#c16e41] text-white rounded-lg hover:bg-[#a05a32] transition-colors">
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
      try {
        const quote = await ShippingQuoteService.quote(
          address.zip,
          cart.map((it) => ({ productId: it.id, quantity: it.quantity }))
        );
        setDeliveryCharge(Number(quote.shippingCost) || 0);
        setEstimatedDelivery(quote.estimatedDelivery || null);
        setCourierName(quote.courier || "Delhivery");
      } catch (e) {
        console.error("Quote failed, falling back:", e);
        const charges = await DelhiveryService.getDeliveryCharges(address.zip);
        setDeliveryCharge(charges);
        setEstimatedDelivery(null);
      }
      setStep("delivery");
    } catch (error) {
      console.error("Address error:", error);
      toast.error("Error processing address. Please try again.");
      setDeliveryAddress(null);
    } finally {
      setIsLoadingDelivery(false);
    }
  };

  const handleConfirmDelivery = () => {
    setStep("payment");
    setShowPaymentModal(true);
    handleCheckout({
      deliveryAddress,
      cartItems: cart,
      totalAmount: grandTotal,
      pricing: {
        subTotal: subtotal,
        tax,
        discount: 0,
        couponCode: "",
        shippingCharge: deliveryCharge,
        grandTotal,
      },
    });
  };

  const stepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-12">
      <div className="max-w-6xl mx-auto px-4">

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.key}>
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors
                  ${i < stepIndex ? "bg-green-500 text-white" : i === stepIndex ? "bg-[#c16e41] text-white" : "bg-gray-200 text-gray-500"}`}>
                  {i < stepIndex ? <CheckCircle size={18} /> : i + 1}
                </div>
                <span className={`mt-1 text-xs font-medium ${i === stepIndex ? "text-[#c16e41]" : "text-gray-400"}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-16 mx-1 mb-4 transition-colors ${i < stepIndex ? "bg-green-500" : "bg-gray-200"}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">

            {/* ── STEP 1: Address ── */}
            {step === "address" && (
              <AddressForm onAddressSubmit={handleAddressSubmit} isLoading={isLoadingDelivery} />
            )}

            {/* ── STEP 2: Delivery Estimate ── */}
            {step === "delivery" && deliveryAddress && (
              <div className="space-y-4">

                {/* Confirmed Address */}
                <div className="bg-white rounded-xl shadow p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin size={18} className="text-[#c16e41]" />
                      <h3 className="font-semibold text-gray-800">Delivering to</h3>
                    </div>
                    <button
                      onClick={() => { setDeliveryAddress(null); setStep("address"); }}
                      className="text-sm text-[#c16e41] hover:text-[#a05a32] underline"
                    >
                      Change
                    </button>
                  </div>
                  <p className="font-medium text-gray-800">{deliveryAddress.firstName} {deliveryAddress.lastName}</p>
                  <p className="text-gray-500 text-sm mt-0.5">
                    {deliveryAddress.addressLine1}{deliveryAddress.addressLine2 ? `, ${deliveryAddress.addressLine2}` : ""}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {deliveryAddress.city}, {deliveryAddress.region} – {deliveryAddress.zip}
                  </p>
                  <p className="text-gray-500 text-sm">📞 {deliveryAddress.phone}</p>
                </div>

                {/* Delivery Estimate */}
                <div className="bg-white rounded-xl shadow p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Truck size={20} className="text-green-600" />
                    <h3 className="font-semibold text-gray-800 text-lg">Delivery Details</h3>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <p className="text-xs text-gray-500 mb-1 uppercase tracking-wide">Estimated Delivery</p>
                    <p className="text-2xl font-bold text-green-700">
                      {estimatedDelivery || "3–7 Business Days"}
                    </p>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-500">Courier Partner</span>
                      <span className="font-semibold text-gray-800 flex items-center gap-1">
                        🚚 {courierName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-500">Shipping Charge</span>
                      <span className="font-semibold text-gray-800">
                        {deliveryCharge === 0
                          ? <span className="text-green-600">FREE</span>
                          : `₹${deliveryCharge}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="font-medium text-gray-700">₹{subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-500">Tax (5%)</span>
                      <span className="font-medium text-gray-700">₹{tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-800 font-bold text-base">Total Payable</span>
                      <span className="text-[#c16e41] font-bold text-xl">₹{grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleConfirmDelivery}
                    disabled={paymentStatus === "pending"}
                    className="w-full mt-5 px-6 py-4 bg-[#c16e41] text-white font-bold text-lg rounded-xl hover:bg-[#a05a32] disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {paymentStatus === "pending" ? (
                      "Processing..."
                    ) : (
                      <>
                        <span>Confirm &amp; Pay</span>
                        <span className="text-sm font-normal opacity-80">· ₹{grandTotal.toFixed(0)}</span>
                      </>
                    )}
                  </button>
                  <p className="text-center text-xs text-gray-400 mt-2">🔒 Secured by Razorpay</p>
                </div>
              </div>
            )}

            {/* ── STEP 3: Payment processing (modal handles it) ── */}
            {step === "payment" && (
              <div className="bg-white rounded-xl shadow p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c16e41] mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Opening payment gateway...</p>
                <p className="text-gray-400 text-sm mt-1">Please do not close this window</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <CheckoutSummary
              cartItems={cart}
              deliveryAddress={deliveryAddress}
              pricing={{ subTotal: subtotal, tax, discount: 0, couponCode: "" }}
              deliveryCharge={deliveryCharge}
              estimatedDelivery={estimatedDelivery}
            />
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={showPaymentModal}
        status={paymentStatus}
        orderId={currentOrderId}
        message="Payment could not be processed"
        onClose={() => {
          setShowPaymentModal(false);
          if (paymentStatus === "success") {
            navigate("/profile/orders");
          } else {
            setStep("delivery");
          }
        }}
      />
    </div>
  );
};

export default Checkout;