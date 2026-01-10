/* eslint-disable @typescript-eslint/no-unused-vars */
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
import { db } from "../firebase/firebaseConfig";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

interface CartItem extends Product {
  type: string;
  coverImage: string;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  isCartOpen: boolean;
  addToCart: (
    product: Product,
    quantity?: number,
    itemType?: string
  ) => Promise<void>;
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
      type: item.type && item.type.trim() ? item.type : "regular", // ✅ Ensure type is not empty
    }));

    await ensureCartDoc();
    await updateDoc(cartRef, {
      items,
      updatedAt: serverTimestamp(),
      lastSeen: serverTimestamp(),
    });
  };

  // Load cart from Firestore and hydrate product data (coverImage, name, etc.)
  useEffect(() => {
    const loadCartFromFirestore = async () => {
      if (!user?.uid) {
        return;
      }

      const cartRef = doc(db, "cart", user.uid);
      const snap = await getDoc(cartRef);

      if (!snap.exists()) {
        await ensureCartDoc();
        return;
      }

      const data = snap.data() as any;
      const rawItems: any[] = data.items || [];

      // For each cart line, fetch product doc from products/{productId}
      const hydratedItems: CartItem[] = [];

      for (const line of rawItems) {
        const productId: string = line.productId;
        const quantity: number = line.quantity ?? 1;
        const priceFromCart: number = line.price ?? 0;
        const itemType: string =
          line.type && line.type.trim() ? line.type : "regular"; // ✅ Ensure type is not empty

        try {
          const productRef = doc(db, "products", productId);
          const productSnap = await getDoc(productRef);

          if (!productSnap.exists()) {
            // Product deleted or missing; keep minimal info
            hydratedItems.push({
              id: productId,
              name: "",
              price: priceFromCart,
              quantity,
              type: itemType,
              coverImage: "",
            } as CartItem);
            continue;
          }

          const productData = productSnap.data() as any;

          const coverImageFromProduct: string =
            productData.coverImage ||
            productData.image ||
            (productData.images && productData.images[0]) ||
            "";

          const cartItem: CartItem = {
            ...(productData as Product),
            id: productId,
            quantity,
            coverImage: coverImageFromProduct,
            price: typeof productData.price === "number"
              ? productData.price
              : priceFromCart,
            type: itemType, // ✅ Explicitly set after spread
          };

          hydratedItems.push(cartItem);
        } catch (err) {
          console.error("Error hydrating product for cart:", err);
          hydratedItems.push({
            id: productId,
            name: "",
            price: priceFromCart,
            quantity,
            type: itemType,
            coverImage: "",
          } as CartItem);
        }
      }

      setCart(hydratedItems);
      localStorage.setItem("cart", JSON.stringify(hydratedItems));
    };

    void loadCartFromFirestore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid]);

  const addToCart = async (
    product: Product,
    quantity: number = 1,
    itemType: string = "regular"
  ) => {
    // 1) Require login
    if (!user?.uid) {
      navigate("/login");
      return;
    }

    // Ensure itemType is not empty
    const finalType =
      itemType && itemType.trim() ? itemType.trim() : "regular";

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      let next: CartItem[];

      if (existing) {
        // Update quantity for existing item
        next = prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Add new item
        const newItem: CartItem = {
          id: product.id,
          name: product.name || "",
          price: product.price || 0,
          quantity,
          type: finalType, // ✅ Use finalType here
          coverImage:
            (product as any).coverImage ||
            (product as any).hoverImage ||
            (product as any).image ||
            "",
        } as CartItem;

        // Merge with other product properties
        next = [
          ...prev,
          {
            ...(product as any),
            ...newItem, // This ensures our id, name, price, quantity, type, coverImage override product properties
          } as CartItem,
        ];
      }

      // fire-and-forget sync
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
