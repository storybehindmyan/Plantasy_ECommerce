/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import type { Product } from "../types/product";
import type { Timestamp } from "firebase/firestore";

export type FirestoreProduct = Product & {
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  isNewArrival?: boolean;
  isOnSale?: boolean;
};

export const useFirestoreProducts = () => {
  const [products, setProducts] = useState<FirestoreProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        const snap = await getDocs(collection(db, "products"));
        const now = new Date();
        const tenDaysMs = 10 * 24 * 60 * 60 * 1000;

        const items: FirestoreProduct[] = snap.docs.map((docSnap) => {
          const data = docSnap.data() as any;

          const updatedAt: Timestamp | undefined = data.updatedAt;
          const hasDiscount = typeof data.discountPrice === "number";

          let isNewArrival = false;
          if (updatedAt && updatedAt.toDate) {
            const updatedDate = updatedAt.toDate() as Date;
            const diffMs = now.getTime() - updatedDate.getTime();
            isNewArrival = diffMs <= tenDaysMs && diffMs >= 0;
          }

          return {
            id: docSnap.id,
            category: data.category,
            coverImage: data.coverImage,
            hoverImage: data.hoverImage,
            images: data.images ?? [],
            name: data.name,
            description: data.description,
            price: data.price,
            discountPrice: data.discountPrice,
            stock: data.stock,
            isActive: data.isActive,
            badge: data.badge, // optional manual badge
            createdAt: data.createdAt,
            updatedAt,
            isNewArrival,
            isOnSale: hasDiscount,
          };
        });

        setProducts(items);
      } catch (err) {
        console.error("Error fetching products:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return { products, loading };
};

export default useFirestoreProducts;