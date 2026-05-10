/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Plus, Minus, ShoppingBag, Edit3, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useCheckout } from "../hooks/useCheckout";
import { db } from "../firebase/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { DelhiveryService } from "../services/DelhiveryService";
import { ShippingQuoteService } from "../services/ShippingQuoteService";
import { toast } from "sonner";

type AddressDoc = {
  id: string;
  country: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  firstName: string;
  lastName: string;
  phone: string;
  region: string;
  zip: string;
  isDefault: boolean;
};

type CouponDoc = {
  id: string;
  code: string;
  discountType: "flat" | "percentage";
  discountValue: number;
  maxDiscount?: number;
  minOrderValue: number;
  startDate: Timestamp;
  expiryDate: Timestamp;
  isActive: boolean;
  usageLimit: number;
  usedCount: number;
  applicableCategories?: string[];
  applicableProducts?: string[];
};

function getExpressEstimateDates(): string {
  const today = new Date();
  const min = new Date(today); min.setDate(today.getDate() + 2);
  const max = new Date(today); max.setDate(today.getDate() + 5);
  const fmt = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  return `${fmt(min)} - ${fmt(max)}`;
}

const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    toggleCart,
    removeFromCart,
    updateQuantity,
    cartTotal,
  } = useCart();

  const { user } = useAuth();
  const navigate = useNavigate();
  const uid = user?.uid || null;

  // address + coupon state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);

  const [addresses, setAddresses] = useState<AddressDoc[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [verifyingDelivery, setVerifyingDelivery] = useState(false);

  const { paymentStatus, currentOrderId, handleCheckout, resetPaymentStatus } = useCheckout();

  useEffect(() => {
    if (paymentStatus === "success" && currentOrderId) {
      resetPaymentStatus();
      navigate("/profile/orders", { state: { justOrdered: true, orderId: currentOrderId } });
    } else if (paymentStatus === "failed" && currentOrderId) {
      resetPaymentStatus();
      if (!isCartOpen) toggleCart();
      setTimeout(() => setIsCouponModalOpen(true), 300);
    }
  }, [paymentStatus]);

  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    region: "",
    zip: "",
    Country: "India",
    isDefault: false,
  });
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [useSameAddressForBilling, setUseSameAddressForBilling] = useState(true);
  const [billingAddressId, setBillingAddressId] = useState<string>("");

  const [shippingCost, setShippingCost] = useState(50);
  const [estimatedDelivery, setEstimatedDelivery] = useState<string | null>(null);
  const [courierName, setCourierName] = useState("Delhivery");
  const [selectedDeliveryMode, setSelectedDeliveryMode] = useState<"Standard" | "Express">("Standard");
  const [standardShippingCost, setStandardShippingCost] = useState(50);
  const [standardEstimate, setStandardEstimate] = useState<string | null>(null);

  const [couponCode, setCouponCode] = useState("");
  const [couponChecking, setCouponChecking] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);

  const effectiveTotal =
    appliedCoupon && appliedCoupon.discountAmount > 0
      ? Math.max(0, cartTotal - appliedCoupon.discountAmount)
      : cartTotal;

  // const handleProceedToPay = async () => {
  //   if (!selectedAddressId) {
  //     toast.error("Please select an address");
  //     return;
  //   }

  //   const selectedAddr = addresses.find((a) => a.id === selectedAddressId);
  //   if (!selectedAddr) {
  //     toast.error("Selected address not found");
  //     return;
  //   }

  //   // Calculate pricing
  //   const subtotal = cartTotal;
  //   const tax = Math.round(subtotal * 0.05); // 5% tax
  //   const discount = appliedCoupon?.discountAmount || 0;
  //   const shippingCharge = 50; // From DelhiveryService
  //   const grandTotal = subtotal + tax + shippingCharge - discount;

  //   // Close modals
  //   setIsCouponModalOpen(false);
  //   toggleCart();

  //   await handleCheckout({
  //     deliveryAddress: selectedAddr,
  //     cartItems: cart,
  //     totalAmount: grandTotal,
  //     pricing: {
  //       subTotal: subtotal,
  //       tax,
  //       discount,
  //       couponCode: appliedCoupon?.code || "",
  //       shippingCharge,
  //       grandTotal,
  //     },
  //   });

  //   if (paymentStatus === "success") {
  //     navigate("/profile/orders");
  //   }
  // };
  // When drawer opens, enforce login
  useEffect(() => {
    if (!isCartOpen) return;
    if (!uid) {
      toggleCart();
      navigate("/login");
      return;
    }
  }, [isCartOpen, uid, toggleCart, navigate]);

  // Quantity change: just use context; Firestore sync is handled in CartContext
  const handleUpdateQuantity = async (id: string, newQty: number) => {
    if (!uid) {
      toggleCart();
      navigate("/login");
      return;
    }
    updateQuantity(id, newQty);
  };

  const handleRemoveFromCart = async (id: string) => {
    if (!uid) {
      toggleCart();
      navigate("/login");
      return;
    }
    removeFromCart(id);
  };

  const loadAddresses = useCallback(async () => {
    if (!uid) return;
    try {
      setLoadingAddresses(true);
      const addrCol = collection(db, "users", uid, "addresses");
      const snap = await getDocs(addrCol);
      const list: AddressDoc[] = [];
      snap.forEach((d) => {
        const data = d.data() as any;
        list.push({
          id: d.id,
          country: data.country || data.Country || "India",
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2,
          city: data.city,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          region: data.region,
          zip: data.zip,
          isDefault: !!data.isDefault,
        });
      });
      setAddresses(list);
      const defaultAddr = list.find((a) => a.isDefault);
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      else if (list[0]) setSelectedAddressId(list[0].id);
    } catch (err) {
      console.error("Error loading addresses:", err);
    } finally {
      setLoadingAddresses(false);
    }
  }, [uid]);

  const openAddressModal = async () => {
    if (!uid) {
      toggleCart();
      navigate("/login");
      return;
    }
    await loadAddresses();
    setIsAddressModalOpen(true);
  };

  const closeAddressModal = () => {
    setIsAddressModalOpen(false);
  };

  const resetAddressForm = () => {
    setNewAddress({ firstName: "", lastName: "", phone: "", addressLine1: "", addressLine2: "", city: "", region: "", zip: "", Country: "India", isDefault: false });
    setEditingAddressId(null);
    setAddressError(null);
    setShowNewAddressForm(false);
  };

  const handleDiscardForm = () => resetAddressForm();

  const handleStartEditAddress = (addr: AddressDoc) => {
    setNewAddress({
      firstName: addr.firstName,
      lastName: addr.lastName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || "",
      city: addr.city,
      region: addr.region,
      zip: addr.zip,
      Country: addr.country || "India",
      isDefault: addr.isDefault,
    });
    setEditingAddressId(addr.id);
    setShowNewAddressForm(true);
  };

  const handleSaveNewAddress = async () => {
    setAddressError(null);
    if (
      !newAddress.firstName.trim() ||
      !newAddress.lastName.trim() ||
      !newAddress.phone.trim() ||
      !newAddress.addressLine1.trim() ||
      !newAddress.city.trim() ||
      !newAddress.region.trim() ||
      !newAddress.zip.trim()
    ) {
      setAddressError("Please fill all required fields.");
      return;
    }
    if (!uid) {
      setAddressError("You must be logged in.");
      return;
    }
    if (!/^\d{6}$/.test(newAddress.zip)) {
      setAddressError("Please enter a valid 6-digit PIN code.");
      return;
    }
    if (!/^\d{10}$/.test(newAddress.phone.replace(/\D/g, ""))) {
      setAddressError("Please enter a valid 10-digit phone number.");
      return;
    }

    try {
      setSavingAddress(true);
      const addrCol = collection(db, "users", uid, "addresses");

      if (editingAddressId) {
        // Update existing address
        const addrRef = doc(addrCol, editingAddressId);
        await updateDoc(addrRef, { ...newAddress, updatedAt: serverTimestamp() });
        setAddresses((prev) =>
          prev.map((a) =>
            a.id === editingAddressId
              ? { ...a, ...newAddress, country: newAddress.Country }
              : a
          )
        );
        toast.success("Address updated!");
      } else {
        // Add new address
        const docRef = await addDoc(addrCol, { ...newAddress, createdAt: serverTimestamp() });
        const newDoc: AddressDoc = { id: docRef.id, ...newAddress, country: newAddress.Country };
        setAddresses((prev) => [...prev, newDoc]);
        setSelectedAddressId(docRef.id);
        toast.success("Address saved!");
      }
      resetAddressForm();
    } catch (err) {
      console.error("Error saving address:", err);
      setAddressError("Failed to save address. Please try again.");
    } finally {
      setSavingAddress(false);
    }
  };

  const handleAddressContinue = async () => {
    if (!selectedAddressId) {
      toast.error("Please select or add an address to continue.");
      return;
    }

    // Find selected address
    const selectedAddr = addresses.find((a) => a.id === selectedAddressId);
    if (!selectedAddr) {
      toast.error("Selected address not found.");
      return;
    }

    // ✅ Verify delivery availability before proceeding
    setVerifyingDelivery(true);
    try {
      const isAvailable = await DelhiveryService.verifyDeliveryAvailability(
        selectedAddr.zip,
      );

      if (!isAvailable) {
        toast.error(
          "Delivery not available for PIN code " +
            selectedAddr.zip +
            ". Please select another address.",
        );
        setVerifyingDelivery(false);
        return;
      }

      // Fetch real-time shipping quote — block if unavailable
      let quote;
      try {
        quote = await ShippingQuoteService.quote(
          selectedAddr.zip,
          cart.map((it) => ({ productId: it.id, quantity: it.quantity }))
        );
      } catch (quoteErr: any) {
        toast.error(quoteErr?.message || "Delivery check failed. Please try again.");
        setVerifyingDelivery(false);
        return;
      }

      const baseCost = Number(quote.shippingCost) || 50;
      setStandardShippingCost(baseCost);
      setShippingCost(baseCost);
      setStandardEstimate(quote.estimatedDelivery || null);
      setEstimatedDelivery(quote.estimatedDelivery || null);
      setCourierName(quote.courier || "Delhivery");
      setSelectedDeliveryMode("Standard");

      if (quote.devMode) {
        toast.warning("Dev mode: using estimated delivery values");
      } else {
        toast.success(`Delivery available — ${quote.serviceType || "Standard"}`);
      }
      setIsAddressModalOpen(false);
      setIsCouponModalOpen(true);
    } catch (error) {
      console.error("Error verifying delivery:", error);
      toast.error("Error verifying delivery. Please try again.");
    } finally {
      setVerifyingDelivery(false);
    }
  };

  const handleApplyCoupon = async () => {
    setCouponError(null);
    setAppliedCoupon(null);

    const code = couponCode.trim().toUpperCase();
    if (!code) {
      setCouponError("Please enter a coupon code.");
      return;
    }
    if (!uid) {
      setCouponError("You must be logged in to apply a coupon.");
      return;
    }

    setCouponChecking(true);
    try {
      const now = new Date();
      const couponsRef = collection(db, "coupons");
      const qCoupon = query(
        couponsRef,
        where("code", "==", code),
        where("isActive", "==", true),
      );
      const snap = await getDocs(qCoupon);
      if (snap.empty) {
        setCouponError("Invalid or inactive coupon code.");
        return;
      }
      const docSnap = snap.docs[0];
      const data = docSnap.data() as any;

      const coupon: CouponDoc = {
        id: docSnap.id,
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        maxDiscount: data.maxDiscount,
        minOrderValue: data.minOrderValue,
        startDate: data.startDate,
        expiryDate: data.expiryDate,
        isActive: data.isActive,
        usageLimit: data.usageLimit,
        usedCount: data.usedCount ?? 0,
        applicableCategories: data.applicableCategories || [],
        applicableProducts: data.applicableProducts || [],
      };

      const start = coupon.startDate?.toDate();
      const end = coupon.expiryDate?.toDate();

      if (start && start > now) {
        setCouponError("This coupon is not active yet.");
        return;
      }
      if (end && end < now) {
        setCouponError("This coupon has expired.");
        return;
      }
      if (coupon.usedCount >= coupon.usageLimit) {
        setCouponError("This coupon has reached its usage limit.");
        return;
      }
      if (cartTotal < coupon.minOrderValue) {
        setCouponError(
          `Minimum order value for this coupon is ₹${coupon.minOrderValue}.`,
        );
        return;
      }

      const hasApplicableItem =
        (!coupon.applicableCategories?.length &&
          !coupon.applicableProducts?.length) ||
        cart.some((item) => {
          const catOk =
            !coupon.applicableCategories?.length ||
            coupon.applicableCategories.includes(
              (item as any).categoryId || "",
            );
          const prodOk =
            !coupon.applicableProducts?.length ||
            coupon.applicableProducts.includes(
              (item as any).productId || item.id,
            );
          return catOk && prodOk;
        });

      if (!hasApplicableItem) {
        setCouponError(
          "This coupon is not applicable to any items in your cart.",
        );
        return;
      }

      let discountAmount = 0;
      if (coupon.discountType === "flat") {
        discountAmount = coupon.discountValue;
      } else {
        discountAmount = (cartTotal * coupon.discountValue) / 100;
      }
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
      if (discountAmount <= 0) {
        setCouponError("This coupon does not provide any discount.");
        return;
      }

      setAppliedCoupon({ code: coupon.code, discountAmount });
      toast.success(`Coupon applied! You saved ₹${discountAmount.toFixed(2)}`);
    } catch (err) {
      console.error("Error validating coupon:", err);
      setCouponError("Failed to validate coupon. Please try again.");
    } finally {
      setCouponChecking(false);
    }
  };

  const handleProceedToPay = async () => {
    if (!selectedAddressId) {
      toast.error("Please select an address");
      return;
    }

    const selectedAddr = addresses.find((a) => a.id === selectedAddressId);
    if (!selectedAddr) {
      toast.error("Selected address not found");
      return;
    }

    // Calculate pricing
    const subtotal = cartTotal;
    const tax = Math.round(subtotal * 0.05);
    const discount = appliedCoupon?.discountAmount || 0;
    const shippingCharge = shippingCost;
    const grandTotal = subtotal + tax + shippingCharge - discount;

    // Verify delivery required fields
    const missingFields: string[] = [];
    if (!selectedAddr.firstName && !selectedAddr.lastName) missingFields.push("name");
    if (!selectedAddr.phone) missingFields.push("phone");
    if (!selectedAddr.addressLine1) missingFields.push("addressLine1");
    if (!selectedAddr.city) missingFields.push("city");
    if (!selectedAddr.region) missingFields.push("state/region");
    if (!selectedAddr.zip) missingFields.push("pincode");

    console.log("=== Delivery Data Check ===");
    console.log("Address:", {
      name: `${selectedAddr.firstName} ${selectedAddr.lastName}`,
      phone: selectedAddr.phone,
      addressLine1: selectedAddr.addressLine1,
      city: selectedAddr.city,
      state: selectedAddr.region,
      pincode: selectedAddr.zip,
    });
    console.log("Shipping:", { shippingCost, estimatedDelivery, courierName });
    console.log("Pricing:", { subtotal, tax, discount, shippingCharge, grandTotal });
    if (missingFields.length > 0) {
      console.warn("Missing delivery fields:", missingFields);
      toast.error(`Missing delivery info: ${missingFields.join(", ")}`);
      return;
    }

    // Close coupon modal (cart stays open until payment resolves)
    setIsCouponModalOpen(false);
    toggleCart();

    await handleCheckout({
      deliveryAddress: selectedAddr,
      cartItems: cart,
      totalAmount: grandTotal,
      estimatedDelivery: estimatedDelivery || "",
      deliveryMode: selectedDeliveryMode,
      pricing: {
        subTotal: subtotal,
        tax,
        discount,
        couponCode: appliedCoupon?.code || "",
        shippingCharge,
        grandTotal,
      },
    });

    if (paymentStatus === "success") {
      navigate("/profile/orders");
    }
  };

  const handleCheckoutClick = async () => {
    if (!uid) {
      toggleCart();
      navigate("/login");
      return;
    }
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    void openAddressModal();
  };

  return (
    <>
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleCart}
              className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-sm bg-black/90 backdrop-blur-md shadow-2xl z-50 flex flex-col text-white"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="font-serif text-xl">Your Cart</h2>
                <button
                  onClick={toggleCart}
                  className="p-2 rounded-full hover:bg-white/10 transition"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <ShoppingBag size={48} className="text-gray-600" />
                    <p className="text-gray-400">Your cart is empty.</p>
                    <button
                      onClick={toggleCart}
                      className="text-[#c16e41] hover:underline"
                    >
                      Continue Shopping
                    </button>
                  </div>
                ) : (
                  cart.map((item, index) => {
                    const imgSrc =
                      (item as any).coverImage ??
                      (item as any).image ??
                      undefined;

                    const key =
                      item.id ??
                      (item as any).productId ??
                      `${(item as any).name ?? "item"}-${index}`;

                    return (
                      <div key={key} className="flex gap-4">
                        {imgSrc && (
                          <img
                            src={imgSrc}
                            alt={item.name}
                            className="w-20 h-20 object-cover rounded bg-white/5"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-medium text-white line-clamp-1">
                            {item.name}
                          </h3>
                          <p className="text-gray-400 text-sm mb-2">
                            ₹{item.price.toFixed(2)}
                          </p>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center border border-white/20 rounded">
                              <button
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item.id,
                                    item.quantity - 1,
                                  )
                                }
                                disabled={item.quantity <= 1}
                                className="p-1 hover:bg-white/10 disabled:opacity-40"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-8 text-center text-sm">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  handleUpdateQuantity(
                                    item.id,
                                    item.quantity + 1,
                                  )
                                }
                                className="p-1 hover:bg-white/10"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <button
                              onClick={() => handleRemoveFromCart(item.id)}
                              className="text-gray-400 hover:text-red-500 transition ml-auto"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-6 border-t border-white/10 bg-black z-50 backdrop-blur-sm">
                  <div className="flex justify-between items-center mb-2 text-lg font-medium">
                    <span className="text-gray-200">Subtotal</span>
                    <span className="text-white">₹{cartTotal.toFixed(2)}</span>
                  </div>
                  {appliedCoupon && (
                    <>
                      <div className="flex justify-between items-center mb-1 text-sm text-emerald-300">
                        <span>Coupon {appliedCoupon.code} applied</span>
                        <span>-₹{appliedCoupon.discountAmount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center mb-4 text-sm font-medium">
                        <span className="text-gray-200">Total</span>
                        <span className="text-white">
                          ₹{effectiveTotal.toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                  <button
                    onClick={handleCheckoutClick}
                    className="w-full bg-[#c16e41] text-white py-3 font-semibold tracking-wide hover:bg-[#a05a32] transition duration-300 rounded-lg"
                  >
                    CHECKOUT
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Address selection modal */}
      <AnimatePresence>
        {isAddressModalOpen && (
          <>
            <motion.div className="fixed inset-0 bg-black/50 z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={closeAddressModal} />
            <motion.div className="fixed inset-0 flex items-center justify-center z-50 px-4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className="bg-[#050505] border border-white/10 rounded-xl max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="flex justify-between items-center mb-5">
                  <h3 className="text-white font-serif text-lg">Delivery Details</h3>
                  <button onClick={closeAddressModal} className="p-1 rounded-full hover:bg-white/10"><X size={18} className="text-white" /></button>
                </div>

                {loadingAddresses ? (
                  <p className="text-gray-400 text-sm">Loading your addresses...</p>
                ) : (
                  <>
                    {/* ── SHIPPING ADDRESS ── */}
                    <div className="mb-1">
                      <p className="text-[11px] font-semibold uppercase tracking-widest text-[#c16e41] mb-3">Shipping Address</p>

                      {addresses.length > 0 && !showNewAddressForm && (
                        <div className="space-y-2 mb-3 max-h-52 overflow-y-auto pr-1">
                          {addresses.map((addr) => {
                            const selected = selectedAddressId === addr.id;
                            return (
                              <div key={addr.id} className={`flex items-start gap-2 border rounded-lg px-3 py-2 cursor-pointer transition ${selected ? "border-[#c16e41] bg-[#c16e41]/10" : "border-white/15 hover:border-white/30"}`} onClick={() => setSelectedAddressId(addr.id)}>
                                <div className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected ? "border-[#c16e41]" : "border-white/30"}`}>
                                  {selected && <div className="w-2 h-2 rounded-full bg-[#c16e41]" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-white text-xs font-medium truncate">{addr.firstName} {addr.lastName}</span>
                                    <div className="flex items-center gap-1.5 flex-shrink-0">
                                      {addr.isDefault && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">Default</span>}
                                      <button type="button" onClick={(e) => { e.stopPropagation(); handleStartEditAddress(addr); }} className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition">
                                        <Edit3 size={12} />
                                      </button>
                                    </div>
                                  </div>
                                  <p className="text-gray-400 text-[11px] truncate">{addr.addressLine1}{addr.addressLine2 && `, ${addr.addressLine2}`}</p>
                                  <p className="text-gray-500 text-[11px]">{addr.city}, {addr.region} – {addr.zip}</p>
                                  <p className="text-gray-500 text-[11px]">{addr.phone}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Add / Edit address form */}
                      {showNewAddressForm ? (
                        <div className="border border-white/15 rounded-lg p-3 mb-3 space-y-2">
                          <p className="text-xs font-semibold text-gray-300 mb-2">{editingAddressId ? "Edit Address" : "New Address"}</p>
                          <div className="grid grid-cols-2 gap-2">
                            <input className="bg-transparent border border-white/20 rounded px-2 py-1.5 text-white placeholder:text-gray-500 text-xs" placeholder="First name *" value={newAddress.firstName} onChange={(e) => setNewAddress((p) => ({ ...p, firstName: e.target.value }))} />
                            <input className="bg-transparent border border-white/20 rounded px-2 py-1.5 text-white placeholder:text-gray-500 text-xs" placeholder="Last name *" value={newAddress.lastName} onChange={(e) => setNewAddress((p) => ({ ...p, lastName: e.target.value }))} />
                          </div>
                          <input className="bg-transparent border border-white/20 rounded px-2 py-1.5 w-full text-white placeholder:text-gray-500 text-xs" placeholder="Phone (10 digits) *" inputMode="numeric" maxLength={10} value={newAddress.phone} onChange={(e) => setNewAddress((p) => ({ ...p, phone: e.target.value.replace(/\D/g, "") }))} />
                          <input className="bg-transparent border border-white/20 rounded px-2 py-1.5 w-full text-white placeholder:text-gray-500 text-xs" placeholder="Address line 1 *" value={newAddress.addressLine1} onChange={(e) => setNewAddress((p) => ({ ...p, addressLine1: e.target.value }))} />
                          <input className="bg-transparent border border-white/20 rounded px-2 py-1.5 w-full text-white placeholder:text-gray-500 text-xs" placeholder="Address line 2 (optional)" value={newAddress.addressLine2} onChange={(e) => setNewAddress((p) => ({ ...p, addressLine2: e.target.value }))} />
                          <div className="grid grid-cols-2 gap-2">
                            <input className="bg-transparent border border-white/20 rounded px-2 py-1.5 text-white placeholder:text-gray-500 text-xs" placeholder="City *" value={newAddress.city} onChange={(e) => setNewAddress((p) => ({ ...p, city: e.target.value }))} />
                            <input className="bg-transparent border border-white/20 rounded px-2 py-1.5 text-white placeholder:text-gray-500 text-xs" placeholder="State/Region *" value={newAddress.region} onChange={(e) => setNewAddress((p) => ({ ...p, region: e.target.value }))} />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input className="bg-transparent border border-white/20 rounded px-2 py-1.5 text-white placeholder:text-gray-500 text-xs" placeholder="PIN code (6 digits) *" inputMode="numeric" maxLength={6} value={newAddress.zip} onChange={(e) => setNewAddress((p) => ({ ...p, zip: e.target.value.replace(/\D/g, "") }))} />
                            <input className="bg-transparent border border-white/20 rounded px-2 py-1.5 text-white placeholder:text-gray-500 text-xs" placeholder="Country" value={newAddress.Country} onChange={(e) => setNewAddress((p) => ({ ...p, Country: e.target.value }))} />
                          </div>
                          {addressError && <p className="text-[11px] text-red-400">{addressError}</p>}
                          <div className="flex justify-between items-center pt-1">
                            <button type="button" onClick={handleDiscardForm} className="text-xs text-gray-400 hover:text-white transition px-2 py-1 rounded hover:bg-white/10">Discard</button>
                            <button type="button" disabled={savingAddress} onClick={handleSaveNewAddress} className="px-4 py-1.5 text-xs bg-[#c16e41] text-white rounded hover:bg-[#a05a32] disabled:opacity-50">
                              {savingAddress ? "Saving..." : editingAddressId ? "Update Address" : "Save Address"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button type="button" onClick={() => { resetAddressForm(); setShowNewAddressForm(true); }} className="flex items-center gap-1.5 text-xs text-[#c16e41] hover:underline mb-3">
                          <Plus size={13} /><span>Add new address</span>
                        </button>
                      )}
                    </div>

                    {/* ── BILLING ADDRESS ── */}
                    {!showNewAddressForm && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-3">Billing Address</p>
                        <label className="flex items-center gap-2.5 cursor-pointer mb-3 group">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition ${useSameAddressForBilling ? "bg-[#c16e41] border-[#c16e41]" : "border-white/30 group-hover:border-white/60"}`} onClick={() => setUseSameAddressForBilling((v) => !v)}>
                            {useSameAddressForBilling && <Check size={10} className="text-white" strokeWidth={3} />}
                          </div>
                          <span className="text-xs text-gray-300 select-none" onClick={() => setUseSameAddressForBilling((v) => !v)}>Same as shipping address</span>
                        </label>

                        {!useSameAddressForBilling && addresses.length > 0 && (
                          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                            {addresses.map((addr) => {
                              const selected = billingAddressId === addr.id;
                              return (
                                <div key={addr.id} className={`flex items-start gap-2 border rounded-lg px-3 py-2 cursor-pointer transition ${selected ? "border-blue-500 bg-blue-500/10" : "border-white/15 hover:border-white/30"}`} onClick={() => setBillingAddressId(addr.id)}>
                                  <div className={`mt-1 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selected ? "border-blue-400" : "border-white/30"}`}>
                                    {selected && <div className="w-2 h-2 rounded-full bg-blue-400" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-white text-xs font-medium">{addr.firstName} {addr.lastName}</p>
                                    <p className="text-gray-500 text-[11px]">{addr.city}, {addr.region} – {addr.zip}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {!useSameAddressForBilling && addresses.length === 0 && (
                          <p className="text-xs text-gray-500">No saved addresses. Add one above.</p>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <p className="text-[11px] text-gray-500 mt-4 mb-3">
                      <span className="text-red-400">*</span> Delivery availability will be verified for the shipping address.
                    </p>
                    <div className="flex justify-end gap-3">
                      <button onClick={closeAddressModal} className="px-4 py-2 text-sm text-gray-300 hover:text-white">Cancel</button>
                      <button onClick={handleAddressContinue} disabled={verifyingDelivery || showNewAddressForm} className="px-4 py-2 text-sm bg-[#c16e41] text-white rounded hover:bg-[#a05a32] disabled:opacity-50">
                        {verifyingDelivery ? "Verifying..." : "Continue"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Coupon modal */}
      <AnimatePresence>
        {isCouponModalOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCouponModalOpen(false)}
            />
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 px-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div
                className="bg-[#050505] border border-white/10 rounded-lg max-w-lg w-full p-6 relative"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-serif text-lg">
                    Apply coupon (optional)
                  </h3>
                  <button
                    onClick={() => setIsCouponModalOpen(false)}
                    className="p-1 rounded-full hover:bg-white/10"
                  >
                    <X size={18} className="text-white" />
                  </button>
                </div>

                <div className="space-y-4 mb-4">
                  <div>
                    <label className="block text-xs text-gray-300 mb-1">
                      Have a coupon code?
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) =>
                          setCouponCode(e.target.value.toUpperCase())
                        }
                        placeholder="Enter coupon code"
                        className="flex-1 bg-transparent border border-white/30 rounded px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#c16e41]"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCoupon}
                        disabled={couponChecking}
                        className="px-4 py-2 text-sm bg-[#c16e41] text-white rounded hover:bg-[#a05a32] disabled:opacity-50"
                      >
                        {couponChecking ? "Checking..." : "Apply"}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-xs text-red-400 mt-1">{couponError}</p>
                    )}
                    {appliedCoupon && !couponError && (
                      <p className="text-xs text-emerald-300 mt-1">
                        Coupon {appliedCoupon.code} applied. You saved ₹
                        {appliedCoupon.discountAmount.toFixed(2)}.
                      </p>
                    )}
                  </div>

                  {/* Delivery Mode Selector */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Choose Delivery Mode</p>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Standard */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDeliveryMode("Standard");
                          setShippingCost(standardShippingCost);
                          setEstimatedDelivery(standardEstimate);
                        }}
                        className={`text-left p-3 rounded-lg border-2 transition ${
                          selectedDeliveryMode === "Standard"
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-white/15 hover:border-white/30"
                        }`}
                      >
                        <p className="text-xs font-bold text-blue-300 mb-1">📦 Standard</p>
                        <p className="text-[11px] text-gray-400">3–7 business days</p>
                        <p className="text-[11px] text-gray-500 truncate">{standardEstimate || ""}</p>
                        <p className="text-sm font-bold text-white mt-1.5">₹{standardShippingCost.toFixed(0)}</p>
                      </button>
                      {/* Express */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDeliveryMode("Express");
                          setShippingCost(standardShippingCost * 2);
                          setEstimatedDelivery(getExpressEstimateDates());
                        }}
                        className={`text-left p-3 rounded-lg border-2 transition ${
                          selectedDeliveryMode === "Express"
                            ? "border-orange-500 bg-orange-500/10"
                            : "border-white/15 hover:border-white/30"
                        }`}
                      >
                        <p className="text-xs font-bold text-orange-300 mb-1">⚡ Express</p>
                        <p className="text-[11px] text-gray-400">2–5 business days</p>
                        <p className="text-[11px] text-gray-500 truncate">{getExpressEstimateDates()}</p>
                        <p className="text-sm font-bold text-white mt-1.5">₹{(standardShippingCost * 2).toFixed(0)}</p>
                      </button>
                    </div>
                    <p className="text-[10px] text-gray-600 mt-1">via {courierName}</p>
                  </div>

                  <div className="border-t border-white/10 pt-3 text-sm">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500">Cart Value</span>
                      <span className="text-gray-400">+₹{cartTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500">Tax (5%)</span>
                      <span className="text-gray-400">+₹{Math.round(cartTotal * 0.05).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-500">Shipping Charges</span>
                      <span className="text-gray-400">
                        {shippingCost === 0 ? <span className="text-green-400">FREE</span> : `+₹${shippingCost.toFixed(2)}`}
                      </span>
                    </div>
                    {appliedCoupon && (
                      <div className="flex justify-between mb-1">
                        <span className="text-emerald-300">Coupon discount</span>
                        <span className="text-emerald-300">-₹{appliedCoupon.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between mt-2 pt-2 border-t border-white/10 font-medium">
                      <span className="text-gray-100">Grand Total</span>
                      <span className="text-white">
                        ₹{(cartTotal + Math.round(cartTotal * 0.05) + shippingCost - (appliedCoupon?.discountAmount || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setIsCouponModalOpen(false)}
                    className="px-4 py-2 text-sm text-gray-300 hover:text-white"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleProceedToPay}
                    className="px-4 py-2 text-sm bg-[#c16e41] text-white rounded hover:bg-[#a05a32]"
                  >
                    Proceed to pay
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default CartDrawer;
