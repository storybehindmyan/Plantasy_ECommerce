/* eslint-disable @typescript-eslint/no-explicit-any */
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  updateDoc,
  query,
  orderBy,
  limit,
  startAfter,
  where,
  Timestamp,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Order, OrderStatus } from '../types';

const COLLECTION_NAME = 'orders';
const ITEMS_PER_PAGE = 10;

export const orderService = {
  // Get all orders with pagination
  async getOrders(
    pageSize: number = ITEMS_PER_PAGE,
    lastDoc?: DocumentSnapshot | null,
    statusFilter?: OrderStatus
  ): Promise<{ orders: Order[]; lastDoc: DocumentSnapshot | null }> {
    try {
      let q = query(
        collection(db, COLLECTION_NAME),
        orderBy('timestamps.orderedAt', 'desc'),
        limit(pageSize)
      );

      if (statusFilter) {
        q = query(q, where('orderStatus', '==', statusFilter));
      }

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const orders: Order[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().timestamps.orderedAt?.toDate(),
        updatedAt: doc.data().timestamps.updatedAt?.toDate(),
      })) as Order[];
      

      const lastVisible = snapshot.docs[snapshot.docs.length - 1] || null;

      return { orders, lastDoc: lastVisible };
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  // Get single order
  async getOrder(id: string): Promise<Order | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().timestamps.orderedAt?.toDate(),
          updatedAt: docSnap.data().timestamps.updatedAt?.toDate(),
        } as Order;
      }
      return null;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  },

  // Update order status
  async updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        orderStatus: status,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  // Get recent orders
  async getRecentOrders(count: number = 5): Promise<Order[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('timestamps.orderedAt', 'desc'),
        limit(count)
      );
      const snapshot = await getDocs(q);
      // console.log('Recent orders fetched:', snapshot.docs);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().timestamps.orderedAt?.toDate(),
        updatedAt: doc.data().timestamps.updatedAt?.toDate(),
      })) as Order[];
      
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      throw error;
    }
  },

  // Get orders count
  async getOrdersCount(): Promise<number> {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION_NAME));
      return snapshot.size;
    } catch (error) {
      console.error('Error getting orders count:', error);
      throw error;
    }
  },

  // Get pending orders count
  async getPendingOrdersCount(): Promise<number> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('orderStatus', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting pending orders count:', error);
      throw error;
    }
  },

  // Get total revenue
  async getLast30DaysRevenue(): Promise<number> {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);

      const thirtyDaysAgoTimestamp = Timestamp.fromDate(thirtyDaysAgo);

      const q = query(
        collection(db, COLLECTION_NAME),
        where('payment.paymentStatus', '==', 'paid'),
        where('createdAt', '>=', thirtyDaysAgoTimestamp)
      );

      const snapshot = await getDocs(q);

      const total = snapshot.docs.reduce((sum, doc) => {
        const data = doc.data() as any;
        const grandTotal =
          data.pricing?.grandTotal &&
          typeof data.pricing.grandTotal === 'number'
            ? data.pricing.grandTotal
            : 0;
        return sum + grandTotal;
      }, 0);

      return total;
    } catch (error) {
      console.error('Error calculating last 30 days revenue:', error);
      throw error;
    }
  },
};
