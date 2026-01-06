/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/pages/ProductDetails.tsx
import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { db } from "../firebase/firebaseConfig";
import type { Product } from "../types/product";
import { useCart } from "../context/CartContext";
import YouMayAlsoLike from "../components/YouMayAlsoLike";

// adjust this import to your auth context / hook
import { useAuth } from "../context/AuthContext"; // make sure this exists in your project
import { toast } from "react-hot-toast"; // or your toast lib of choice

const AccordionItem = ({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-white/20">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-4 flex items-center justify-between text-left group"
      >
        <span className="text-white font-medium">{title}</span>
        {isOpen ? (
          <ChevronUp size={18} className="text-white" />
        ) : (
          <ChevronDown size={18} className="text-white" />
        )}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pb-6 text-sm text-gray-400 leading-relaxed font-light">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const { user } = useAuth(); // { uid, ... }

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const [quantity, setQuantity] = useState(1);

  // wishlist state for current user
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  // Carousel state
  const [activeIndex, setActiveIndex] = useState(0);

  // Pre‑compute delivery date (today + 7 days) on client
  const deliveryDateText = useMemo(() => {
    const now = new Date();
    const future = new Date(now);
    future.setDate(now.getDate() + 7);
    return future.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  // Helper: fetch user's wishlist array
  const loadWishlist = async (uid: string) => {
    try {
      const userRef = doc(db, "users", uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data() as any;
        const arr = Array.isArray(data.wishlist) ? data.wishlist : [];
        setWishlistIds(arr);
      } else {
        setWishlistIds([]);
      }
    } catch (e) {
      console.error("Error loading wishlist:", e);
      setWishlistIds([]);
    }
  };

  useEffect(() => {
    if (!id) return;

    const fetchProduct = async () => {
      try {
        setLoading(true);

        const ref = doc(db, "products", id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setProduct(null);
          return;
        }

        const data = snap.data() as any;

        const mapped: Product = {
          id: snap.id,
          category: data.category,
          // extra meta fields from admin side (if your Product type includes them)
          coverImage: data.coverImage,
          hoverImage: data.hoverImage,
          images: data.images ?? [],
          name: data.name,
          description: data.description,
          price: data.price,
          discountPrice: data.discountPrice, // null when no discount
          stock: data.stock,
          isActive: data.isActive,
          // you may have these fields in your Product type now:
          sku: data.sku,
          plantType: data.plantType,
          policy: data.policy,
          badge: data.badge,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          image: data.coverImage, // Map coverImage to image for compatibility
        } as any;

        setProduct(mapped);
        setActiveIndex(0);
      } catch (err) {
        console.error("Error loading product:", err);
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (user?.uid) {
      loadWishlist(user.uid);
    }
  }, [user?.uid]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
    toast.success("Added to cart");
  };

  const isInWishlist = !!(product && wishlistIds.includes(product.id));

  const handleToggleWishlist = async () => {
    if (!user?.uid || !product?.id) {
      toast.error("Please login to manage your wishlist");
      return;
    }
    try {
      setWishlistLoading(true);
      const userRef = doc(db, "users", user.uid);

      if (isInWishlist) {
        await updateDoc(userRef, {
          wishlist: arrayRemove(product.id),
        });
        setWishlistIds((prev) => prev.filter((pid) => pid !== product.id));
        toast.success("Removed from wishlist");
      } else {
        await updateDoc(userRef, {
          wishlist: arrayUnion(product.id),
        });
        setWishlistIds((prev) =>
          prev.includes(product.id) ? prev : [...prev, product.id]
        );
        toast.success("Added to wishlist");
      }
    } catch (e) {
      console.error("Error updating wishlist:", e);
      toast.error("Unable to update wishlist");
    } finally {
      setWishlistLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-gray-400">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-20 text-center text-white bg-primary min-h-screen">
        Product not found.
      </div>
    );
  }

  // pricing logic
  const hasDiscount =
    typeof product.discountPrice === "number" &&
    product.discountPrice !== null &&
    product.discountPrice < product.price;

  // Selling price = product.price
  const sellingPrice = product.price;
  const originalPrice = hasDiscount ? product.discountPrice! : undefined;

  const allImages =
    product.images && product.images.length > 0
      ? product.images
      : [product.coverImage || (product as any).image || ""];

  const handlePrev = () => {
    setActiveIndex((prev) =>
      prev === 0 ? allImages.length - 1 : prev - 1
    );
  };

  const handleNext = () => {
    setActiveIndex((prev) =>
      prev === allImages.length - 1 ? 0 : prev + 1
    );
  };

  // Policy display text based on product.policy
  const renderPolicySummary = () => {
    const policy = (product as any).policy as
      | "return"
      | "replacement"
      | "both"
      | "none"
      | undefined;

    if (!policy || policy === "none") {
      return "No return policy available for this product.";
    }
    if (policy === "return") {
      return "Only return available within 7 days of delivery.";
    }
    if (policy === "replacement") {
      return "Only replacement available within 7 days of delivery.";
    }
    if (policy === "both") {
      return "Return and replacement available within 7 days of delivery.";
    }
    return "No return policy available for this product.";
  };

  const renderPolicyDetails = () => {
    const policy = (product as any).policy as
      | "return"
      | "replacement"
      | "both"
      | "none"
      | undefined;

    const baseReturn =
      "You can initiate a return within 7 days of delivery if the plant arrives damaged, diseased, or significantly different from the description.";
    const baseReplacement =
      "You can request a replacement within 7 days of delivery in case of damage in transit, incorrect item delivered, or quality issues.";

    if (!policy || policy === "none") {
      return "This product is not eligible for return or replacement. Please review your order carefully before confirming.";
    }

    if (policy === "return") {
      return `${baseReturn} The refund will be processed once the returned item is inspected and approved.`;
    }

    if (policy === "replacement") {
      return `${baseReplacement} Replacement will be shipped after your request is approved.`;
    }

    // both
    return `${baseReturn} Alternatively, you may opt for a replacement under the same conditions. Once your request is approved, we will either process your refund or dispatch a replacement as per your choice.`;
  };

  const renderShippingInfo = () => {
    return `Book now and you will receive your plant by ${deliveryDateText}. Delivery time may vary slightly based on your location and courier availability, but most orders are delivered within 7 days.`;
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Top Section */}
      <div className="bg-transparent text-white pt-28 pb-20">
        <div className="max-w-[1280px] mx-auto px-6">
          {/* Header / Breadcrumbs */}
          <div className="flex items-center justify-between mb-12 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Link to="/" className="hover:text-white transition-colors">
                Home
              </Link>{" "}
              /
              <Link to="/shop" className="hover:text-white transition-colors">
                Shop All
              </Link>{" "}
              /
              <span className="text-white font-medium">{product.name}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>|</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
            {/* Left: Image Carousel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col gap-4 self-start w-full"
            >
              {/* Main image area */}
              <div className="relative bg-[#E8E6E1] flex items-center justify-center w-full overflow-hidden">
                <img
                  src={allImages[activeIndex]}
                  alt={product.name}
                  className="w-full h-auto object-cover mix-blend-multiply"
                />

                {allImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={handlePrev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              {allImages.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                  {allImages.map((img, index) => (
                    <button
                      key={img + index}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={`relative border transition-colors ${
                        index === activeIndex
                          ? "border-white"
                          : "border-transparent hover:border-white/40"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.name} thumbnail ${index + 1}`}
                        className="w-full h-20 object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Right: Details */}
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl md:text-5xl font-serif text-white mb-2">
                  {product.name}
                </h1>
                <p className="text-xs text-gray-400 mb-6">
                  SKU: {(product as any).sku || product.id}
                </p>

                <div className="flex items-center gap-3 text-xl">
                  {/* strike off discountPrice, selling price = price */}
                  {hasDiscount && originalPrice !== undefined && (
                    <span className="text-gray-500 line-through decoration-1">
                      ₹{originalPrice.toFixed(2)}
                    </span>
                  )}
                  <span className="text-white font-medium">
                    ₹{sellingPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Description directly under price/add to cart block */}
              <div className="space-y-3">
                <p className="text-sm text-gray-300 leading-relaxed">
                  {product.description ||
                    "Detailed information about this plant will appear here once added."}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-6">
                {/* Quantity */}
                <div className="space-y-2">
                  <label className="text-sm text-gray-400 block">
                    Quantity <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="w-24 bg-transparent border border-white/20 px-4 py-3 rounded-none text-sm text-white focus:border-white focus:outline-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-4 pt-4 items-center">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 bg-accent hover:bg-[#b05d35] text-white py-3 px-8 text-sm font-medium tracking-wide transition-colors duration-300"
                  >
                    Add to Cart
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleWishlist}
                    disabled={wishlistLoading}
                    className={`border border-white/20 p-3 flex items-center justify-center hover:bg-white/10 transition-colors ${
                      isInWishlist ? "bg-white/10" : ""
                    }`}
                  >
                    <Heart
                      size={20}
                      className={isInWishlist ? "text-red-500" : "text-white"}
                      fill={isInWishlist ? "currentColor" : "none"}
                    />
                  </button>
                </div>
              </div>

              {/* Accordions */}
              <div className="pt-8">
                <AccordionItem title="Product Info" defaultOpen={true}>
                  <div className="space-y-2">
                    <p>{product.description}</p>
                    <p className="text-xs text-gray-500">
                      Category: {product.category}
                    </p>
                    {(product as any).plantType && (
                      <p className="text-xs text-gray-500">
                        Plant type: {(product as any).plantType}
                      </p>
                    )}
                  </div>
                </AccordionItem>

                <AccordionItem title="Return & Refund Policy">
                  <p className="mb-2">{renderPolicySummary()}</p>
                  <p>{renderPolicyDetails()}</p>
                </AccordionItem>

                <AccordionItem title="Shipping Info">
                  <p>{renderShippingInfo()}</p>
                </AccordionItem>
              </div>

              {/* Social icons */}
              <div className="flex items-center gap-4 text-gray-500 pt-4">
                <div className="w-5 h-5 bg-white/10 hover:bg-white/20 transition-colors rounded-full flex items-center justify-center text-[10px] text-white font-bold cursor-pointer">
                  f
                </div>
                <div className="w-5 h-5 bg-white/10 hover:bg-white/20 transition-colors rounded-full flex items-center justify-center text-[10px] text-white font-bold cursor-pointer">
                  P
                </div>
                <div className="w-5 h-5 bg-white/10 hover:bg-white/20 transition-colors rounded-full flex items-center justify-center text-[10px] text-white font-bold cursor-pointer">
                  W
                </div>
                <div className="w-5 h-5 bg-white/10 hover:bg-white/20 transition-colors rounded-full flex items-center justify-center text-[10px] text-white font-bold cursor-pointer">
                  X
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <YouMayAlsoLike
        currentProductId={id}
        bgColor="bg-primary border-t border-white/10"
      />
    </div>
  );
};

export default ProductDetails;
