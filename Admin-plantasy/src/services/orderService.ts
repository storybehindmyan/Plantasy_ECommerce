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
  type DocumentSnapshot,
} from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { Order } from '../types';

const COLLECTION_NAME = 'orders';
const ITEMS_PER_PAGE = 10;

// Helper: hydrate items with coverImage from products/
const hydrateOrderItemsWithCoverImage = async (items: any[]) => {
  if (!items || items.length === 0) return [];

  const productIds = Array.from(
    new Set(items.map((it) => it.productId).filter(Boolean))
  ) as string[];

  const productDocs = await Promise.all(
    productIds.map((id) => getDoc(doc(db, 'products', id)))
  );

  const productMap = new Map<string, any>();
  productDocs.forEach((snap, idx) => {
    if (snap.exists()) {
      productMap.set(productIds[idx], snap.data());
    }
  });

  return items.map((item) => {
    const prod = productMap.get(item.productId);
    const coverImage =
      item.coverImage ||
      prod?.coverImage ||
      prod?.image ||
      (Array.isArray(prod?.images) ? prod.images[0] : undefined) ||
      item.productImage ||
      '';
    return { ...item, coverImage };
  });
};

export const orderService = {
  // Get all orders with pagination
  async getOrders(
    pageSize: number = ITEMS_PER_PAGE,
    lastDoc?: DocumentSnapshot | null,
    statusFilter?: string
  ): Promise<{ orders: Order[]; lastDoc: DocumentSnapshot | null }> {
    try {
      let q;

      if (statusFilter) {
        // statusFilter is uppercase (e.g. "PENDING")
        q = query(
          collection(db, COLLECTION_NAME),
          where('orderStatus', '==', statusFilter),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, COLLECTION_NAME),
          orderBy('timestamps.orderedAt', 'desc'),
          limit(pageSize)
        );
      }

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);

      let orders: Order[] = await Promise.all(
        snapshot.docs.map(async (d) => {
          const data = d.data() as any;
          const hydratedItems = await hydrateOrderItemsWithCoverImage(
            data.items || []
          );

          return {
            id: d.id,
            userId: data.userId || '',
            orderId: data.orderId || d.id,
            orderStatus: data.orderStatus, // stored uppercase in Firestore
            orderType: data.orderType || 'standard',
            isCancelable: data.isCancelable ?? true,
            isReturnEligible: data.isReturnEligible ?? false,
            waybill: data.waybill || '',
            courier: data.courier || '',
            shipmentStatus: data.shipmentStatus || '',
            pickupScheduled: data.pickupScheduled ?? false,
            trackingUrl: data.trackingUrl || '',
            labelUrl: data.labelUrl || '',
            trackingEvents: Array.isArray(data.trackingEvents)
              ? data.trackingEvents
              : [],
            estimatedDelivery: data.estimatedDelivery || '',
            items: hydratedItems,
            deliveryAddress: data.deliveryAddress,
            payment: data.payment || {
              paymentId: '',
              paymentMethod: '',
              paymentStatus: data.payment?.paymentStatus || '',
              transactionRef: data.payment?.transactionRef || '',
            },
            pricing: data.pricing,
            timestamps: data.timestamps,
            track: data.track || '',
            createdAt: data.timestamps?.orderedAt?.toDate?.(),
            updatedAt: data.timestamps?.updatedAt?.toDate?.(),
          } as unknown as Order;
        })
      );

      // If filtered (no orderBy in query), sort by orderedAt desc on client
      if (statusFilter) {
        orders = orders.sort((a, b) => {
          const aTs = (a as any).timestamps?.orderedAt;
          const bTs = (b as any).timestamps?.orderedAt;

          const aTime = aTs
            ? aTs.seconds * 1000 + aTs.nanoseconds / 1_000_000
            : 0;
          const bTime = bTs
            ? bTs.seconds * 1000 + bTs.nanoseconds / 1_000_000
            : 0;

          return bTime - aTime;
        });
      }

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
        const data = docSnap.data() as any;
        const hydratedItems = await hydrateOrderItemsWithCoverImage(
          data.items || []
        );

        return {
          id: docSnap.id,
          userId: data.userId || '',
          orderId: data.orderId || docSnap.id,
          orderStatus: data.orderStatus,
          orderType: data.orderType || 'standard',
          isCancelable: data.isCancelable ?? true,
          isReturnEligible: data.isReturnEligible ?? false,
          waybill: data.waybill || '',
          courier: data.courier || '',
          shipmentStatus: data.shipmentStatus || '',
          pickupScheduled: data.pickupScheduled ?? false,
          trackingUrl: data.trackingUrl || '',
          labelUrl: data.labelUrl || '',
          trackingEvents: Array.isArray(data.trackingEvents)
            ? data.trackingEvents
            : [],
          estimatedDelivery: data.estimatedDelivery || '',
          items: hydratedItems,
          deliveryAddress: data.deliveryAddress,
          payment: data.payment || {
            paymentId: '',
            paymentMethod: '',
            paymentStatus: data.payment?.paymentStatus || '',
            transactionRef: data.payment?.transactionRef || '',
          },
          pricing: data.pricing,
          timestamps: data.timestamps,
          track: data.track || '',
          createdAt: data.timestamps?.orderedAt?.toDate?.(),
          updatedAt: data.timestamps?.updatedAt?.toDate?.(),
        } as unknown as Order;
      }
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
    return null;
  },

  // Update order status
  async updateOrderStatus(id: string, status: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        orderStatus: status, // expects uppercase (PENDING, SHIPPED, etc.)
        'timestamps.updatedAt': Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  // Optional: update/insert tracking URL
  async updateOrderTrack(id: string, track: string): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        track,
        'timestamps.updatedAt': Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating tracking URL:', error);
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

      const orders: Order[] = await Promise.all(
        snapshot.docs.map(async (d) => {
          const data = d.data() as any;
          const hydratedItems = await hydrateOrderItemsWithCoverImage(
            data.items || []
          );

          return {
            id: d.id,
            userId: data.userId || '',
            orderId: data.orderId || d.id,
            orderStatus: data.orderStatus,
            orderType: data.orderType || 'standard',
            isCancelable: data.isCancelable ?? true,
            isReturnEligible: data.isReturnEligible ?? false,
            items: hydratedItems,
            deliveryAddress: data.deliveryAddress,
            payment: data.payment || {
              paymentId: '',
              paymentMethod: '',
              paymentStatus: data.payment?.paymentStatus || '',
              transactionRef: data.payment?.transactionRef || '',
            },
            pricing: data.pricing,
            timestamps: data.timestamps,
            track: data.track || '',
            createdAt: data.timestamps?.orderedAt?.toDate?.(),
            updatedAt: data.timestamps?.updatedAt?.toDate?.(),
          } as unknown as Order;
        })
      );

      return orders;
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

  // Get pending orders count (uppercase status in Firestore)
  async getPendingOrdersCount(): Promise<number> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('orderStatus', '==', 'PENDING')
      );
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting pending orders count:', error);
      throw error;
    }
  },

  // Get total revenue (last 30 days)
  async getLast30DaysRevenue(): Promise<number> {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);

      const thirtyDaysAgoTimestamp = Timestamp.fromDate(thirtyDaysAgo);

      const q = query(
        collection(db, COLLECTION_NAME),
        where('payment.paymentStatus', '==', 'paid'),
        where('timestamps.orderedAt', '>=', thirtyDaysAgoTimestamp)
      );

      const snapshot = await getDocs(q);

      const total = snapshot.docs.reduce((sum, d) => {
        const data = d.data() as any;
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

  async downloadInvoice(orderId: string): Promise<void> {
    try {
      const order = await this.getOrder(orderId);
      if (!order) throw new Error('Order not found');

      const { generateInvoicePdf } = await import('../../../src/utils/invoicePdf');

      await generateInvoicePdf({
        orderId: order.orderId || order.id,
        invoiceId: (order as any).invoiceId || '',
        userId: order.userId || '',
        orderStatus: order.orderStatus ?? null,
        timestamps: (order as any).timestamps || null,
        deliveryAddress: {
          firstName: order.deliveryAddress.firstName || '',
          lastName: order.deliveryAddress.lastName || '',
          addressLine1: order.deliveryAddress.addressLine1 || '',
          addressLine2: order.deliveryAddress.addressLine2 || '',
          city: order.deliveryAddress.city || '',
          region: order.deliveryAddress.region || '',
          zip: order.deliveryAddress.zip || '',
          country: order.deliveryAddress.country || '',
          phone: order.deliveryAddress.phone || '',
        },
        items: order.items.map((it) => ({
          productName: it.productName || '',
          quantity: it.quantity || 1,
          price: it.price || 0,
        })),
        payment: {
          paymentMethod: order.payment.paymentMethod || '',
          paymentStatus: order.payment.paymentStatus || '',
          transactionRef: order.payment.transactionRef || '',
        },
        pricing: {
          subTotal: order.pricing.subTotal || 0,
          tax: order.pricing.tax || 0,
          shippingCharge: order.pricing.shippingCharge || 0,
          discount: order.pricing.discount || 0,
          couponCode: order.pricing.couponCode || '',
          grandTotal: order.pricing.grandTotal || 0,
        },
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      throw error;
    }
  },
};
