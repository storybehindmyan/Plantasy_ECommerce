import React, { useState } from 'react';
import { Facebook, Instagram, Twitter, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FooterSection = ({ title, children }: { title: string, children: React.ReactNode }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border-b border-primary/10 md:border-none">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full py-4 md:py-0 md:mb-4 group"
            >
                <h3 className="font-serif text-lg">{title}</h3>
                <span className="md:hidden">
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
            </button>
            <AnimatePresence initial={false}>
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                        height: isOpen || window.innerWidth >= 768 ? 'auto' : 0,
                        opacity: isOpen || window.innerWidth >= 768 ? 1 : 0
                    }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden md:h-auto md:opacity-100"
                >
                    <div className="pb-4 md:pb-0 text-sm text-gray-600 space-y-2 flex flex-col">
                        {children}
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

const Footer = () => {
    return (
        <footer className="bg-black pt-16 pb-8 border-t border-white/10 text-white">
            <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">

                {/* Brand */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-serif font-bold tracking-tight text-white">PLANTASY</h2>
                    <p className="text-sm text-gray-400 max-w-xs">
                        Bringing the beauty of nature into your home with curated plants and pots.
                    </p>
                    <div className="flex gap-4 pt-2">
                        {[Facebook, Instagram, Twitter, Mail].map((Icon, i) => (
                            <a
                                key={i}
                                href="#"
                                className="p-2 bg-white/10 rounded-full text-white hover:bg-white hover:text-black transition-all duration-300 transform hover:-translate-y-1 shadow-sm"
                            >
                                <Icon size={18} />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Links */}
                <FooterSection title="Shop">
                    <a href="#" className="hover:text-accent transition text-gray-400 hover:text-white">All Plants</a>
                    <a href="#" className="hover:text-accent transition text-gray-400 hover:text-white">New Arrivals</a>
                    <a href="#" className="hover:text-accent transition text-gray-400 hover:text-white">Pots & Planters</a>
                    <a href="#" className="hover:text-accent transition text-gray-400 hover:text-white">Plant Care</a>
                </FooterSection>

                <FooterSection title="Company">
                    <a href="#" className="hover:text-accent transition text-gray-400 hover:text-white">Our Story</a>
                    <a href="#" className="hover:text-accent transition text-gray-400 hover:text-white">Sustainability</a>
                    <a href="#" className="hover:text-accent transition text-gray-400 hover:text-white">Careers</a>
                    <a href="#" className="hover:text-accent transition text-gray-400 hover:text-white">Terms of Service</a>
                </FooterSection>

                <FooterSection title="Support">
                    <a href="#" className="hover:text-accent transition text-gray-400 hover:text-white">FAQ</a>
                    <a href="#" className="hover:text-accent transition text-gray-400 hover:text-white">Shipping & Returns</a>
                    <a href="#" className="hover:text-accent transition text-gray-400 hover:text-white">Contact Us</a>
                    <a href="#" className="hover:text-accent transition text-gray-400 hover:text-white">Track Order</a>
                </FooterSection>
            </div>

            <div className="text-center text-xs text-gray-600 pt-8 border-t border-white/5">
                &copy; {new Date().getFullYear()} Plantasy. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;
