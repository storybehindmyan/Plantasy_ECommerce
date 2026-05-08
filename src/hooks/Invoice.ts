/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from '../firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { generateInvoicePdf } from '../utils/invoicePdf';

export const Invoice = {
  async download(orderId: string): Promise<void> {
    const ref = doc(db, 'orders', orderId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Order not found');

    const data = snap.data() as any;

    await generateInvoicePdf({
      orderId: data.orderId || snap.id,
      invoiceId: data.invoiceId || '',
      userId: data.uid || data.userId || '',
      orderStatus: data.orderStatus ?? null,
      timestamps: data.timestamps || null,
      deliveryAddress: data.deliveryAddress || {},
      items: (data.items || []).map((it: any) => ({
        productName: it.productName || '',
        quantity: it.quantity || 1,
        price: it.price || 0,
      })),
      payment: {
        paymentMethod: data.payment?.paymentMethod || '',
        paymentStatus: data.payment?.paymentStatus || '',
        transactionRef: data.payment?.transactionRef || '',
      },
      pricing: {
        subTotal: data.pricing?.subTotal || 0,
        tax: data.pricing?.tax || 0,
        shippingCharge: data.pricing?.shippingCharge || 0,
        discount: data.pricing?.discount || 0,
        couponCode: data.pricing?.couponCode || '',
        grandTotal: data.pricing?.grandTotal || 0,
      },
    });
  },
};
