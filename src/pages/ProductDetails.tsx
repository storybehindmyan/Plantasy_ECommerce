/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// src/pages/ProductDetails.tsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { doc, getDoc } from "firebase/firestore";
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

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState("");

  // Optional: prev / next via local state or separate query.
  const [prevProduct, setPrevProduct] = useState<Product | null>(null);
  const [nextProduct, setNextProduct] = useState<Product | null>(null);

  // Carousel state
  const [activeIndex, setActiveIndex] = useState(0);

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
          coverImage: data.coverImage,
          hoverImage: data.hoverImage,
          images: data.images ?? [],
          name: data.name,
          description: data.description,
          price: data.price,
          discountPrice: data.discountPrice,
          stock: data.stock,
          isActive: data.isActive,
          badge: data.badge,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };

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

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
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

  const displayPrice = product.discountPrice ?? product.price;
  const hasDiscount = typeof product.discountPrice === "number";

  const allImages =
    product.images && product.images.length > 0
      ? product.images
      : [product.coverImage];

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
              {prevProduct ? (
                <Link
                  to={`/product/${prevProduct.id}`}
                  className="hover:text-accent flex items-center gap-1 transition-colors"
                >
                  <ChevronLeft size={16} /> Prev
                </Link>
              ) : (
                <span className="text-gray-600 flex items-center gap-1">
                  <ChevronLeft size={16} /> Prev
                </span>
              )}
              <span>|</span>
              {nextProduct ? (
                <Link
                  to={`/product/${nextProduct.id}`}
                  className="hover:text-accent flex items-center gap-1 transition-colors"
                >
                  Next <ChevronRight size={16} />
                </Link>
              ) : (
                <span className="text-gray-600 flex items-center gap-1">
                  Next <ChevronRight size={16} />
                </span>
              )}
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
                <p className="text-xs text-gray-400 mb-6">SKU: {product.id}</p>

                <div className="flex items-center gap-3 text-xl">
                  {hasDiscount && (
                    <span className="text-gray-500 line-through decoration-1">
                      ₹{product.price.toFixed(2)}
                    </span>
                  )}
                  <span className="text-white font-medium">
                    ₹{displayPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-6">
                {/* Size */}
                {/* <div className="space-y-2">
                  <label className="text-sm text-gray-400 block">
                    Size <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      className="w-full appearance-none bg-transparent border border-white/20 px-4 py-3 pr-8 rounded-none text-sm text-white focus:border-white focus:outline-none cursor-pointer"
                    >
                      <option
                        value=""
                        disabled
                        className="bg-black text-gray-500"
                      >
                        Select
                      </option>
                      <option value="small" className="bg-black">
                        Small
                      </option>
                      <option value="medium" className="bg-black">
                        Medium
                      </option>
                      <option value="large" className="bg-black">
                        Large
                      </option>
                    </select>
                    <ChevronDown
                      size={16}
                      className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
                    />
                  </div>
                </div> */}

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
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 bg-accent hover:bg-[#b05d35] text-white py-3 px-8 text-sm font-medium tracking-wide transition-colors duration-300"
                  >
                    Add to Cart
                  </button>
                  <button className="border border-white/20 p-3 flex items-center justify-center hover:bg-white/10 transition-colors">
                    <Heart size={20} className="text-white" />
                  </button>
                </div>
              </div>

              {/* Accordions */}
              <div className="pt-8">
                <AccordionItem title="Product Info" defaultOpen={true}>
                  {product.description ||
                    "Detailed information about this product will appear here."}
                </AccordionItem>
                <AccordionItem title="Return & Refund Policy">
                  I’m a Return and Refund policy. Add your real policy text here
                  to build trust with your customers.
                </AccordionItem>
                <AccordionItem title="Shipping Info">
                  I’m a shipping policy. Add your shipping, packaging, and cost
                  information here so customers can buy with confidence.
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
