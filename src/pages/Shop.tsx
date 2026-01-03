/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/Shop.tsx
/* eslint-disable prefer-const */
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { Plus, Minus } from "lucide-react";

import ProductCard from "../components/ProductCard";
import YouMayAlsoLike from "../components/YouMayAlsoLike";
import YouMayAlsoLikePots from "../components/YouMayAlsoLikePots";

import { db } from "../firebase/firebaseConfig";
import {
  collection,
  getDocs,
  type Timestamp,
} from "firebase/firestore";
import type { Product } from "../types/product";

type FirestoreProduct = Product & {
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  isNewArrival?: boolean;
  isOnSale?: boolean;
};

const SidebarAccordion = ({
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
    <div className="border-b border-white/10">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full py-6 flex items-center justify-between text-left group"
      >
        <span className="font-sans text-lg text-white font-light">
          {title}
        </span>
        {isOpen ? (
          <Minus size={16} className="text-white/70" />
        ) : (
          <Plus size={16} className="text-white/70" />
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
            <div className="pb-6">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Shop = () => {
  const [products, setProducts] = useState<FirestoreProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [activeCategory, setActiveCategory] = useState<string>(
    categoryParam || "all"
  );
  const [maxPrice, setMaxPrice] = useState(5000);
  const [sortBy, setSortBy] = useState("featured");

  useEffect(() => {
    setActiveCategory(categoryParam || "all");
  }, [categoryParam]);

  // Fetch products from Firestore and compute tags
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        const snap = await getDocs(collection(db, "products"));

        const now = new Date();
        const tenDaysMs = 10 * 24 * 60 * 60 * 1000;

        const items: FirestoreProduct[] = snap.docs.map((docSnap) => {
          const data = docSnap.data() as any;

          const updatedAt: Timestamp | undefined = data.updatedAt;
          const hasDiscount = typeof data.discountPrice === "number";

          let isNewArrival = false;
          if (updatedAt && updatedAt.toDate) {
            const updatedDate = updatedAt.toDate() as Date;
            const diffMs = now.getTime() - updatedDate.getTime();
            isNewArrival = diffMs <= tenDaysMs && diffMs >= 0;
          }

          const images: string[] = data.images ?? [];
          const coverImage: string =
            data.coverImage || images[0] || "";
          const hoverImage: string =
            data.hoverImage || images[1] || images[0] || "";

          // Derive badge text for ProductCard
          let badge: string | undefined = data.badge;
          if (isNewArrival) {
            badge = "New Arrival";
          } else if (hasDiscount) {
            badge = "Sale";
          }

          return {
            id: docSnap.id,
            category: data.category,
            coverImage,
            hoverImage,
            images,
            name: data.name,
            description: data.description,
            price: data.price,
            discountPrice: data.discountPrice,
            stock: data.stock,
            isActive: data.isActive,
            badge,
            createdAt: data.createdAt,
            updatedAt,
            isNewArrival,
            isOnSale: hasDiscount,
          };
        });

        setProducts(items);
      } catch (err) {
        console.error("Error loading products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = [
    { id: "all", label: "All" },
    { id: "new-arrivals", label: "New Arrivals" },
    { id: "sale", label: "Sale" },
    { id: "plants", label: "Plants" },
    { id: "pots", label: "Pots" },
    { id: "seeds", label: "Seeds" },
    { id: "subscriptions", label: "Subscriptions" },
  ];

  const handleCategoryChange = (id: string) => {
    setActiveCategory(id);
    if (id === "all") {
      searchParams.delete("category");
      setSearchParams(searchParams);
    } else {
      setSearchParams({ category: id });
    }
  };

  let filteredProducts: FirestoreProduct[] = products.filter((product) => {
    let matchesCategory = true;

    if (activeCategory === "all") {
      matchesCategory = true;
    } else if (activeCategory === "new-arrivals") {
      matchesCategory = !!product.isNewArrival;
    } else if (activeCategory === "sale") {
      matchesCategory = !!product.isOnSale;
    } else if (activeCategory === "subscriptions") {
      matchesCategory =
        product.category === "plants" &&
        product.name.toLowerCase().includes("subscription");
    } else {
      matchesCategory =
        product.category.toLowerCase() === activeCategory.toLowerCase();
    }

    const matchesPrice = product.price <= maxPrice;

    return matchesCategory && matchesPrice;
  });

  // Sort Logic
  if (sortBy === "price-low-high") {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortBy === "price-high-low") {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else if (sortBy === "newest") {
    filteredProducts.sort((a, b) => {
      const aNew = a.isNewArrival ? 1 : 0;
      const bNew = b.isNewArrival ? 1 : 0;
      return bNew - aNew;
    });
  }

  return (
    <div className="min-h-screen bg-black text-secondary pt-32 pb-20 transition-colors duration-300">
      {/* Centered Title */}
      <div className="text-center mt-12 mb-20 px-4 relative">
        <h1 className="text-6xl md:text-8xl font-serif font-medium tracking-tight mb-4 capitalize text-white">
          {activeCategory === "all"
            ? "Shop All"
            : categories.find((c) => c.id === activeCategory)?.label ||
              activeCategory}
        </h1>
      </div>

      <div className="max-w-[1600px] mx-auto px-12 flex flex-col md:flex-row gap-20">
        {/* Sidebar */}
        <aside className="w-full md:w-48 flex-shrink-0">
          <div className="mb-8 pb-4 border-b border-white/10">
            <h2 className="text-xl font-serif text-white">Filter by</h2>
          </div>

          <div className="space-y-1">
            <SidebarAccordion title="Category" defaultOpen={true}>
              <ul className="space-y-3">
                {categories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => handleCategoryChange(cat.id)}
                      className={clsx(
                        "text-[15px] transition-colors text-left w-full block",
                        activeCategory === cat.id
                          ? "text-white font-medium"
                          : "text-gray-400 hover:text-white"
                      )}
                    >
                      {cat.label}
                    </button>
                  </li>
                ))}
              </ul>
            </SidebarAccordion>

            <SidebarAccordion title="Price">
              <div className="px-1">
                <div className="flex justify-between text-sm text-gray-400 mb-4">
                  <span>Range</span>
                  <span>₹0 - ₹{maxPrice}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full h-[2px] bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>
            </SidebarAccordion>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex justify-end mb-8">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-white border border-white/20 px-4 py-2 text-sm focus:outline-none focus:border-white/50 cursor-pointer"
            >
              <option value="featured" className="bg-black">
                Sort by: Featured
              </option>
              <option value="newest" className="bg-black">
                Sort by: Newest
              </option>
              <option value="price-low-high" className="bg-black">
                Price: Low to High
              </option>
              <option value="price-high-low" className="bg-black">
                Price: High to Low
              </option>
            </select>
          </div>

          {loading ? (
            <div className="text-center py-20 text-gray-500">
              Loading products...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-16">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                  No products found in this category.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {activeCategory === "pots" ? (
        <YouMayAlsoLikePots />
      ) : (
        <YouMayAlsoLike
          hideFirstImage={activeCategory === "pots"}
          compact={activeCategory === "seeds" || activeCategory === "plants"}
        />
      )}
    </div>
  );
};

export default Shop;
