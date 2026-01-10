/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sprout,
  ShoppingBag,
  Check,
  Search,
  Info,
} from "lucide-react";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { toast } from "sonner";
import type { Product } from "../types/product";
import { useAuth } from "../context/AuthContext";
import { useCart} from "../context/CartContext";

/**
 * Assumed Product type shape:
 * id: string;
 * name: string;
 * price: number;
 * category?: string;
 * plantType?: string;
 * coverImage?: string;
 * image?: string;
 * description?: string;
 * policy?: any;
 * volumeL?: number; // optional: volume in liters for pots
 */

const steps = [
  { id: 1, title: "Select Plant", subtitle: "Choose your green companion" },
  { id: 2, title: "Select Pot", subtitle: "Find the perfect home" },
  { id: 3, title: "Composition", subtitle: "Pick the right soil medium" },
  { id: 4, title: "Add-ons", subtitle: "Decorate your plants" },
  { id: 5, title: "Review", subtitle: "Your custom creation" },
];

const PlantCustomizer = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const { user } = useAuth();
  const { addToCart } = useCart();

  // Data Selection State
  const [selectedPlant, setSelectedPlant] = useState<Product | null>(null);
  const [selectedPot, setSelectedPot] = useState<Product | null>(null);
  const [selectedComp, setSelectedComp] = useState<Product | null>(null);
  const [selectedCompQty, setSelectedCompQty] = useState<number>(1);
  const [selectedAddons, setSelectedAddons] = useState<Product[]>([]);

  // Data lists
  const [plants, setPlants] = useState<Product[]>([]);
  const [pots, setPots] = useState<Product[]>([]);
  const [compositions, setCompositions] = useState<Product[]>([]);
  const [addons, setAddons] = useState<Product[]>([]);

  const [loading, setLoading] = useState(false);

  // Separate search queries per step
  const [searchPlant, setSearchPlant] = useState("");
  const [searchPot, setSearchPot] = useState("");
  const [searchComp, setSearchComp] = useState("");
  const [searchAddon, setSearchAddon] = useState("");

  // Card “info” hover state: store product id currently showing description
  const [hoverInfoId, setHoverInfoId] = useState<string | null>(null);

  // Reset info when changing steps
  useEffect(() => {
    setHoverInfoId(null);
  }, [currentStep]);

  // Load data on first open
  useEffect(() => {
    if (
      isOpen &&
      plants.length === 0 &&
      pots.length === 0 &&
      compositions.length === 0 &&
      addons.length === 0
    ) {
      void fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const productsCol = collection(db, "products");

      // Plants & Seeds with plantType Soil-Base / Both
      const snapPlants = await getDocs(
        query(productsCol, where("category", "in", ["Plants", "Seeds"]))
      );
      const allPlantDocs = snapPlants.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
        policy: (d.data() as any).policy,
      })) as Product[];
      const filteredPlants = allPlantDocs.filter((p) => {
        const pt = (p.plantType || "").toLowerCase();
        return pt === "soil-base" || pt === "both";
      });
      setPlants(filteredPlants);

      // Pots
      const snapPots = await getDocs(
        query(productsCol, where("category", "==", "Pots"))
      );
      const potsData = snapPots.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
        policy: (d.data() as any).policy,
      })) as Product[];
      setPots(potsData);

      // Composition
      const snapComp = await getDocs(
        query(productsCol, where("category", "==", "Composition"))
      );
      const compData = snapComp.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
        policy: (d.data() as any).policy,
      })) as Product[];
      setCompositions(compData);

      // Add-ons
      const snapAddons = await getDocs(
        query(productsCol, where("category", "==", "Add-Ons"))
      );
      const addonData = snapAddons.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
        policy: (d.data() as any).policy,
      })) as Product[];
      setAddons(addonData);

      if (
        filteredPlants.length === 0 &&
        potsData.length === 0 &&
        compData.length === 0 &&
        addonData.length === 0
      ) {
        console.warn("No products found for customizer.");
      }
    } catch (error) {
      console.error("Error fetching customizer data:", error);
      toast.error("Failed to load customizer products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && !selectedPlant) {
      toast.error("Please select a plant");
      return;
    }
    if (currentStep === 2 && !selectedPot) {
      toast.error("Please select a pot");
      return;
    }
    if (currentStep === 3 && !selectedComp) {
      toast.error("Please select a composition");
      return;
    }
    // Step 4 (addons) is optional; no validation

    setCurrentStep((prev) => Math.min(prev + 1, 5));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const reset = () => {
    setIsOpen(false);
    setCurrentStep(1);
    setSelectedPlant(null);
    setSelectedPot(null);
    setSelectedComp(null);
    setSelectedCompQty(1);
    setSelectedAddons([]);
    setSearchPlant("");
    setSearchPot("");
    setSearchComp("");
    setSearchAddon("");
    setHoverInfoId(null);
  };

  const handleToggleAddon = (addon: Product) => {
    setSelectedAddons((prev) => {
      const exists = prev.find((a) => a.id === addon.id);
      if (exists) {
        return prev.filter((a) => a.id !== addon.id);
      }
      return [...prev, addon];
    });
  };

   const handleAddToCart = () => {
  if (!selectedPlant || !selectedPot || !selectedComp) {
    toast.error("Please complete all required selections.");
    return;
  }

  const type = "combo";
  console.log("Adding to cart with type:", type); // ✅ Debug

  addToCart(selectedPlant, 1, type);
  addToCart(selectedPot, 1, type);
  addToCart(selectedComp, selectedCompQty, type);
  
  selectedAddons.forEach((addon) => {
    addToCart(addon, 1, type);
  });

  toast.success("Custom plant bundle added to cart!");
  reset();
};




//   const handleAddToCart = async () => {
//     if (!selectedPlant || !selectedPot || !selectedComp) {
//       toast.error("Please complete all required selections.");
//       return;
//     }
//     if (!user?.uid) {
//       toast.error("Please log in to add items to cart.");
//       return;
//     }

//     try {
//       const ensureNumber = (val: unknown): number =>
//         typeof val === "number" && !Number.isNaN(val) ? val : 0;

//       const basePrice =
//         ensureNumber(selectedPlant.price) +
//         ensureNumber(selectedPot.price) +
//         ensureNumber(selectedComp.price) * selectedCompQty;

//       const addonsPrice = selectedAddons.reduce(
//         (sum, a) => sum + ensureNumber(a.price),
//         0
//       );

//       const total = basePrice + addonsPrice;

//       // For now treat the custom bundle as a single cart line:
//       // price: total, productId: combo id, quantity: 1, type: "combo"
//       const comboProductId = `COMBO-${selectedPlant.id}-${selectedPot.id}-${Date.now()}`;

//       const newCartItem = {
//         price: total,
//         productId: comboProductId,
//         quantity: 1,
//         type: "combo" as const,
//       };

//       const cartRef = doc(db, "cart", user.uid);
//       const cartSnap = await getDoc(cartRef);

//       if (!cartSnap.exists()) {
//         await setDoc(cartRef, {
//           uid: user.uid,
//           items: [newCartItem],
//           createdAt: serverTimestamp(),
//           updatedAt: serverTimestamp(),
//           lastSeen: serverTimestamp(),
//         });
//       } else {
//         const data = cartSnap.data() as any;
//         const prevItems: any[] = Array.isArray(data.items) ? data.items : [];

//         // Check if this combo already exists (by productId); if yes, increase quantity
//         const idx = prevItems.findIndex(
//           (it) => it.productId === comboProductId && it.type === "combo"
//         );

//         let updatedItems: any[];

//         if (idx === -1) {
//           updatedItems = [...prevItems, newCartItem];
//         } else {
//           updatedItems = [...prevItems];
//           const existing = updatedItems[idx];
//           const currentQty =
//             typeof existing.quantity === "number" ? existing.quantity : 0;
//           updatedItems[idx] = {
//             ...existing,
//             quantity: currentQty + 1,
//           };
//         }

//         await setDoc(
//           cartRef,
//           {
//             items: updatedItems,
//             updatedAt: serverTimestamp(),
//             lastSeen: serverTimestamp(),
//           },
//           { merge: true }
//         );
//       }

//       toast.success("Custom plant bundle added to cart!");
//       reset();
//     } catch (error) {
//       console.error("Error adding to cart:", error);
//       toast.error("Failed to add to cart. Please try again.");
//     }
//   };

  const totalPrice =
    (selectedPlant?.price || 0) +
    (selectedPot?.price || 0) +
    (selectedComp?.price || 0) * selectedCompQty +
    selectedAddons.reduce((sum, a) => sum + (a.price || 0), 0);

  const getImage = (p: Product | null) =>
    p?.coverImage || (p as any)?.image || "";

  const renderProductCard = (
    p: Product,
    isSelected: boolean,
    onSelect: () => void,
    shape: "vertical" | "square" = "vertical"
  ) => {
    const showDescription = hoverInfoId === p.id;
    const aspect =
      shape === "square" ? "aspect-square" : "aspect-[3/4]";

    return (
      <div
        key={p.id}
        onClick={onSelect}
        className={`cursor-pointer group relative ${aspect} rounded-lg overflow-hidden border-2 transition-all ${
          isSelected
            ? "border-[#c16e41]"
            : "border-transparent hover:border-white/30"
        }`}
      >
        <div className="absolute top-2 right-2 z-20">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setHoverInfoId((prev) => (prev === p.id ? null : p.id));
            }}
            className="bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
          >
            <Info size={14} />
          </button>
        </div>

        {!showDescription && (
          <>
            <img
              src={getImage(p)}
              alt={p.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
              <h3 className="text-white font-serif line-clamp-2">
                {p.name}
              </h3>
              <p className="text-gray-300 text-sm">
                ₹{p.price}
              </p>
            </div>
          </>
        )}

        {showDescription && (
          <div className="w-full h-full bg-black/90 text-white p-4 text-xs overflow-y-auto">
            <h3 className="text-sm font-semibold mb-2">
              {p.name}
            </h3>
            <p className="whitespace-pre-line">
              {p.description || "No description available."}
              
            </p>
            <p className="mt-4 text-xs italic text-gray-400">
                Volume:{p.volume || "Volume not available."}
            </p>
          </div>
        )}

        {isSelected && (
          <div className="absolute top-2 left-2 bg-[#c16e41] rounded-full p-1">
            <Check size={12} className="text-white" />
          </div>
        )}
      </div>
    );
  };

  // Rough helper to suggest composition quantity based on pot volume
  const getSuggestedCompQty = () => {
    const vol = (selectedPot as any)?.volumeL as number | undefined;
    if (!vol || Number.isNaN(vol)) return null;
    if (vol <= 1) return 1;
    if (vol <= 3) return 2;
    if (vol <= 5) return 3;
    return 4;
  };

  const suggestedQty = getSuggestedCompQty();

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
                  <h2 className="text-2xl font-serif text-white">
                    {steps[currentStep - 1].title}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {steps[currentStep - 1].subtitle}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((step) => (
                      <div
                        key={step}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          step === currentStep
                            ? "bg-[#c16e41]"
                            : step < currentStep
                            ? "bg-white"
                            : "bg-white/20"
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    onClick={reset}
                    className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {loading && (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    Loading options...
                  </div>
                )}

                {!loading && (
                  <>
                    {/* Search bar for steps 1–4 */}
                    {currentStep <= 4 && (
                      <div className="sticky top-0 z-20 bg-[#1a1a1a] pb-6">
                        <div className="relative">
                          <Search
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                            size={20}
                          />
                          <input
                            type="text"
                            placeholder={`Search ${
                              currentStep === 1
                                ? "plants"
                                : currentStep === 2
                                ? "pots"
                                : currentStep === 3
                                ? "compositions"
                                : "add-ons"
                            }...`}
                            value={
                              currentStep === 1
                                ? searchPlant
                                : currentStep === 2
                                ? searchPot
                                : currentStep === 3
                                ? searchComp
                                : searchAddon
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              if (currentStep === 1) setSearchPlant(val);
                              else if (currentStep === 2) setSearchPot(val);
                              else if (currentStep === 3) setSearchComp(val);
                              else setSearchAddon(val);
                            }}
                            className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-4 text-white focus:outline-none focus:border-[#c16e41] transition-colors"
                          />
                        </div>
                      </div>
                    )}

                    {/* Step 1: Plants */}
                    {currentStep === 1 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {plants.filter((p) =>
                          p.name
                            .toLowerCase()
                            .includes(searchPlant.toLowerCase())
                        ).length === 0 ? (
                          <div className="col-span-full text-center text-gray-500 py-10">
                            No plants found matching "{searchPlant}".
                          </div>
                        ) : (
                          plants
                            .filter((p) =>
                              p.name
                                .toLowerCase()
                                .includes(searchPlant.toLowerCase())
                            )
                            .map((p) =>
                              renderProductCard(
                                p,
                                selectedPlant?.id === p.id,
                                () => setSelectedPlant(p),
                                "vertical"
                              )
                            )
                        )}
                      </div>
                    )}

                    {/* Step 2: Pots */}
                    {currentStep === 2 && (
                      <div className="space-y-4">
                        {selectedPot && (
                          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-xs md:text-sm text-gray-300">
                            <div>
                              <p className="font-medium text-white">
                                Selected pot: {selectedPot.name}
                              </p>
                              {"volume" in selectedPot && (
                                <p>
                                  Approx. volume:{" "}
                                  {(selectedPot as any).volume} 
                                </p>
                              )}
                            </div>
                            {suggestedQty && (
                              <p className="text-[#c16e41]">
                                Suggested composition qty: {suggestedQty}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {pots.filter((p) =>
                            p.name
                              .toLowerCase()
                              .includes(searchPot.toLowerCase())
                          ).length === 0 ? (
                            <div className="col-span-full text-center text-gray-500 py-10">
                              No pots found matching "{searchPot}".
                            </div>
                          ) : (
                            pots
                              .filter((p) =>
                                p.name
                                  .toLowerCase()
                                  .includes(searchPot.toLowerCase())
                              )
                              .map((p) =>
                                renderProductCard(
                                  p,
                                  selectedPot?.id === p.id,
                                  () => setSelectedPot(p),
                                  "square"
                                )
                              )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Step 3: Composition */}
                    {currentStep === 3 && (
                      <div className="space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-xs md:text-sm text-gray-300">
                          <div>
                            {selectedPot ? (
                              <>
                                <p className="font-medium text-white">
                                  Pot: {selectedPot.name}
                                </p>
                                {"volume" in selectedPot && (
                                  <p>
                                    Approx. volume:{" "}
                                      {(selectedPot as any).volume} 
                                  </p>
                                )}
                                {suggestedQty && (
                                  <p className="mt-1">
                                    Recommended composition quantity:{" "}
                                    <span className="text-[#c16e41]">
                                      {suggestedQty}
                                    </span>
                                  </p>
                                )}
                              </>
                            ) : (
                              <p>
                                Select a pot first to see composition
                                recommendations.
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-gray-300">
                              Composition quantity:
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedCompQty((q) =>
                                  Math.max(1, q - 1)
                                )
                              }
                              className="px-2 py-1 border border-white/20 rounded text-white hover:bg-white/10"
                            >
                              -
                            </button>
                            <span className="min-w-[24px] text-center text-white">
                              {selectedCompQty}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setSelectedCompQty((q) =>
                                  Math.min(10, q + 1)
                                )
                              }
                              className="px-2 py-1 border border-white/20 rounded text-white hover:bg-white/10"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {compositions.filter((c) =>
                            c.name
                              .toLowerCase()
                              .includes(searchComp.toLowerCase())
                          ).length === 0 ? (
                            <div className="col-span-full text-center text-gray-500 py-10">
                              No compositions found matching "{searchComp}".
                            </div>
                          ) : (
                            compositions
                              .filter((c) =>
                                c.name
                                  .toLowerCase()
                                  .includes(searchComp.toLowerCase())
                              )
                              .map((c) =>
                                renderProductCard(
                                  c,
                                  selectedComp?.id === c.id,
                                  () => setSelectedComp(c),
                                  "vertical"
                                )
                              )
                          )}
                        </div>
                      </div>
                    )}

                    {/* Step 4: Add-ons (optional) */}
                    {currentStep === 4 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {addons.filter((a) =>
                          a.name
                            .toLowerCase()
                            .includes(searchAddon.toLowerCase())
                        ).length === 0 ? (
                          <div className="col-span-full text-center text-gray-500 py-10">
                            No add-ons found matching "{searchAddon}".
                          </div>
                        ) : (
                          addons
                            .filter((a) =>
                              a.name
                                .toLowerCase()
                                .includes(searchAddon.toLowerCase())
                            )
                            .map((a) =>
                              renderProductCard(
                                a,
                                !!selectedAddons.find(
                                  (sel) => sel.id === a.id
                                ),
                                () => handleToggleAddon(a),
                                "square"
                              )
                            )
                        )}
                      </div>
                    )}

                    {/* Step 5: Review */}
                    {currentStep === 5 && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 h-full">
                        <div className="space-y-6">
                          <h3 className="text-2xl font-serif text-white mb-6">
                            Your Creation Bundle
                          </h3>

                          {/* Items Summary */}
                          <div className="space-y-4">
                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-lg">
                              <img
                                src={getImage(selectedPlant)}
                                className="w-16 h-16 rounded object-cover"
                                alt="Plant"
                              />
                              <div className="flex-1">
                                <p className="text-sm text-gray-400">
                                  Plant
                                </p>
                                <p className="text-white font-medium">
                                  {selectedPlant?.name}
                                </p>
                              </div>
                              <p className="text-white">
                                ₹{selectedPlant?.price}
                              </p>
                            </div>

                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-lg">
                              <img
                                src={getImage(selectedPot)}
                                className="w-16 h-16 rounded object-cover"
                                alt="Pot"
                              />
                              <div className="flex-1">
                                <p className="text-sm text-gray-400">
                                  Pot
                                </p>
                                <p className="text-white font-medium">
                                  {selectedPot?.name}
                                </p>
                              </div>
                              <p className="text-white">
                                ₹{selectedPot?.price}
                              </p>
                            </div>

                            <div className="flex items-center gap-4 bg-white/5 p-4 rounded-lg">
                              <img
                                src={getImage(selectedComp)}
                                className="w-16 h-16 rounded object-cover"
                                alt="Soil"
                              />
                              <div className="flex-1">
                                <p className="text-sm text-gray-400">
                                  Composition
                                </p>
                                <p className="text-white font-medium">
                                  {selectedComp?.name}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  Quantity: {selectedCompQty}
                                </p>
                              </div>
                              <p className="text-white">
                                ₹
                                {(selectedComp?.price || 0) *
                                  selectedCompQty}
                              </p>
                            </div>

                            {selectedAddons.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm text-gray-400">
                                  Add-ons
                                </p>
                                {selectedAddons.map((a) => (
                                  <div
                                    key={a.id}
                                    className="flex items-center gap-4 bg-white/5 p-3 rounded-lg"
                                  >
                                    <img
                                      src={getImage(a)}
                                      className="w-12 h-12 rounded object-cover"
                                      alt={a.name}
                                    />
                                    <div className="flex-1">
                                      <p className="text-white text-sm">
                                        {a.name}
                                      </p>
                                    </div>
                                    <p className="text-white text-sm">
                                      ₹{a.price}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="border-t border-white/10 pt-6">
                            <div className="flex justify-between items-center text-xl font-serif text-white">
                              <span>Total Bundle Price</span>
                              <span className="text-[#c16e41]">
                                ₹{totalPrice}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white/5 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                          <div className="relative mb-8 w-full max-w-md aspect-square rounded-xl overflow-hidden shadow-2xl">
                            <img
                              src={getImage(selectedPlant)}
                              className="w-full h-full object-cover"
                              alt="Your Custom Plant"
                            />
                          </div>
                          <h3 className="text-3xl font-serif text-white mb-2">
                            Ready to Grow?
                          </h3>
                          <p className="text-gray-400 mb-8 max-w-sm">
                            Your custom plant kit comes with everything you need
                            to start your green journey.
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
                  className={`flex items-center gap-2 text-white hover:text-gray-300 transition-colors ${
                    currentStep === 1
                      ? "opacity-0 pointer-events-none"
                      : "opacity-100"
                  }`}
                >
                  <ChevronLeft size={20} />
                  Back
                </button>

                {currentStep < 5 && (
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
