import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, Search, User as UserIcon, Menu, X, Bell, ChevronDown, Package, MapPin, Wallet, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useProducts } from '../context/ProductContext';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from '../data/products';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { itemsCount, toggleCart } = useCart();
    const { products } = useProducts();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const location = useLocation();
    const navigate = useNavigate();

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Product[]>([]);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);

    // Explicit links as shown in reference
    const navLinks = [
        { name: 'Shop All', path: '/shop' },
        { name: 'Plants', path: '/shop?category=plants' },
        { name: 'Pots', path: '/shop?category=pots' },
        { name: 'Seeds', path: '/shop?category=seeds' },
        { name: 'Care', path: '/care' },
    ];

    // Handle Search Input Change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.trim().length > 0) {
            const results = products.filter(product =>
                product.name.toLowerCase().includes(query.toLowerCase()) ||
                product.category.toLowerCase().includes(query.toLowerCase())
            ).slice(0, 5); // Limit to 5 results
            setSearchResults(results);
            setIsSearchOpen(true);
        } else {
            setSearchResults([]);
            setIsSearchOpen(false);
        }
    };

    // Close search when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsSearchOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleProductClick = (id: string) => {
        navigate(`/product/${id}`);
        setIsSearchOpen(false);
        setSearchQuery('');
    };

    return (
        <>
            {/* Promo Banner */}
            <div className="bg-accent text-white text-center text-xs py-2 tracking-wider font-medium">
                FREE SHIPPING ON ORDERS OVER $75
            </div>

            {/* Navbar */}
            <nav className="absolute top-0 left-0 w-full z-40 transition-all duration-300">
                <div className="bg-transparent pt-4 pb-2 mt-12">
                    <div className="max-w-[1440px] mx-auto px-4 flex items-center justify-between gap-4">

                        {/* Mobile Toggle */}
                        <button
                            className="lg:hidden text-white drop-shadow-md"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>

                        {/* Left Nav Section (Desktop) */}
                        <div className="hidden lg:flex items-center bg-transparent">
                            <Link
                                to="/"
                                className={clsx(
                                    "px-5 py-2 text-sm font-medium transition-colors border border-white/20 mr-[-1px]",
                                    location.pathname === '/' ? "bg-black text-white" : "text-white/80 hover:bg-[#c16e41] hover:text-white"
                                )}
                            >
                                Home
                            </Link>
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className={clsx(
                                        "px-5 py-2 text-sm font-medium transition-colors border border-white/20 mr-[-1px]",
                                        location.pathname === link.path || (link.path.includes('shop') && location.pathname === '/shop' && link.name === 'Shop All' && !location.search)
                                            ? "bg-[#c16e41] text-white border-[#c16e41]"
                                            : "text-white/80 hover:bg-[#c16e41] hover:text-white hover:border-[#c16e41]"
                                    )}
                                >
                                    {link.name}
                                </Link>
                            ))}
                        </div>

                        {/* Center Logo Area */}
                        <div className="absolute left-1/2 top-10 transform -translate-x-1/2 flex justify-center z-50">
                            <Link to="/" className="flex flex-col items-center group">
                                <div className="w-12 h-16 border-2 border-white/80 rounded-full flex items-center justify-center mb-1 group-hover:scale-105 transition-transform duration-300 drop-shadow-md bg-transparent">
                                    <span className="font-serif text-2xl italic text-white pt-1">P</span>
                                </div>
                                <span className="text-xl font-serif font-semibold tracking-tight text-white drop-shadow-md mt-1">Plantasy</span>
                            </Link>
                        </div>

                        {/* Right Action Section */}
                        <div className="hidden lg:flex items-center bg-black/90 backdrop-blur-sm rounded-sm p-1 gap-1 shadow-lg border border-white/10">
                            {/* Login */}
                            {user ? (
                                <div className="relative">
                                    <div className="flex items-center gap-4 px-4 py-2 border-r border-white/10">
                                        <Bell size={20} className="text-white hover:text-[#c16e41] cursor-pointer transition-colors" />
                                        <button
                                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                                            className="flex items-center gap-2 group"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden border border-white/20">
                                                {user.photoURL ? (
                                                    <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
                                                ) : (
                                                    <UserIcon className="w-full h-full p-1 text-white" />
                                                )}
                                            </div>
                                            <ChevronDown size={16} className={`text-white transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                    </div>

                                    {/* Dropdown Menu */}
                                    <AnimatePresence>
                                        {isMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute right-0 top-full mt-2 w-64 bg-black border border-white/10 rounded-sm shadow-xl z-50 overflow-hidden"
                                            >
                                                <div className="py-2">
                                                    <Link to="/profile" className="block px-6 py-3 text-sm transition-colors text-white hover:text-[#c16e41] flex items-center gap-3">
                                                        <UserIcon size={16} /> Profile
                                                    </Link>
                                                    {user?.role === 'admin' && ( // Added Admin Link
                                                        <Link to="/admin" className="block px-6 py-3 text-sm transition-colors text-white hover:text-[#c16e41] flex items-center gap-3">
                                                            <UserIcon size={16} /> Admin Dashboard
                                                        </Link>
                                                    )}
                                                    {[
                                                        { label: 'My Orders', icon: Package, path: '/profile/orders' },
                                                        { label: 'My Addresses', icon: MapPin, path: '/profile/addresses' },
                                                        { label: 'My Wallet', icon: Wallet, path: '/profile/wallet' },
                                                        { label: 'My Subscriptions', icon: Package, path: '/profile/subscriptions' },
                                                        { label: 'My Wishlist', icon: Heart, path: '/profile/wishlist' },
                                                        { label: 'My Account', icon: UserIcon, path: '/profile/my-account' }
                                                    ].map((item, idx) => (
                                                        <Link
                                                            key={idx}
                                                            to={item.path}
                                                            className={`block px-6 py-3 text-sm transition-colors flex items-center gap-3 ${location.pathname === item.path ? 'text-[#c16e41]' : 'text-white hover:text-[#c16e41]'}`}
                                                        >
                                                            <item.icon size={16} />
                                                            {item.label}
                                                        </Link>
                                                    ))}
                                                    <div className="h-px bg-white/10 my-1 mx-6" />
                                                    <button
                                                        onClick={() => {
                                                            logout();
                                                            setIsMenuOpen(false);
                                                        }}
                                                        className="w-full text-left px-6 py-3 text-sm text-white hover:text-[#c16e41] transition-colors flex items-center gap-3"
                                                    >
                                                        <UserIcon size={16} className="opacity-0" /> {/* Spacer */}
                                                        Log Out
                                                    </button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <Link to="/login" className="flex items-center gap-2 px-4 py-2 text-white/90 hover:bg-white/10 rounded-sm text-sm font-medium transition-colors">
                                    <UserIcon size={18} />
                                    <span>Log In</span>
                                </Link>
                            )}

                            {/* Search Bar - Interactive */}
                            <div className="relative" ref={searchRef}>
                                <div className="bg-white/10 flex items-center gap-2 px-3 py-2 rounded-sm mx-1 min-w-[200px] border border-transparent focus-within:border-white/30 transition-colors">
                                    <Search size={16} className="text-white/60" />
                                    <input
                                        type="text"
                                        placeholder="Search"
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        className="bg-transparent border-none outline-none text-white text-sm w-full placeholder:text-white/60"
                                    />
                                </div>

                                {/* Search Results Dropdown */}
                                <AnimatePresence>
                                    {isSearchOpen && searchResults.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 10 }}
                                            className="absolute right-0 top-full mt-2 w-80 bg-[#1a1a1a] border border-white/10 rounded-sm shadow-2xl z-[60] overflow-hidden"
                                        >
                                            <div className="py-2">
                                                {searchResults.map((product) => (
                                                    <div
                                                        key={product.id}
                                                        onClick={() => handleProductClick(product.id)}
                                                        className="flex items-center gap-4 px-4 py-3 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-0"
                                                    >
                                                        <div className="w-10 h-10 bg-white/5 rounded-sm overflow-hidden flex-shrink-0">
                                                            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="flex-1">
                                                            <h4 className="text-white text-sm font-medium">{product.name}</h4>
                                                            <p className="text-white/50 text-xs capitalize">{product.category}</p>
                                                        </div>
                                                        <span className="text-[#c16e41] text-sm font-medium">${product.price.toFixed(2)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Cart */}
                            <button
                                onClick={toggleCart}
                                className="flex items-center gap-2 px-4 py-2 text-white/90 hover:bg-white/10 rounded-sm text-sm font-medium transition-colors"
                            >
                                <ShoppingCart size={18} />
                                <span>Cart {itemsCount}</span>
                            </button>
                        </div>

                        {/* Mobile Cart Icon */}
                        <button onClick={toggleCart} className="lg:hidden text-white drop-shadow-md p-2 relative">
                            <ShoppingCart size={24} />
                            {itemsCount > 0 && (
                                <span className="absolute top-1 right-0 bg-accent text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                                    {itemsCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="lg:hidden bg-secondary border-t border-primary/10 overflow-hidden absolute w-full"
                        >
                            <div className="flex flex-col p-6 space-y-4">
                                <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-lg font-serif text-primary block">Home</Link>
                                {navLinks.map((link) => (
                                    <Link
                                        key={link.name}
                                        to={link.path}
                                        onClick={() => setIsMenuOpen(false)}
                                        className="text-lg font-serif text-primary block"
                                    >
                                        {link.name}
                                    </Link>
                                ))}
                                <hr className="border-primary/10" />
                                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 text-primary font-medium">
                                    <UserIcon size={20} /> Log In
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>
        </>
    );
};

export default Navbar;
