/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Plus, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/firebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

type FirestoreCartItem = {
  productId: string;
  quantity: number;
  price: number;
};

type FirestoreCartDoc = {
  uid: string;
  items: FirestoreCartItem[];
  createdAt?: any;
  updatedAt?: any;
  lastSeen?: any;
};

const CartDrawer: React.FC = () => {
  const {
    cart,
    isCartOpen,
    toggleCart,
    removeFromCart,
    updateQuantity,
    cartTotal,
  } = useCart();

  const { user } = useAuth();
  const navigate = useNavigate();

  const uid = user?.uid || null;

  // Firestore doc ref for current user cart
  const cartDocRef = uid ? doc(db, "cart", uid) : null;

  // --- Helpers to sync with Firestore ---

  const ensureCartDoc = useCallback(
    async (): Promise<FirestoreCartDoc | null> => {
      if (!cartDocRef || !uid) return null;

      const snap = await getDoc(cartDocRef);
      if (!snap.exists()) {
        const newDoc: FirestoreCartDoc = {
          uid,
          items: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastSeen: serverTimestamp(),
        };
        await setDoc(cartDocRef, newDoc);
        return newDoc;
      }
      return snap.data() as FirestoreCartDoc;
    },
    [cartDocRef, uid]
  );

  const touchLastSeen = useCallback(
    async (alsoUpdateUpdatedAt: boolean = false) => {
      if (!cartDocRef || !uid) return;
      try {
        const payload: Partial<FirestoreCartDoc> = {
          lastSeen: serverTimestamp(),
        };
        if (alsoUpdateUpdatedAt) {
          payload.updatedAt = serverTimestamp();
        }
        await updateDoc(cartDocRef, payload);
      } catch (err) {
        console.error("Error updating lastSeen/updatedAt:", err);
      }
    },
    [cartDocRef, uid]
  );

  const syncItemsToFirestore = useCallback(
    async (items: typeof cart) => {
      if (!cartDocRef || !uid) return;

      const normalizedItems: FirestoreCartItem[] = items.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      try {
        await ensureCartDoc();
        await updateDoc(cartDocRef, {
          items: normalizedItems,
          updatedAt: serverTimestamp(),
          lastSeen: serverTimestamp(),
        });
      } catch (err) {
        console.error("Error syncing cart items to Firestore:", err);
      }
    },
    [cartDocRef, uid, ensureCartDoc]
  );

  // --- Behavior modifications ---

  // When drawer opens, require login; if logged in, update lastSeen
  useEffect(() => {
    if (!isCartOpen) return;

    if (!uid) {
      // Not logged in; close cart and redirect to login
      toggleCart();
      navigate("/login");
      return;
    }

    // Logged in: touch lastSeen
    void touchLastSeen(false);
  }, [isCartOpen, uid, toggleCart, navigate, touchLastSeen]);

  // Wrap quantity updates to sync backend
  const handleUpdateQuantity = async (id: string, newQty: number) => {
    if (!uid) {
      toggleCart();
      navigate("/login");
      return;
    }

    // update local context first
    updateQuantity(id, newQty);

    // then sync to Firestore
    const updatedItems = cart.map((item) =>
      item.id === id ? { ...item, quantity: newQty } : item
    );
    await syncItemsToFirestore(updatedItems);
  };

  const handleRemoveFromCart = async (id: string) => {
    if (!uid) {
      toggleCart();
      navigate("/login");
      return;
    }

    removeFromCart(id);

    const updatedItems = cart.filter((item) => item.id !== id);
    await syncItemsToFirestore(updatedItems);
  };

  const handleCheckoutClick = async () => {
    if (!uid) {
      toggleCart();
      navigate("/login");
      return;
    }

    await touchLastSeen(true);
    // navigate to checkout page if you have one
    navigate("/checkout");
    toggleCart();
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleCart}
            className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-sm bg-black/90 backdrop-blur-md shadow-2xl z-50 flex flex-col text-white"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="font-serif text-xl">Your Cart</h2>
              <button
                onClick={toggleCart}
                className="p-2 rounded-full hover:bg-white/10 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                  <p className="text-gray-400">Your cart is empty.</p>
                  <button
                    onClick={toggleCart}
                    className="text-accent hover:underline"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <img
                      src={item.coverImage ?? item.image}
                      alt={item.name}
                      className="w-20 h-20 object-cover rounded bg-white/5"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-white line-clamp-1">
                        {item.name}
                      </h3>
                      <p className="text-gray-400 text-sm mb-2">
                        ₹{item.price.toFixed(2)}
                      </p>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-white/20 rounded">
                          <button
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1}
                            className="p-1 hover:bg-white/10 disabled:opacity-40"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="w-8 text-center text-sm">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity + 1)
                            }
                            className="p-1 hover:bg-white/10"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          onClick={() => handleRemoveFromCart(item.id)}
                          className="text-gray-400 hover:text-red-500 transition ml-auto"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer / Checkout */}
            {cart.length > 0 && (
              <div className="p-6 border-t border-white/10 bg-black z-50 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-4 text-lg font-medium">
                  <span className="text-gray-200">Subtotal</span>
                  <span className="text-white">
                    ₹{cartTotal.toFixed(2)}
                  </span>
                </div>
                <button
                  onClick={handleCheckoutClick}
                  className="w-full bg-accent text-white py-3 font-semibold tracking-wide hover:bg-[#b05d35] transition duration-300"
                >
                  CHECKOUT
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
