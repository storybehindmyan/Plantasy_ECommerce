/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import type { Product } from "../types/product";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  db
} from "../firebase/firebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

interface CartItem extends Product {
  coverImage: string;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  isCartOpen: boolean;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  toggleCart: () => void;
  cartTotal: number;
  itemsCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem("cart");
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);

  // Persist to localStorage for UX (optional backup)
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Helper: ensure cart doc exists in Firestore for current user
  const ensureCartDoc = async () => {
    if (!user?.uid) return;
    const cartRef = doc(db, "cart", user.uid);
    const snap = await getDoc(cartRef);
    if (!snap.exists()) {
      await setDoc(cartRef, {
        uid: user.uid,
        items: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
      });
    }
  };

  // Helper: sync current local cart to Firestore
  const syncCartToFirestore = async (nextCart: CartItem[]) => {
    if (!user?.uid) return;
    const cartRef = doc(db, "cart", user.uid);

    const items = nextCart.map((item) => ({
      productId: item.id,
      quantity: item.quantity,
      price: item.price,
    }));

    await ensureCartDoc();
    await updateDoc(cartRef, {
      items,
      updatedAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
    });
  };

  const addToCart = async (product: Product, quantity: number = 1) => {
    // 1) Require login
    if (!user?.uid) {
      navigate("/login");
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      let next: CartItem[];
      if (existing) {
        next = prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        next = [
          ...prev,
          {
            ...product,
            quantity,
            coverImage: (product as any).coverImage || product.image || "",
          },
        ];
      }
      // fire-and-forget sync (no await inside setState)
      void syncCartToFirestore(next);
      return next;
    });

    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    if (!user?.uid) {
      navigate("/login");
      return;
    }

    setCart((prev) => {
      const next = prev.filter((item) => item.id !== id);
      void syncCartToFirestore(next);
      return next;
    });
  };

  const updateQuantity = (id: string, qty: number) => {
    if (!user?.uid) {
      navigate("/login");
      return;
    }

    if (qty < 1) {
      removeFromCart(id);
      return;
    }

    setCart((prev) => {
      const next = prev.map((item) =>
        item.id === id ? { ...item, quantity: qty } : item
      );
      void syncCartToFirestore(next);
      return next;
    });
  };

  const toggleCart = () => setIsCartOpen((prev) => !prev);

  const cartTotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const itemsCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        isCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        toggleCart,
        cartTotal,
        itemsCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context)
    throw new Error("useCart must be used within a CartProvider");
  return context;
};
