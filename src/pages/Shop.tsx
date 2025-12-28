import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import { useProducts } from '../context/ProductContext';
import clsx from 'clsx';
import { Plus, Minus } from 'lucide-react';

const SidebarAccordion = ({ title, children, defaultOpen = false }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border-b border-white/10">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-6 flex items-center justify-between text-left group"
            >
                <span className="font-sans text-lg text-white font-light">{title}</span>
                {isOpen ? <Minus size={16} className="text-white/70" /> : <Plus size={16} className="text-white/70" />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="pb-6">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Shop = () => {
    const { products } = useProducts();
    const [searchParams, setSearchParams] = useSearchParams();
    const categoryParam = searchParams.get('category');
    const [activeCategory, setActiveCategory] = useState<string>(categoryParam || 'all');
    const [maxPrice, setMaxPrice] = useState(100);

    useEffect(() => {
        setActiveCategory(categoryParam || 'all');
    }, [categoryParam]);

    const categories = [
        { id: 'all', label: 'All' },
        { id: 'new-arrivals', label: 'New Arrivals' },
        { id: 'sale', label: 'Sale' },
        { id: 'plants', label: 'Plants' },
        { id: 'pots', label: 'Pots' },
        { id: 'subscriptions', label: 'Subscriptions' },
    ];

    const handleCategoryChange = (id: string) => {
        setActiveCategory(id);
        if (id === 'all') {
            searchParams.delete('category');
            setSearchParams(searchParams);
        } else {
            setSearchParams({ category: id });
        }
    };

    const filteredProducts = products.filter(product => {
        // Category Filter
        let matchesCategory = true;
        if (activeCategory === 'all') {
            matchesCategory = true;
        } else if (activeCategory === 'new-arrivals') {
            matchesCategory = product.badge === 'New Arrival';
        } else if (activeCategory === 'sale') {
            matchesCategory = product.badge === 'Sale';
        } else if (activeCategory === 'subscriptions') {
            matchesCategory = product.category === 'plants' && product.name.toLowerCase().includes('subscription'); // Basic check based on data
        } else {
            matchesCategory = product.category === activeCategory;
        }

        // Price Filter
        const matchesPrice = product.price <= maxPrice;

        return matchesCategory && matchesPrice;
    });

    return (
        <div className="min-h-screen bg-black text-secondary pt-32 pb-20 transition-colors duration-300">
            {/* Centered Title */}
            <div className="text-center mt-12 mb-32 px-4">
                <h1 className="text-6xl md:text-8xl font-serif font-medium tracking-tight mb-4 capitalize text-white">
                    {activeCategory === 'all' ? 'Shop All' : categories.find(c => c.id === activeCategory)?.label || activeCategory}
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
                                {categories.map(cat => (
                                    <li key={cat.id}>
                                        <button
                                            onClick={() => handleCategoryChange(cat.id)}
                                            className={clsx(
                                                "text-[15px] transition-colors text-left w-full block",
                                                activeCategory === cat.id ? "text-white font-medium" : "text-gray-400 hover:text-white"
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
                                    <span>$0 - ${maxPrice}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="200"
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                                    className="w-full h-[2px] bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                                />
                            </div>
                        </SidebarAccordion>

                        <SidebarAccordion title="Color">
                            <div className="text-sm text-gray-500 py-2">No color filters available.</div>
                        </SidebarAccordion>

                        <SidebarAccordion title="Size">
                            <div className="text-sm text-gray-500 py-2">No size filters available.</div>
                        </SidebarAccordion>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1">
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
                </div>
            </div>
        </div>
    );
};

export default Shop;
