/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Search,
  User as UserIcon,
  Menu,
  X,
  ChevronDown,
  Package,
  MapPin,
  Wallet,
  Heart,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import { db } from "../firebase/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  doc,
  getDoc,
} from "firebase/firestore";

type FirestoreProduct = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
};

type Blog = {
  id: string;
  title: string;
  seoTitle?: string;
  tags?: string[] | string;
  coverImage?: string;
  publishedAt?: Timestamp | null;
};

type WishlistItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const { itemsCount, toggleCart } = useCart();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [fsProducts, setFsProducts] = useState<FirestoreProduct[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);

  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const wishlistRef = useRef<HTMLDivElement>(null);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    const updateImage = () => {
      if (user) {
        const savedImage = localStorage.getItem(`profile_image_${user.uid}`);
        setProfileImage(savedImage || user.photoURL || null);
      } else {
        setProfileImage(null);
      }
    };

    updateImage();
    window.addEventListener("profile-image-updated", updateImage);
    return () =>
      window.removeEventListener("profile-image-updated", updateImage);
  }, [user, isUserMenuOpen]);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const qProducts = query(collection(db, "products"));
        const snap = await getDocs(qProducts);
        const list: FirestoreProduct[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            name: data.name,
            category: data.category,
            price: Number(data.price || 0),
            image: data.image || data.coverImage || "",
          };
        });
        setFsProducts(list);
      } catch (err) {
        console.error("Error loading products for search:", err);
      }
    };
    void loadProducts();
  }, []);

  useEffect(() => {
    const loadBlogs = async () => {
      try {
        const qBlogs = query(
          collection(db, "blogs"),
          where("isPublished", "==", true),
          orderBy("publishedAt", "desc")
        );
        const snap = await getDocs(qBlogs);
        const list: Blog[] = snap.docs.map((d) => {
          const data = d.data() as any;
          return {
            id: d.id,
            title: data.title,
            seoTitle: data.seoTitle,
            tags: data.tags,
            coverImage: data.coverImage,
            publishedAt: data.publishedAt ?? null,
          };
        });
        setBlogs(list);
      } catch (err) {
        console.error("Error loading blogs for search:", err);
      }
    };
    void loadBlogs();
  }, []);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResultsProducts, setSearchResultsProducts] = useState<
    FirestoreProduct[]
  >([]);
  const [searchResultsBlogs, setSearchResultsBlogs] = useState<Blog[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const navLinks = [
    { name: "Shop All", path: "/shop" },
    { name: "Plants", path: "/shop?category=plants" },
    { name: "Pots", path: "/shop?category=pots" },
    { name: "Seeds", path: "/shop?category=seeds" },
    { name: "Care", path: "/care" },
  ];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const queryStr = e.target.value;
    setSearchQuery(queryStr);
    const trimmed = queryStr.trim().toLowerCase();

    if (trimmed.length > 0) {
      const prodResults = fsProducts
        .filter(
          (product) =>
            product.name.toLowerCase().includes(trimmed) ||
            product.category.toLowerCase().includes(trimmed)
        )
        .slice(0, 5);

      const blogResults = blogs
        .filter((blog) => {
          const titleMatch = blog.title?.toLowerCase().includes(trimmed);
          const seoMatch = blog.seoTitle
            ? blog.seoTitle.toLowerCase().includes(trimmed)
            : false;

          let tagsMatch = false;
          if (Array.isArray(blog.tags)) {
            tagsMatch = blog.tags.some((t) =>
              String(t).toLowerCase().includes(trimmed)
            );
          } else if (typeof blog.tags === "string") {
            tagsMatch = blog.tags.toLowerCase().includes(trimmed);
          }

          return titleMatch || seoMatch || tagsMatch;
        })
        .slice(0, 5);

      setSearchResultsProducts(prodResults);
      setSearchResultsBlogs(blogResults);
      setIsSearchOpen(prodResults.length > 0 || blogResults.length > 0);
    } else {
      setSearchResultsProducts([]);
      setSearchResultsBlogs([]);
      setIsSearchOpen(false);
    }
  };

  const loadWishlistItems = async () => {
    if (!user?.uid) {
      setWishlistItems([]);
      return;
    }
    try {
      setWishlistLoading(true);
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);
      const data = snap.exists() ? (snap.data() as any) : null;
      const wishlist: string[] = Array.isArray(data?.wishlist)
        ? data!.wishlist
        : [];

      if (!wishlist.length) {
        setWishlistItems([]);
        return;
      }

      const uniqueIds = Array.from(new Set(wishlist));
      const prods: WishlistItem[] = [];

      for (const pid of uniqueIds) {
        const pRef = doc(db, "products", pid);
        const pSnap = await getDoc(pRef);
        if (pSnap.exists()) {
          const pData = pSnap.data() as any;
          prods.push({
            id: pSnap.id,
            name: pData.name,
            category: pData.category,
            price: Number(pData.price || 0),
            image: pData.coverImage || pData.image || pData.images?.[0] || "",
          });
        }
      }
      setWishlistItems(prods.slice(0, 3));
    } catch (err) {
      console.error("Error loading wishlist items:", err);
      setWishlistItems([]);
    } finally {
      setWishlistLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
      if (
        wishlistRef.current &&
        !wishlistRef.current.contains(event.target as Node)
      ) {
        setIsWishlistOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleProductClick = (id: string) => {
    navigate(`/product/${id}`);
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  const handleBlogClick = (id: string) => {
    navigate(`/care?blogId=${id}`);
    setIsSearchOpen(false);
    setSearchQuery("");
  };

  const handleWishlistProductClick = (id: string) => {
    navigate(`/product/${id}`);
    setIsWishlistOpen(false);
  };

  const handleWishlistIconClick = () => {
    if (!user?.uid) {
      navigate("/login");
      return;
    }
    // Open immediately
    setIsWishlistOpen((prev) => !prev);
    // Then load data in background
    void loadWishlistItems();
  };

  const goToWishlistPage = () => {
    setIsWishlistOpen(false);
    navigate("/profile/wishlist");
  };

  const [currentBanner, setCurrentBanner] = useState(0);
  const banners = [
    {
      id: 0,
      bg: "bg-[#c16e41]",
      content: <span>FREE SHIPPING ON ORDERS OVER ₹750</span>,
    },
    {
      id: 1,
      bg: "bg-[#5F6F52]",
      content: (
        <div className="flex items-center justify-center gap-4">
          <span>APPLY "FIRST20" TO GET 20% OFF YOUR FIRST PURCHASE</span>
        </div>
      ),
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const hasAnySearchResults =
    searchResultsProducts.length > 0 || searchResultsBlogs.length > 0;

  const wishlistCount = wishlistItems.length;

  return (
    <>
      <div className="relative h-9 overflow-hidden bg-black">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBanner}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.5 }}
            className={clsx(
              "absolute inset-0 w-full h-full flex items-center justify-center text-white text-xs tracking-wider font-medium",
              banners[currentBanner].bg
            )}
          >
            {banners[currentBanner].content}
          </motion.div>
        </AnimatePresence>
      </div>

      <nav className="absolute top-0 left-0 w-full z-40 transition-all duration-300">
        <div className="bg-transparent pt-4 pb-2 mt-12">
          <div className="max-w-[1440px] mx-auto px-4 flex items-center justify-between gap-4">
            <button
              className="lg:hidden text-white drop-shadow-md z-50 relative"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <div className="hidden lg:flex items-center bg-transparent">
              <Link
                to="/"
                className={clsx(
                  "px-6 py-3 text-base font-medium transition-colors border border-white/20 mr-[-1px]",
                  location.pathname === "/"
                    ? "bg-[#c16e41] text-white border-[#c16e41]"
                    : "text-white/80 hover:bg-[#c16e41] hover:text-white"
                )}
              >
                Home
              </Link>
              {navLinks.map((link) => {
                const isActive =
                  link.path === "/shop"
                    ? location.pathname === "/shop" && !location.search
                    : location.pathname + location.search === link.path;

                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    className={clsx(
                      "px-6 py-3 text-base font-medium transition-colors border border-white/20 mr-[-1px]",
                      isActive
                        ? "bg-[#c16e41] text-white border-[#c16e41]"
                        : "text-white/80 hover:bg-[#c16e41] hover:text-white hover:border-[#c16e41]"
                    )}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>

            <div className="absolute left-1/2 top-10 transform -translate-x-1/2 flex justify-center z-40">
              <Link to="/" className="flex flex-col items-center group">
                <div className="w-32 md:w-44 h-16 flex items-center justify-center mb-1 group-hover:scale-105 transition-transform duration-300 drop-shadow-md bg-transparent">
                  <img
                    src="/clogo.png"
                    alt="Plantasy"
                    className="w-50 h-50 object-contain mt-10"
                  />
                </div>
              </Link>
            </div>

            <div className="flex items-center gap-2 md:gap-4 ml-auto lg:ml-0 z-50">
              <div className="lg:hidden">
                {user ? (
                  <Link to="/profile" className="text-white p-2">
                    <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden border border-white/20">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="User"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserIcon className="w-full h-full p-1 text-white" />
                      )}
                    </div>
                  </Link>
                ) : (
                  <Link to="/login" className="text-white p-2">
                    <UserIcon size={24} />
                  </Link>
                )}
              </div>

              <div className="hidden lg:flex items-center gap-4">
                {user ? (
                  <>
                    <div className="relative" ref={wishlistRef}>
                      <button
                        type="button"
                        onClick={handleWishlistIconClick}
                        className="relative text-white hover:text-[#c16e41] cursor-pointer transition-colors p-2"
                        title="Wishlist"
                      >
                        <Heart
                          size={20}
                          className="transition-colors"
                          fill={wishlistCount > 0 ? "currentColor" : "none"}
                          color={wishlistCount > 0 ? "#ef4444" : "currentColor"}
                        />
                        {wishlistCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                            {wishlistCount}
                          </span>
                        )}
                      </button>

                      <AnimatePresence>
                        {isWishlistOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute right-0 top-full mt-2 w-80 bg-[#1a1a1a] border border-white/10 rounded-sm shadow-2xl z-[60] overflow-hidden"
                          >
                            <div className="py-2 max-h-[320px] overflow-y-auto">
                              <div className="px-4 py-2 flex items-center justify-between">
                                <span className="text-xs uppercase tracking-widest text-white/60">
                                  Wishlist
                                </span>
                                <button
                                  type="button"
                                  onClick={goToWishlistPage}
                                  className="text-[11px] text-[#c16e41] hover:text-[#e08b5b] uppercase tracking-widest"
                                >
                                  More
                                </button>
                              </div>

                              {wishlistLoading ? (
                                <div className="px-4 py-4 text-xs text-gray-400">
                                  Loading wishlist...
                                </div>
                              ) : wishlistItems.length === 0 ? (
                                <div className="px-4 py-4 text-xs text-gray-400">
                                  No items in wishlist.
                                </div>
                              ) : (
                                wishlistItems.map((item) => (
                                  <div
                                    key={item.id}
                                    onClick={() =>
                                      handleWishlistProductClick(item.id)
                                    }
                                    className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-0"
                                  >
                                    <div className="w-10 h-10 bg-white/5 rounded-sm overflow-hidden flex-shrink-0">
                                      {item.image ? (
                                        <img
                                          src={item.image}
                                          alt={item.name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[10px] text-white/60">
                                          Product
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="text-white text-sm font-medium line-clamp-1">
                                        {item.name}
                                      </h4>
                                      <p className="text-white/50 text-xs capitalize">
                                        {item.category}
                                      </p>
                                    </div>
                                    <span className="text-[#c16e41] text-sm font-medium">
                                      ₹{item.price.toFixed(2)}
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="relative" ref={userMenuRef}>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                          className="flex items-center gap-2 group bg-[#2a2a2a]/90 hover:bg-[#2a2a2a] backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5 transition-all"
                        >
                          <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden border border-white/20">
                            {profileImage ? (
                              <img
                                src={profileImage}
                                alt="User"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <UserIcon className="w-full h-full p-1 text-white" />
                            )}
                          </div>
                          <ChevronDown
                            size={16}
                            className={`text-white transition-transform duration-300 ${
                              isUserMenuOpen ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      </div>

                      <AnimatePresence>
                        {isUserMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute right-0 top-full mt-2 w-64 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden"
                          >
                            <div className="py-2">
                              <Link
                                to="/profile"
                                className="block px-6 py-3 text-sm transition-colors text-white hover:text-[#c16e41] flex items-center gap-3"
                              >
                                <UserIcon size={16} /> Profile
                              </Link>
                              {user?.role === "admin" && (
                                <Link
                                  to="/admin"
                                  className="block px-6 py-3 text-sm transition-colors text-white hover:text-[#c16e41] flex items-center gap-3"
                                >
                                  <UserIcon size={16} /> Admin Dashboard
                                </Link>
                              )}
                              {[
                                {
                                  label: "My Orders",
                                  icon: Package,
                                  path: "/profile/orders",
                                },
                                {
                                  label: "My Addresses",
                                  icon: MapPin,
                                  path: "/profile/addresses",
                                },
                                {
                                  label: "My Wallet",
                                  icon: Wallet,
                                  path: "/profile/wallet",
                                },
                                {
                                  label: "My Subscriptions",
                                  icon: Package,
                                  path: "/profile/subscriptions",
                                },
                                {
                                  label: "My Wishlist",
                                  icon: Heart,
                                  path: "/profile/wishlist",
                                },
                                {
                                  label: "My Account",
                                  icon: UserIcon,
                                  path: "/profile/my-account",
                                },
                              ].map((item, idx) => (
                                <Link
                                  key={idx}
                                  to={item.path}
                                  className={`block px-6 py-3 text-sm transition-colors flex items-center gap-3 ${
                                    location.pathname === item.path
                                      ? "text-[#c16e41]"
                                      : "text-white hover:text-[#c16e41]"
                                  }`}
                                >
                                  <item.icon size={16} />
                                  {item.label}
                                </Link>
                              ))}
                              <div className="h-px bg-white/10 my-1 mx-6" />
                              <button
                                onClick={() => {
                                  logout();
                                  setIsUserMenuOpen(false);
                                }}
                                className="w-full text-left px-6 py-3 text-sm text-white hover:text-[#c16e41] transition-colors flex items-center gap-3"
                              >
                                <UserIcon size={16} className="opacity-0" /> Log
                                Out
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="flex items-center gap-3 px-4 py-2.5 bg-[#2a2a2a]/80 hover:bg-[#2a2a2a] backdrop-blur-md rounded-lg text-white text-sm font-medium transition-all shadow-sm border border-white/5"
                  >
                    <div className="bg-white rounded-full p-0.5">
                      <UserIcon
                        size={16}
                        className="text-[#2a2a2a] fill-current"
                      />
                    </div>
                    <span>Log In</span>
                  </Link>
                )}
              </div>

              <div className="relative hidden lg:block" ref={searchRef}>
                <div className="bg-[#2a2a2a]/80 hover:bg-[#2a2a2a] backdrop-blur-md flex itemscenter gap-3 px-4 py-2.5 rounded-lg border border-white/5 focus-within:border-white/20 transition-all min-w-[200px]">
                  <Search size={18} className="text-white/80" />
                  <input
                    type="text"
                    placeholder="Search products & blogs"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-white/80"
                  />
                </div>

                <AnimatePresence>
                  {isSearchOpen && hasAnySearchResults && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 top-full mt-2 w-96 bg-[#1a1a1a] border border-white/10 rounded-sm shadow-2xl z-[60] overflow-hidden"
                    >
                      <div className="py-2 max-h-[420px] overflow-y-auto">
                        {searchResultsProducts.length > 0 && (
                          <>
                            <div className="px-4 py-2 text-xs uppercase tracking-widest text-white/60">
                              Products
                            </div>
                            {searchResultsProducts.map((product) => (
                              <div
                                key={product.id}
                                onClick={() => handleProductClick(product.id)}
                                className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-0"
                              >
                                <div className="w-10 h-10 bg-white/5 rounded-sm overflow-hidden flex-shrink-0">
                                  {product.image ? (
                                    <img
                                      src={product.image}
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-white/60">
                                      Product
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-white text-sm font-medium">
                                    {product.name}
                                  </h4>
                                  <p className="text-white/50 text-xs capitalize">
                                    {product.category}
                                  </p>
                                </div>
                                <span className="text-[#c16e41] text-sm font-medium">
                                  ₹{product.price.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </>
                        )}

                        {searchResultsBlogs.length > 0 && (
                          <>
                            <div className="px-4 pt-3 pb-2 text-xs uppercase tracking-widest text-white/60 border-t border-white/10">
                              Blogs
                            </div>
                            {searchResultsBlogs.map((blog) => (
                              <div
                                key={blog.id}
                                onClick={() => handleBlogClick(blog.id)}
                                className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-0"
                              >
                                <div className="w-10 h-10 bg-white/5 rounded-sm overflow-hidden flex-shrink-0">
                                  {blog.coverImage ? (
                                    <img
                                      src={blog.coverImage}
                                      alt={blog.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-white/60">
                                      Blog
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-white text-sm font-medium line-clamp-2">
                                    {blog.title}
                                  </h4>
                                  {blog.seoTitle && (
                                    <p className="text-white/50 text-xs line-clamp-1">
                                      {blog.seoTitle}
                                    </p>
                                  )}
                                  {Array.isArray(blog.tags) &&
                                    blog.tags.length > 0 && (
                                      <p className="text-[#c16e41] text-[10px] mt-1 uppercase tracking-widest line-clamp-1">
                                        {blog.tags.join(" • ")}
                                      </p>
                                    )}
                                </div>
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={toggleCart}
                className="flex items-center gap-2 px-2 py-2 text-white hover:text-[#c16e41] transition-colors relative"
              >
                <ShoppingCart size={22} />
                <span className="text-sm font-medium hidden lg:inline">
                  Cart {itemsCount}
                </span>
                {itemsCount > 0 && (
                  <span className="lg:hidden absolute top-0 right-0 bg-accent text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                    {itemsCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden bg-[#1a1a1a] border-t border-white/10 overflow-hidden absolute w-full top-full left-0 z-30"
            >
              <div className="flex flex-col p-6 space-y-4">
                <Link
                  to="/"
                  onClick={() => setIsMenuOpen(false)}
                  className="text-lg font-serif text-white block"
                >
                  Home
                </Link>
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-lg font-serif text-white block"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
};

export default Navbar;
