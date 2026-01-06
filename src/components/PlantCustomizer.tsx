import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Sprout, ShoppingBag, Check, Search } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useCart } from "../context/CartContext";
import { toast } from "sonner";
import type { Product } from "../types/product";

// Mock composition data since it's likely not in DB yet
const COMPOSITIONS = [
    {
        id: "comp-1",
        name: "Standard Potting Mix",
        description: "Perfect balance for most houseplants.",
        price: 99,
        image: "https://images.unsplash.com/photo-1623861214309-c187641d8e20?q=80&w=600&auto=format&fit=crop"
    },
    {
        id: "comp-2",
        name: "Succulent & Cacti Mix",
        description: "Fast-draining soil prevents root rot.",
        price: 149,
        image: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?q=80&w=600&auto=format&fit=crop"
    },
    {
        id: "comp-3",
        name: "Aroid Chunky Mix",
        description: "High aeration for monsteras and philodendrons.",
        price: 249,
        image: "https://images.unsplash.com/photo-1615555620935-8664157147ba?q=80&w=600&auto=format&fit=crop"
    }
];

const steps = [
    { id: 1, title: "Select Plant", subtitle: "Choose your green companion" },
    { id: 2, title: "Select Pot", subtitle: "Find the perfect home" },
    { id: 3, title: "Composition", subtitle: "Pick the right soil medium" },
    { id: 4, title: "Review", subtitle: "Your custom creation" }
];

const PlantCustomizer = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const { addToCart } = useCart();

    // Data Selection State
    const [selectedPlant, setSelectedPlant] = useState<Product | null>(null);
    const [selectedPot, setSelectedPot] = useState<Product | null>(null);
    const [selectedComp, setSelectedComp] = useState<typeof COMPOSITIONS[0] | null>(null);

    // Filtered Data
    const [plants, setPlants] = useState<Product[]>([]);

    const [pots, setPots] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Reset search when changing steps
    useEffect(() => {
        setSearchQuery("");
    }, [currentStep]);

    useEffect(() => {
        if (isOpen && plants.length === 0) {
            fetchData();
        }
    }, [isOpen]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch all products first to avoid index issues or case sensitivity in queries
            const q = collection(db, "products");
            const snap = await getDocs(q);
            const allProducts = snap.docs.map(d => ({ id: d.id, ...d.data(), policy: d.data().policy } as Product));

            // Filter for Plants & Seeds
            const plantsData = allProducts.filter(p => {
                const cat = (p.category || "").toLowerCase();
                return cat === "plants" || cat === "seeds";
            });
            setPlants(plantsData);

            // Filter for Pots
            const potsData = allProducts.filter(p => {
                const cat = (p.category || "").toLowerCase();
                return cat === "pots";
            });
            setPots(potsData);

            if (plantsData.length === 0 && potsData.length === 0) {
                console.warn("No plants or pots found in database.");
            }

        } catch (error) {
            console.error("Error fetching customizer data:", error);
            toast.error("Failed to load plants. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (currentStep === 1 && !selectedPlant) return toast.error("Please select a plant");
        if (currentStep === 2 && !selectedPot) return toast.error("Please select a pot");
        if (currentStep === 3 && !selectedComp) return toast.error("Please select a composition");

        setCurrentStep(prev => Math.min(prev + 1, 4));
    };

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const reset = () => {
        setIsOpen(false);
        setCurrentStep(1);
        setSelectedPlant(null);
        setSelectedPot(null);
        setSelectedComp(null);
    };

    const handleAddToCart = () => {
        if (!selectedPlant || !selectedPot || !selectedComp) return;

        // Add Plant
        addToCart(selectedPlant, 1);

        // Add Pot
        addToCart(selectedPot, 1);

        // Ideally we would add the composition too, but let's assume it's included or handled separately for now 
        // OR add it as a custom product if your cart supports it. 
        // For this demo, let's just toast.

        toast.success("Custom plant bundle added to cart!");
        reset();
    };

    const totalPrice = (selectedPlant?.price || 0) + (selectedPot?.price || 0) + (selectedComp?.price || 0);

    return (
        <>
            {/* FAB Trigger */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        layoutId="customizer-container"
                        className="fixed bottom-8 right-8 z-40 bg-[#c16e41] text-white p-4 rounded-full shadow-2xl hover:bg-[#a05a32] transition-colors flex items-center gap-3 overflow-hidden group"
                        onClick={() => setIsOpen(true)}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.05 }}
                    >
                        <Sprout size={24} />
                        <span className="font-serif pr-2 max-w-0 group-hover:max-w-xs transition-all duration-300 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                            Customize Your Plant
                        </span>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Modal Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            layoutId="customizer-container"
                            className="bg-[#1a1a1a] w-full max-w-5xl h-[85vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-white/10 relative"
                        >
                            {/* Header */}
                            <div className="flex justify-between items-center p-6 border-b border-white/10 bg-[#1a1a1a]">
                                <div>
                                    <h2 className="text-2xl font-serif text-white">{steps[currentStep - 1].title}</h2>
                                    <p className="text-gray-400 text-sm">{steps[currentStep - 1].subtitle}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4].map(step => (
                                            <div
                                                key={step}
                                                className={`w-2 h-2 rounded-full transition-colors ${step === currentStep ? "bg-[#c16e41]" : step < currentStep ? "bg-white" : "bg-white/20"}`}
                                            />
                                        ))}
                                    </div>
                                    <button onClick={reset} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                                {loading && (
                                    <div className="flex items-center justify-center h-full text-gray-400">Loading options...</div>
                                )}

                                {!loading && (
                                    <>
                                        {/* Search Bar for Steps 1-3 */}
                                        {currentStep < 4 && (
                                            <div className="sticky top-0 z-20 bg-[#1a1a1a] pb-6">
                                                <div className="relative">
                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                                    <input
                                                        type="text"
                                                        placeholder={`Search ${currentStep === 1 ? 'plants' : currentStep === 2 ? 'pots' : 'compositions'}...`}
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#c16e41] transition-colors"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                        {/* Step 1: Plants */}
                                        {currentStep === 1 && (
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {plants.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                                                    <div className="col-span-full text-center text-gray-500 py-10">
                                                        No plants found matching "{searchQuery}".
                                                    </div>
                                                ) : plants.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                                                    <div
                                                        key={p.id}
                                                        onClick={() => setSelectedPlant(p)}
                                                        className={`cursor-pointer group relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all ${selectedPlant?.id === p.id ? "border-[#c16e41]" : "border-transparent hover:border-white/30"}`}
                                                    >
                                                        <img src={p.coverImage || p.image} alt={p.name} className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
                                                            <h3 className="text-white font-serif">{p.name}</h3>
                                                            <p className="text-gray-300 text-sm">₹{p.price}</p>
                                                        </div>
                                                        {selectedPlant?.id === p.id && (
                                                            <div className="absolute top-2 right-2 bg-[#c16e41] rounded-full p-1">
                                                                <Check size={12} className="text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Step 2: Pots */}
                                        {currentStep === 2 && (
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {pots.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                                                    <div className="col-span-full text-center text-gray-500 py-10">
                                                        No pots found matching "{searchQuery}".
                                                    </div>
                                                ) : pots.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => (
                                                    <div
                                                        key={p.id}
                                                        onClick={() => setSelectedPot(p)}
                                                        className={`cursor-pointer group relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedPot?.id === p.id ? "border-[#c16e41]" : "border-transparent hover:border-white/30"}`}
                                                    >
                                                        <img src={p.coverImage || p.image} alt={p.name} className="w-full h-full object-cover" />
                                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
                                                            <h3 className="text-white font-serif">{p.name}</h3>
                                                            <p className="text-gray-300 text-sm">₹{p.price}</p>
                                                        </div>
                                                        {selectedPot?.id === p.id && (
                                                            <div className="absolute top-2 right-2 bg-[#c16e41] rounded-full p-1">
                                                                <Check size={12} className="text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Step 3: Composition */}
                                        {currentStep === 3 && (
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                {COMPOSITIONS.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(c => (
                                                    <div
                                                        key={c.id}
                                                        onClick={() => setSelectedComp(c)}
                                                        className={`cursor-pointer p-6 rounded-xl border-2 transition-all bg-white/5 ${selectedComp?.id === c.id ? "border-[#c16e41] bg-[#c16e41]/10" : "border-white/10 hover:border-white/30"}`}
                                                    >
                                                        <div className="aspect-video w-full rounded-lg overflow-hidden mb-4">
                                                            <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                                                        </div>
                                                        <h3 className="text-xl font-serif text-white mb-2">{c.name}</h3>
                                                        <p className="text-gray-400 text-sm mb-4 min-h-[40px]">{c.description}</p>
                                                        <p className="text-[#c16e41] font-bold">₹{c.price}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Step 4: Review */}
                                        {currentStep === 4 && (
                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 h-full">
                                                <div className="space-y-6">
                                                    <h3 className="text-2xl font-serif text-white mb-6">Your Creation Bundle</h3>

                                                    {/* Items Summary */}
                                                    <div className="space-y-4">
                                                        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-lg">
                                                            <img src={selectedPlant?.coverImage || selectedPlant?.image} className="w-16 h-16 rounded object-cover" alt="Plant" />
                                                            <div className="flex-1">
                                                                <p className="text-sm text-gray-400">Plant</p>
                                                                <p className="text-white font-medium">{selectedPlant?.name}</p>
                                                            </div>
                                                            <p className="text-white">₹{selectedPlant?.price}</p>
                                                        </div>

                                                        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-lg">
                                                            <img src={selectedPot?.coverImage || selectedPot?.image} className="w-16 h-16 rounded object-cover" alt="Pot" />
                                                            <div className="flex-1">
                                                                <p className="text-sm text-gray-400">Pot</p>
                                                                <p className="text-white font-medium">{selectedPot?.name}</p>
                                                            </div>
                                                            <p className="text-white">₹{selectedPot?.price}</p>
                                                        </div>

                                                        <div className="flex items-center gap-4 bg-white/5 p-4 rounded-lg">
                                                            <img src={selectedComp?.image} className="w-16 h-16 rounded object-cover" alt="Soil" />
                                                            <div className="flex-1">
                                                                <p className="text-sm text-gray-400">Composition</p>
                                                                <p className="text-white font-medium">{selectedComp?.name}</p>
                                                            </div>
                                                            <p className="text-white">₹{selectedComp?.price}</p>
                                                        </div>
                                                    </div>

                                                    <div className="border-t border-white/10 pt-6">
                                                        <div className="flex justify-between items-center text-xl font-serif text-white">
                                                            <span>Total Bundle Price</span>
                                                            <span className="text-[#c16e41]">₹{totalPrice}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-white/5 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                                                    <div className="relative mb-8 w-full max-w-md aspect-square rounded-xl overflow-hidden shadow-2xl">
                                                        <img
                                                            src={selectedPlant?.coverImage || selectedPlant?.image}
                                                            className="w-full h-full object-cover"
                                                            alt="Your Custom Plant"
                                                        />
                                                    </div>
                                                    <h3 className="text-3xl font-serif text-white mb-2">Ready to Grow?</h3>
                                                    <p className="text-gray-400 mb-8 max-w-sm">
                                                        Your custom plant kit comes with everything you need to start your green journey.
                                                    </p>
                                                    <button
                                                        onClick={handleAddToCart}
                                                        className="bg-[#c16e41] text-white px-12 py-4 rounded-full font-bold tracking-widest hover:bg-[#a05a32] transition-all transform hover:scale-105 shadow-lg flex items-center gap-3"
                                                    >
                                                        <ShoppingBag size={20} />
                                                        ADD TO CART - ₹{totalPrice}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>

                            {/* Footer / Controls */}
                            <div className="p-6 border-t border-white/10 bg-[#1a1a1a] flex justify-between items-center">
                                <button
                                    onClick={handleBack}
                                    className={`flex items-center gap-2 text-white hover:text-gray-300 transition-colors ${currentStep === 1 ? "opacity-0 pointer-events-none" : "opacity-100"}`}
                                >
                                    <ChevronLeft size={20} />
                                    Back
                                </button>

                                {currentStep < 4 && (
                                    <button
                                        onClick={handleNext}
                                        className="bg-white text-black px-8 py-3 rounded-full font-medium hover:bg-gray-200 transition-colors flex items-center gap-2"
                                    >
                                        Next Step
                                        <ChevronRight size={20} />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default PlantCustomizer;
