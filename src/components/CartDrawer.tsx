/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
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

  const { paymentStatus, handleCheckout } = useCheckout();

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

  const [shippingCost, setShippingCost] = useState(50);
  const [estimatedDelivery, setEstimatedDelivery] = useState<string | null>(null);
  const [courierName, setCourierName] = useState("Delhivery");
  const [serviceType, setServiceType] = useState<"Express" | "Standard" | null>(null);

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
          country: data.country,
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

    // Validate ZIP code (6 digits for India)
    if (!/^\d{6}$/.test(newAddress.zip)) {
      setAddressError("Please enter a valid 6-digit PIN code.");
      return;
    }

    // Validate phone (10 digits)
    if (!/^\d{10}$/.test(newAddress.phone.replace(/\D/g, ""))) {
      setAddressError("Please enter a valid 10-digit phone number.");
      return;
    }

    try {
      setSavingAddress(true);
      const addrCol = collection(db, "users", uid, "addresses");
      const docRef = await addDoc(addrCol, {
        ...newAddress,
        createdAt: serverTimestamp(),
      });
      const newDoc: AddressDoc = {
        id: docRef.id,
        ...newAddress,
        country: ""
      };
      setAddresses((prev) => [...prev, newDoc]);
      setSelectedAddressId(docRef.id);
      setShowNewAddressForm(false);
      setNewAddress({
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
      toast.success("Address saved successfully!");
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

      setShippingCost(Number(quote.shippingCost) || 50);
      setEstimatedDelivery(quote.estimatedDelivery || null);
      setCourierName(quote.courier || "Delhivery");
      setServiceType((quote.serviceType as "Express" | "Standard") || null);

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

    // Close modals
    setIsCouponModalOpen(false);
    toggleCart();

    await handleCheckout({
      deliveryAddress: selectedAddr,
      cartItems: cart,
      totalAmount: grandTotal,
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

      {/* Address selection + add new address with delivery verification */}
      <AnimatePresence>
        {isAddressModalOpen && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/50 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeAddressModal}
            />
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 px-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div
                className="bg-[#050505] border border-white/10 rounded-lg max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-white font-serif text-lg">
                    Select delivery address
                  </h3>
                  <button
                    onClick={closeAddressModal}
                    className="p-1 rounded-full hover:bg-white/10"
                  >
                    <X size={18} className="text-white" />
                  </button>
                </div>

                {loadingAddresses ? (
                  <p className="text-gray-400 text-sm">
                    Loading your addresses...
                  </p>
                ) : (
                  <>
                    {addresses.length > 0 && (
                      <div className="max-h-48 overflow-y-auto space-y-3 mb-4">
                        {addresses.map((addr) => {
                          const selected = selectedAddressId === addr.id;
                          return (
                            <button
                              key={addr.id}
                              type="button"
                              onClick={() => setSelectedAddressId(addr.id)}
                              className={`w-full text-left border rounded-md px-3 py-2 text-xs md:text-sm ${
                                selected
                                  ? "border-[#c16e41] bg-[#c16e41]/10"
                                  : "border-white/15 hover:border-white/40"
                              }`}
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-white font-medium">
                                  {addr.firstName} {addr.lastName}
                                </span>
                                {addr.isDefault && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                    Default
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-300">
                                {addr.addressLine1}
                                {addr.addressLine2 && `, ${addr.addressLine2}`}
                              </p>
                              <p className="text-gray-400">
                                {addr.city}, {addr.region} {addr.zip}
                              </p>
                              <p className="text-gray-400">
                                {addr.country} • {addr.phone}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => setShowNewAddressForm((prev) => !prev)}
                      className="flex items-center gap-2 text-sm text-[#c16e41] hover:underline mb-3"
                    >
                      <Plus size={14} />
                      <span>Add new address</span>
                    </button>

                    {showNewAddressForm && (
                      <div className="border border-white/15 rounded-md p-3 mb-3 space-y-2 text-xs md:text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            className="bg-transparent border border-white/20 rounded px-2 py-1 text-white placeholder:text-gray-500 text-xs"
                            placeholder="First name *"
                            value={newAddress.firstName}
                            onChange={(e) =>
                              setNewAddress((p) => ({
                                ...p,
                                firstName: e.target.value,
                              }))
                            }
                          />
                          <input
                            className="bg-transparent border border-white/20 rounded px-2 py-1 text-white placeholder:text-gray-500 text-xs"
                            placeholder="Last name *"
                            value={newAddress.lastName}
                            onChange={(e) =>
                              setNewAddress((p) => ({
                                ...p,
                                lastName: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <input
                          className="bg-transparent border border-white/20 rounded px-2 py-1 w-full text-white placeholder:text-gray-500 text-xs"
                          placeholder="Phone (10 digits) *"
                          value={newAddress.phone}
                          onChange={(e) =>
                            setNewAddress((p) => ({
                              ...p,
                              phone: e.target.value,
                            }))
                          }
                        />
                        <input
                          className="bg-transparent border border-white/20 rounded px-2 py-1 w-full text-white placeholder:text-gray-500 text-xs"
                          placeholder="Address line 1 *"
                          value={newAddress.addressLine1}
                          onChange={(e) =>
                            setNewAddress((p) => ({
                              ...p,
                              addressLine1: e.target.value,
                            }))
                          }
                        />
                        <input
                          className="bg-transparent border border-white/20 rounded px-2 py-1 w-full text-white placeholder:text-gray-500 text-xs"
                          placeholder="Address line 2"
                          value={newAddress.addressLine2}
                          onChange={(e) =>
                            setNewAddress((p) => ({
                              ...p,
                              addressLine2: e.target.value,
                            }))
                          }
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            className="bg-transparent border border-white/20 rounded px-2 py-1 text-white placeholder:text-gray-500 text-xs"
                            placeholder="City *"
                            value={newAddress.city}
                            onChange={(e) =>
                              setNewAddress((p) => ({
                                ...p,
                                city: e.target.value,
                              }))
                            }
                          />
                          <input
                            className="bg-transparent border border-white/20 rounded px-2 py-1 text-white placeholder:text-gray-500 text-xs"
                            placeholder="State/Region *"
                            value={newAddress.region}
                            onChange={(e) =>
                              setNewAddress((p) => ({
                                ...p,
                                region: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            className="bg-transparent border border-white/20 rounded px-2 py-1 text-white placeholder:text-gray-500 text-xs"
                            placeholder="PIN code (6 digits) *"
                            value={newAddress.zip}
                            maxLength={6}
                            onChange={(e) =>
                              setNewAddress((p) => ({
                                ...p,
                                zip: e.target.value,
                              }))
                            }
                          />
                          <input
                            className="bg-transparent border border-white/20 rounded px-2 py-1 text-white placeholder:text-gray-500 text-xs"
                            placeholder="Country"
                            value={newAddress.Country}
                            onChange={(e) =>
                              setNewAddress((p) => ({
                                ...p,
                                Country: e.target.value,
                              }))
                            }
                          />
                        </div>
                        {addressError && (
                          <p className="text-[11px] text-red-400">
                            {addressError}
                          </p>
                        )}
                        <div className="flex justify-end">
                          <button
                            type="button"
                            disabled={savingAddress}
                            onClick={handleSaveNewAddress}
                            className="px-3 py-1.5 text-xs bg-[#c16e41] text-white rounded hover:bg-[#a05a32] disabled:opacity-50"
                          >
                            {savingAddress ? "Saving..." : "Save address"}
                          </button>
                        </div>
                      </div>
                    )}

                    <p className="text-[11px] text-gray-400 mb-3">
                      Address selection is{" "}
                      <span className="text-red-400">*</span> required to
                      continue. Delivery availability will be verified.
                    </p>
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={closeAddressModal}
                        className="px-4 py-2 text-sm text-gray-300 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddressContinue}
                        disabled={verifyingDelivery}
                        className="px-4 py-2 text-sm bg-[#c16e41] text-white rounded hover:bg-[#a05a32] disabled:opacity-50"
                      >
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

                  {/* Estimated delivery - always show with fallback */}
                  <div className="bg-green-900/30 border border-green-700/40 rounded-lg px-4 py-3 mb-3">
                    <p className="text-xs text-green-400 uppercase tracking-wide mb-0.5">Estimated Delivery</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {serviceType && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          serviceType === "Express"
                            ? "bg-orange-500/20 text-orange-300"
                            : "bg-blue-500/20 text-blue-300"
                        }`}>
                          {serviceType === "Express" ? "⚡ Express (2–5 days)" : "📦 Standard (3–7 days)"}
                        </span>
                      )}
                    </div>
                    <p className="text-green-300 font-bold text-base mt-1">
                      {estimatedDelivery || (serviceType === "Express" ? "2–5 Business Days" : "3–7 Business Days")}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">via {courierName}</p>
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
