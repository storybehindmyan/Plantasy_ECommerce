import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  Timestamp,
  DocumentSnapshot
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase/firebaseConfig';
import { Product } from '../types';

const COLLECTION_NAME = 'products';
const ITEMS_PER_PAGE = 10;

export const productService = {
  // Get all products with pagination
  async getProducts(
    pageSize: number = ITEMS_PER_PAGE,
    lastDoc?: DocumentSnapshot | null,
    categoryFilter?: string
  ): Promise<{ products: Product[]; lastDoc: DocumentSnapshot | null }> {
    try {
      let q = query(
        collection(db, COLLECTION_NAME),
        orderBy('createdAt', 'desc'),
        limit(pageSize)
      );

      if (categoryFilter) {
        q = query(q, where('category', '==', categoryFilter));
      }

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const products: Product[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Product[];

      const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

      return { products, lastDoc: lastVisible };
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  },

  // Get single product
  async getProduct(id: string): Promise<Product | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate(),
          updatedAt: docSnap.data().updatedAt?.toDate(),
        } as Product;
      }
      return null;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  },

  // Create product
  async createProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...product,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  // Update product
  async updateProduct(id: string, updates: Partial<Product>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  // Delete product
  async deleteProduct(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  // Upload image
  async uploadImage(file: File, productId: string): Promise<string> {
    try {
      const fileName = `${Date.now()}_${file.name}`;
      const storageRef = ref(storage, `products/${productId}/${fileName}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  // Delete image
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      const storageRef = ref(storage, imageUrl);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  },

  // Get products count
  async getProductsCount(): Promise<number> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      return snapshot.size;
    } catch (error) {
      console.error('Error getting products count:', error);
      throw error;
    }
  },

  // Get low stock products
  async getLowStockProducts(threshold: number = 10): Promise<Product[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('stockQuantity', '<=', threshold),
        where('isActive', '==', true)
      );
      // console.log('Low stock products fetched:', q);
      const snapshot = await getDocs(q);
      // console.log('Low stock products fetched:', snapshot);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as Product[];
    } catch (error) {
      console.error('Error fetching low stock products:', error);
      throw error;
    }
  },
};
