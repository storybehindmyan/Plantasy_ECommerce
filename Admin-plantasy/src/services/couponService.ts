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
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Coupon } from '../types';

const COLLECTION_NAME = 'coupons';

export const couponService = {
  // Get all coupons
  async getCoupons(): Promise<Coupon[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        expiryDate: doc.data().expiryDate?.toDate(),
        createdAt: doc.data().createdAt?.toDate(),
      })) as Coupon[];
    } catch (error) {
      console.error('Error fetching coupons:', error);
      throw error;
    }
  },

  // Get single coupon
  async getCoupon(id: string): Promise<Coupon | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          expiryDate: docSnap.data().expiryDate?.toDate(),
          createdAt: docSnap.data().createdAt?.toDate(),
        } as Coupon;
      }
      return null;
    } catch (error) {
      console.error('Error fetching coupon:', error);
      throw error;
    }
  },

  // Create coupon
  async createCoupon(coupon: Omit<Coupon, 'id' | 'createdAt' | 'usedCount'>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...coupon,
        expiryDate: Timestamp.fromDate(coupon.expiryDate),
        usedCount: 0,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating coupon:', error);
      throw error;
    }
  },

  // Update coupon
  async updateCoupon(id: string, updates: Partial<Coupon>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const updateData: Record<string, unknown> = { ...updates };
      
      if (updates.expiryDate) {
        updateData.expiryDate = Timestamp.fromDate(updates.expiryDate);
      }
      
      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating coupon:', error);
      throw error;
    }
  },

  // Delete coupon
  async deleteCoupon(id: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting coupon:', error);
      throw error;
    }
  },

  // Get active coupons count
  async getActiveCouponsCount(): Promise<number> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('isActive', '==', true),
        where('expiryDate', '>', Timestamp.now())
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting active coupons count:', error);
      throw error;
    }
  },

  // Validate coupon code
  async validateCouponCode(code: string): Promise<Coupon | null> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('code', '==', code.toUpperCase()),
        where('isActive', '==', true),
        limit(1)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) return null;
      
      const couponDoc = snapshot.docs[0];
      const coupon = {
        id: couponDoc.id,
        ...couponDoc.data(),
        expiryDate: couponDoc.data().expiryDate?.toDate(),
        createdAt: couponDoc.data().createdAt?.toDate(),
      } as Coupon;
      
      // Check if expired
      if (coupon.expiryDate < new Date()) return null;
      
      // Check usage limit
      if (coupon.usedCount >= coupon.usageLimit) return null;
      
      return coupon;
    } catch (error) {
      console.error('Error validating coupon:', error);
      throw error;
    }
  },
};
