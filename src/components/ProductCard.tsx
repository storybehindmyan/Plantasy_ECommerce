import React, { useState } from "react";
import { motion } from "framer-motion";
import type { Product } from "../types/product";
import { useCart } from "../context/CartContext";
import Skeleton from "./Skeleton";
import { Link } from "react-router-dom";

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const handleAddContext = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent Link navigation when clicking add button
    e.stopPropagation();
    addToCart(product);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  const displayPrice = product.discountPrice ?? product.price;
  const hasDiscount = typeof product.discountPrice === "number";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      className="group cursor-pointer"
    >
      <Link to={`/product/${product.id}`}>
        {/* Image container */}
        <div className="relative aspect-[3/4] overflow-hidden bg-[#E8E6E1] mb-6 rounded-sm">
          {!isImageLoaded && (
            <Skeleton className="absolute inset-0 w-full h-full z-10" />
          )}

          {/* Base (cover) image */}
          <img
            src={product.coverImage || product.image}
            alt={product.name}
            loading="lazy"
            onLoad={() => setIsImageLoaded(true)}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out ${isImageLoaded ? "opacity-100" : "opacity-0"
              }`}
          />

          {/* Hover image overlay */}
          {product.hoverImage && (
            <img
              src={product.hoverImage}
              alt={`${product.name} hover`}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-in-out opacity-0 group-hover:opacity-100 z-10"
            />
          )}

          {/* Badge */}
          {product.badge && (
            <span
              className={`absolute top-2 left-2 text-white text-[10px] uppercase font-bold tracking-widest px-2 py-1 ${product.badge === "Sale" ? "bg-accent" : "bg-[#686736]/70 backdrop-blur-md border border-[#686736]/90"
                }`}
            >
              {product.badge}
            </span>
          )}
        </div>

        {/* Text content */}
        <div className="text-left">
          <h3 className="font-serif text-lg leading-tight mb-1 text-white/90 group-hover:text-accent transition-colors tracking-wide">
            {product.name}
          </h3>

          <div className="flex items-center gap-2 font-sans text-sm mb-4">
            {hasDiscount && (
              <span className="text-gray-500 line-through">
                ₹{product.price.toFixed(2)}
              </span>
            )}
            <span className="text-white/80">
              ₹{displayPrice.toFixed(2)}
            </span>
          </div>

          <button
            onClick={handleAddContext}
            className="w-full border border-white/30 text-white py-2 text-sm font-medium tracking-wider hover:bg-white hover:text-primary transition-all duration-300"
          >
            {isAdded ? "Added" : "Add to Cart"}
          </button>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
