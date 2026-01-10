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
import { jsPDF } from 'jspdf';

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

  // Download invoice: open browser print first, then download as PDF
  async downloadInvoice(orderId: string): Promise<void> {
    try {
      const order = await this.getOrder(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      const lineItemsHtml = order.items
        .map(
          (item) => `
            <tr>
              <td>${item.productName}</td>
              <td style="text-align:center;">${item.quantity}</td>
              <td style="text-align:right;">₹${item.price.toFixed(2)}</td>
              <td style="text-align:right;">₹${(item.price * item.quantity).toFixed(
                2
              )}</td>
            </tr>
          `
        )
        .join('');

      const discountRow =
        order.pricing.discount > 0
          ? `<tr>
               <td colspan="3" style="text-align:right;">Discount (${order.pricing.couponCode})</td>
               <td style="text-align:right;">-₹${order.pricing.discount.toFixed(2)}</td>
             </tr>`
          : '';

      const invoiceHtml = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Invoice - ${order.orderId || order.id}</title>
    <style>
      body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        padding: 24px;
        color: #111827;
      }
      h1, h2, h3 {
        margin: 0 0 8px;
      }
      .section {
        margin-bottom: 16px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 8px;
      }
      th, td {
        padding: 6px 8px;
        border: 1px solid #e5e7eb;
        font-size: 13px;
      }
      th {
        background: #f3f4f6;
        text-align: left;
      }
      .totals td {
        font-weight: 600;
      }
      .muted {
        color: #6b7280;
        font-size: 13px;
      }
      .header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 16px;
      }
      .title {
        font-size: 20px;
        font-weight: 700;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <div>
        <div class="title">INVOICE</div>
        <div class="muted">Order ID: ${order.orderId || order.id}</div>
      </div>
      <div class="muted">
        Status: ${order.orderStatus}<br/>
        Payment: ${order.payment.paymentStatus}
      </div>
    </div>

    <div class="section">
      <h3>Billing Information</h3>
      <div class="muted">
        ${order.deliveryAddress.firstName} ${order.deliveryAddress.lastName}<br/>
        ${order.deliveryAddress.addressLine1}<br/>
        ${order.deliveryAddress.addressLine2 ? order.deliveryAddress.addressLine2 + '<br/>' : ''}
        ${order.deliveryAddress.city}, ${order.deliveryAddress.region} ${order.deliveryAddress.zip}<br/>
        ${order.deliveryAddress.country}<br/>
        Phone: ${order.deliveryAddress.phone}<br/>
        User ID: ${order.userId}
      </div>
    </div>

    <div class="section">
      <h3>Order Details</h3>
      <table>
        <thead>
          <tr>
            <th style="width:50%;">Product</th>
            <th style="width:10%; text-align:center;">Qty</th>
            <th style="width:20%; text-align:right;">Price</th>
            <th style="width:20%; text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${lineItemsHtml}
        </tbody>
      </table>
    </div>

    <div class="section">
      <h3>Pricing Summary</h3>
      <table>
        <tbody>
          <tr>
            <td colspan="3" style="text-align:right;">Subtotal</td>
            <td style="text-align:right;">₹${order.pricing.subTotal.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" style="text-align:right;">Tax</td>
            <td style="text-align:right;">₹${order.pricing.tax.toFixed(2)}</td>
          </tr>
          <tr>
            <td colspan="3" style="text-align:right;">Shipping</td>
            <td style="text-align:right;">₹${order.pricing.shippingCharge.toFixed(2)}</td>
          </tr>
          ${discountRow}
          <tr class="totals">
            <td colspan="3" style="text-align:right;">Grand Total</td>
            <td style="text-align:right;">₹${order.pricing.grandTotal.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="section">
      <h3>Payment Information</h3>
      <div class="muted">
        Method: ${order.payment.paymentMethod}<br/>
        Status: ${order.payment.paymentStatus}<br/>
        Transaction Ref: ${order.payment.transactionRef}
      </div>
    </div>
  </body>
</html>
      `;

      const printWindow = window.open('', '_blank', 'width=800,height=900');
      if (printWindow) {
        printWindow.document.write(invoiceHtml);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }

      const docPdf = new jsPDF('p', 'pt', 'a4');
      await docPdf.html(invoiceHtml, {
        x: 20,
        y: 20,
        callback: (pdf) => {
          pdf.save(`invoice-${order.orderId || order.id}.pdf`);
        },
        autoPaging: 'text',
      });
    } catch (error) {
      console.error('Error downloading invoice:', error);
      throw error;
    }
  },
};
