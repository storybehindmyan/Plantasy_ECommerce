import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { PRODUCTS } from '../data/products';
import type { Product } from '../data/products';
import { useCart } from '../context/CartContext';
import { ChevronLeft, ChevronRight, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import ProductCard from '../components/ProductCard';

const AccordionItem = ({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-white/20">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-4 flex items-center justify-between text-left group"
            >
                <span className="text-white font-medium">{title}</span>
                {isOpen ? <ChevronUp size={18} className="text-white" /> : <ChevronDown size={18} className="text-white" />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
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
    const { id } = useParams();
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [size, setSize] = useState("");

    const currentIndex = useMemo(() => PRODUCTS.findIndex((p: Product) => p.id === id), [id]);
    const product = PRODUCTS[currentIndex];
    const prevProduct = currentIndex > 0 ? PRODUCTS[currentIndex - 1] : null;
    const nextProduct = currentIndex < PRODUCTS.length - 1 ? PRODUCTS[currentIndex + 1] : null;

    // Get related products (just simple logic for now: same category excluding current)
    const relatedProducts = useMemo(() => {
        if (!product) return [];
        return PRODUCTS.filter((p: Product) => p.category === product.category && p.id !== product.id).slice(0, 4);
    }, [product]);

    if (!product) {
        return <div className="p-20 text-center text-white bg-primary min-h-screen">Product not found.</div>;
    }

    const handleAddToCart = () => {
        addToCart(product, quantity);
        // Toast logic could go here
    };

    return (
        <div className="min-h-screen bg-black">
            {/* Top Section for Product Main Info */}
            <div className="bg-transparent text-white pt-28 pb-20">
                <div className="max-w-[1280px] mx-auto px-6">
                    {/* Header: Breadcrumbs & Nav */}
                    <div className="flex items-center justify-between mb-12 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                            <Link to="/" className="hover:text-white transition-colors">Home</Link> /
                            <Link to="/shop" className="hover:text-white transition-colors">Shop All</Link> /
                            <span className="text-white font-medium">{product.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            {prevProduct ? (
                                <Link to={`/product/${prevProduct.id}`} className="hover:text-accent flex items-center gap-1 transition-colors"><ChevronLeft size={16} /> Prev</Link>
                            ) : <span className="text-gray-600 flex items-center gap-1"><ChevronLeft size={16} /> Prev</span>}
                            <span>|</span>
                            {nextProduct ? (
                                <Link to={`/product/${nextProduct.id}`} className="hover:text-accent flex items-center gap-1 transition-colors">Next <ChevronRight size={16} /></Link>
                            ) : <span className="text-gray-600 flex items-center gap-1">Next <ChevronRight size={16} /></span>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
                        {/* Left: Image (Square aspect ratio as per reference) */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6 }}
                            className="bg-[#E8E6E1] flex items-center justify-center p-0 self-start w-full"
                        >
                            <div className="overflow-hidden bg-transparent w-full">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-auto object-cover mix-blend-multiply"
                                />
                            </div>
                        </motion.div>

                        {/* Right: Product Details Form */}
                        <div className="space-y-8">
                            <div>
                                <h1 className="text-4xl md:text-5xl font-serif text-white mb-2">{product.name}</h1>
                                <p className="text-xs text-gray-400 mb-6">SKU: {product.id.padStart(3, '0')}</p>

                                <div className="flex items-center gap-3 text-xl">
                                    {product.originalPrice && (
                                        <span className="text-gray-500 line-through decoration-1">₹{product.originalPrice.toFixed(2)}</span>
                                    )}
                                    <span className="text-white font-medium">₹{product.price.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Options */}
                            <div className="space-y-6">
                                {/* Size Input */}
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400 block">Size <span className="text-red-400">*</span></label>
                                    <div className="relative">
                                        <select
                                            value={size}
                                            onChange={(e) => setSize(e.target.value)}
                                            className="w-full appearance-none bg-transparent border border-white/20 px-4 py-3 pr-8 rounded-none text-sm text-white focus:border-white focus:outline-none cursor-pointer"
                                        >
                                            <option value="" disabled className="bg-black text-gray-500">Select</option>
                                            <option value="small" className="bg-black">Small</option>
                                            <option value="medium" className="bg-black">Medium</option>
                                            <option value="large" className="bg-black">Large</option>
                                        </select>
                                        <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                                    </div>
                                </div>

                                {/* Quantity Input */}
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400 block">Quantity <span className="text-red-400">*</span></label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Number(e.target.value))}
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
                                    I'm a product detail. I'm a great place to add more information about your product such as sizing, material, care and cleaning instructions. This is also a great space to write what makes this product special and how your customers can benefit from this item.
                                </AccordionItem>
                                <AccordionItem title="Return & Refund Policy">
                                    I’m a Return and Refund policy. I’m a great place to let your customers know what to do in case they are dissatisfied with their purchase. Having a straightforward refund or exchange policy is a great way to build trust and reassure your customers that they can buy with confidence.
                                </AccordionItem>
                                <AccordionItem title="Shipping Info">
                                    I'm a shipping policy. I'm a great place to add more information about your shipping methods, packaging and cost. Providing straightforward information about your shipping policy is a great way to build trust and reassure your customers that they can buy from you with confidence.
                                </AccordionItem>
                            </div>

                            <div className="flex items-center gap-4 text-gray-500 pt-4">
                                {/* Social Icons Mock */}
                                <div className="w-5 h-5 bg-white/10 hover:bg-white/20 transition-colors rounded-full flex items-center justify-center text-[10px] text-white font-bold cursor-pointer">f</div>
                                <div className="w-5 h-5 bg-white/10 hover:bg-white/20 transition-colors rounded-full flex items-center justify-center text-[10px] text-white font-bold cursor-pointer">P</div>
                                <div className="w-5 h-5 bg-white/10 hover:bg-white/20 transition-colors rounded-full flex items-center justify-center text-[10px] text-white font-bold cursor-pointer">W</div>
                                <div className="w-5 h-5 bg-white/10 hover:bg-white/20 transition-colors rounded-full flex items-center justify-center text-[10px] text-white font-bold cursor-pointer">X</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Related Products Section - Black Background */}
            <div className="bg-primary text-secondary py-20 border-t border-white/10">
                <div className="max-w-[1280px] mx-auto px-6">
                    <h3 className="text-3xl font-serif text-center mb-12">Related Products</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-12">
                        {relatedProducts.length > 0 ? (
                            relatedProducts.map((p: Product) => (
                                <ProductCard key={p.id} product={p} />
                            ))
                        ) : (
                            <p className="col-span-4 text-center text-gray-500">No related products found.</p>
                        )}
                    </div>
                    {/* Add carousel arrows if needed, currently reusing grid for responsiveness */}
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;
