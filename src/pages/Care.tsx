import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Sun, Droplets, Thermometer } from 'lucide-react';

const CareItem = ({ title, icon: Icon, children }: any) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-white/10 rounded-sm overflow-hidden bg-transparent">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition group"
            >
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/5 rounded-full text-accent group-hover:bg-accent group-hover:text-white transition-colors">
                        <Icon size={24} />
                    </div>
                    <span className="font-serif text-xl text-white">{title}</span>
                </div>
                {isOpen ? <ChevronUp className="text-white/50" /> : <ChevronDown className="text-white/50" />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-6 pt-0 text-gray-400 leading-relaxed border-t border-white/10 mt-2 font-light">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Care = () => {
    return (
        <div className="min-h-screen bg-black pt-40 pb-20">
            <div className="max-w-3xl mx-auto px-6">
                <div className="text-center mb-20">
                    <h1 className="text-5xl md:text-7xl font-serif font-medium text-white mb-6">Your Guide to Plant Care</h1>
                </div>

                <div className="space-y-6">
                    <CareItem title="Light Requirements" icon={Sun}>
                        <p>
                            Understanding light is crucial. Most indoor plants prefer "bright, indirect light," which means they cast a shadow but aren't in the direct beam of the sun.
                            South-facing windows offer the most intese light, while north-facing ones are gentler. If your plant is reaching towards the light, move it closer to a window.
                        </p>
                    </CareItem>

                    <CareItem title="Watering Basics" icon={Droplets}>
                        <p>
                            Overwatering is the #1 killer of houseplants! Always check the soil before adding water. Stick your finger about an inch deep into the soil; if it feels dry, it's time to water.
                            Ensuring your pot has drainage holes is non-negotiable to prevent root rot.
                        </p>
                    </CareItem>

                    <CareItem title="Temperature & Humidity" icon={Thermometer}>
                        <p>
                            Most tropical plants thrive in temperatures between 65°F and 80°F (18°C - 26°C). Avoid placing them near cold drafts (like AC vents) or heat sources (radiators).
                            Many plants also love humidity! Mist them occasionally or place them on a pebble tray with water.
                        </p>
                    </CareItem>
                </div>
            </div>
        </div>
    );
};

export default Care;
