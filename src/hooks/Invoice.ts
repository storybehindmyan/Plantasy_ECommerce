/* eslint-disable @typescript-eslint/no-explicit-any */
import { jsPDF } from 'jspdf';
import { db } from '../firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

type OrderAddress = {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  firstName: string;
  lastName: string;
  phone: string;
  region: string;
  zip: string;
};

type OrderItem = {
  price: number;
  productId: string;
  productImage?: string;
  productName: string;
  quantity: number;
  totalPrice?: number;
};

type OrderPayment = {
  paymentId: string;
  paymentMethod: string;
  paymentStatus: string;
  transactionRef: string;
};

type OrderPricing = {
  couponCode?: string;
  discount: number;
  grandTotal: number;
  shippingCharge: number;
  subTotal: number;
  tax: number;
};

type OrderDocForInvoice = {
  id: string;
  orderId: string;
  invoiceId?: string;
  userId: string;
  deliveryAddress: OrderAddress;
  items: OrderItem[];
  payment: OrderPayment;
  pricing: OrderPricing;
  orderStatus?: string | null;
  timestamps?: any;
};

const BRAND_COLOR: [number, number, number] = [104, 140, 86];
const DARK: [number, number, number] = [30, 30, 30];
const MUTED: [number, number, number] = [100, 100, 100];
const LIGHT_BG: [number, number, number] = [248, 250, 246];
const BORDER: [number, number, number] = [220, 228, 214];

function fmt(amount: number) {
  return `Rs. ${Number(amount || 0).toFixed(2)}`;
}

function drawHRule(pdf: jsPDF, x: number, y: number, width: number, color: [number, number, number] = BORDER) {
  pdf.setDrawColor(...color);
  pdf.setLineWidth(0.5);
  pdf.line(x, y, x + width, y);
}

function sectionLabel(pdf: jsPDF, text: string, x: number, y: number) {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(...BRAND_COLOR);
  pdf.text(text.toUpperCase(), x, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...DARK);
}

export const Invoice = {
  async download(orderId: string): Promise<void> {
    const ref = doc(db, 'orders', orderId);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error('Order not found');

    const data = snap.data() as any;

    const order: OrderDocForInvoice = {
      id: snap.id,
      orderId: data.orderId || snap.id,
      invoiceId: data.invoiceId || '',
      userId: data.uid || data.userId || '',
      deliveryAddress: data.deliveryAddress || {},
      items: data.items || [],
      payment: data.payment || { paymentId: '', paymentMethod: '', paymentStatus: '', transactionRef: '' },
      pricing: data.pricing || { subTotal: 0, tax: 0, discount: 0, shippingCharge: 0, grandTotal: 0 },
      orderStatus: data.orderStatus ?? null,
      timestamps: data.timestamps || null,
    };

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const marginL = 40;
    const marginR = 40;
    const contentW = pageW - marginL - marginR;

    let y = 0;

    // ── Header band ──────────────────────────────────────────────────────────
    pdf.setFillColor(...BRAND_COLOR);
    pdf.rect(0, 0, pageW, 70, 'F');

    // Brand name
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(22);
    pdf.setTextColor(255, 255, 255);
    pdf.text('Plantasy', marginL, 38);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(220, 240, 215);
    pdf.text('Your Green World', marginL, 52);

    // "INVOICE" label on right
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(26);
    pdf.setTextColor(255, 255, 255);
    pdf.text('INVOICE', pageW - marginR, 42, { align: 'right' });

    y = 85;

    // ── Order meta row ────────────────────────────────────────────────────────
    pdf.setFillColor(...LIGHT_BG);
    pdf.roundedRect(marginL, y, contentW, 52, 4, 4, 'F');

    const col1 = marginL + 14;
    const col2 = marginL + contentW * 0.33;
    const col3 = marginL + contentW * 0.66;

    pdf.setFontSize(7.5);
    pdf.setTextColor(...MUTED);
    pdf.setFont('helvetica', 'normal');
    pdf.text('ORDER ID', col1, y + 14);
    pdf.text('INVOICE NO', col2, y + 14);
    pdf.text('STATUS', col3, y + 14);

    pdf.setFontSize(9.5);
    pdf.setTextColor(...DARK);
    pdf.setFont('helvetica', 'bold');
    pdf.text(order.orderId || order.id, col1, y + 30);
    pdf.text(order.invoiceId || '-', col2, y + 30);
    pdf.text(order.orderStatus || 'N/A', col3, y + 30);

    // Date
    const orderDate = order.timestamps?.orderedAt?.seconds
      ? new Date(order.timestamps.orderedAt.seconds * 1000).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'long', year: 'numeric',
        })
      : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...MUTED);
    pdf.text('DATE', col1, y + 46);
    pdf.setFontSize(9);
    pdf.setTextColor(...DARK);
    pdf.text(orderDate, col1, y + 56);

    y += 72;

    // ── Two-column: Billing + Payment ─────────────────────────────────────────
    const halfW = (contentW - 14) / 2;

    // Billing box
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(...BORDER);
    pdf.setLineWidth(0.8);
    pdf.roundedRect(marginL, y, halfW, 110, 4, 4, 'FD');

    sectionLabel(pdf, 'Bill To', marginL + 12, y + 16);
    const addr = order.deliveryAddress;
    const billingLines = [
      `${addr.firstName || ''} ${addr.lastName || ''}`.trim(),
      addr.addressLine1 || '',
      addr.addressLine2 || '',
      `${addr.city || ''}, ${addr.region || ''} ${addr.zip || ''}`.trim(),
      addr.country || '',
      addr.phone ? `Phone: ${addr.phone}` : '',
    ].filter(Boolean);

    pdf.setFontSize(9);
    pdf.setTextColor(...DARK);
    let by = y + 28;
    for (const line of billingLines) {
      pdf.text(line, marginL + 12, by);
      by += 13;
    }

    // Payment box
    const pCol = marginL + halfW + 14;
    pdf.roundedRect(pCol, y, halfW, 110, 4, 4, 'FD');

    sectionLabel(pdf, 'Payment', pCol + 12, y + 16);

    pdf.setFontSize(8.5);
    pdf.setTextColor(...MUTED);
    pdf.text('Method', pCol + 12, y + 34);
    pdf.setTextColor(...DARK);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text(order.payment.paymentMethod || '-', pCol + 12, y + 46);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(...MUTED);
    pdf.text('Status', pCol + 12, y + 62);
    pdf.setTextColor(
      order.payment.paymentStatus === 'PAID' ? 34 : 180,
      order.payment.paymentStatus === 'PAID' ? 139 : 60,
      order.payment.paymentStatus === 'PAID' ? 34 : 60,
    );
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.text(order.payment.paymentStatus || '-', pCol + 12, y + 74);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(...MUTED);
    pdf.text('Transaction Ref', pCol + 12, y + 90);
    pdf.setTextColor(...DARK);
    pdf.setFontSize(8);
    // Wrap long transaction ref
    const txRef = order.payment.transactionRef || '-';
    pdf.text(txRef, pCol + 12, y + 102, { maxWidth: halfW - 24 });

    y += 124;

    // ── Items table ───────────────────────────────────────────────────────────
    sectionLabel(pdf, 'Order Items', marginL, y + 4);
    y += 16;

    // Table header
    pdf.setFillColor(...BRAND_COLOR);
    pdf.roundedRect(marginL, y, contentW, 22, 3, 3, 'F');

    const c1 = marginL + 10;
    const c2 = marginL + contentW * 0.52;
    const c3 = marginL + contentW * 0.68;
    const c4 = marginL + contentW - 10;

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text('Product', c1, y + 14);
    pdf.text('Qty', c2, y + 14);
    pdf.text('Unit Price', c3, y + 14);
    pdf.text('Total', c4, y + 14, { align: 'right' });

    y += 22;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);

    order.items.forEach((item, i) => {
      const rowH = 24;
      if (i % 2 === 0) {
        pdf.setFillColor(252, 253, 251);
        pdf.rect(marginL, y, contentW, rowH, 'F');
      }
      pdf.setTextColor(...DARK);
      pdf.text(item.productName || '-', c1, y + 15, { maxWidth: contentW * 0.48 });
      pdf.text(String(item.quantity), c2, y + 15);
      pdf.text(fmt(item.price), c3, y + 15);
      pdf.setFont('helvetica', 'bold');
      pdf.text(fmt(item.price * item.quantity), c4, y + 15, { align: 'right' });
      pdf.setFont('helvetica', 'normal');

      drawHRule(pdf, marginL, y + rowH, contentW);
      y += rowH;
    });

    y += 14;

    // ── Pricing summary ───────────────────────────────────────────────────────
    const summaryX = marginL + contentW * 0.55;
    const summaryW = contentW * 0.45;

    sectionLabel(pdf, 'Pricing Summary', summaryX, y);
    y += 12;

    const priceRows: [string, string, boolean][] = [
      ['Subtotal', fmt(order.pricing.subTotal), false],
      ['Tax', fmt(order.pricing.tax), false],
      ['Shipping', fmt(order.pricing.shippingCharge), false],
    ];
    if ((order.pricing.discount || 0) > 0) {
      priceRows.push([`Discount (${order.pricing.couponCode || ''})`, `-${fmt(order.pricing.discount)}`, false]);
    }

    pdf.setDrawColor(...BORDER);
    pdf.setLineWidth(0.5);
    pdf.roundedRect(summaryX, y, summaryW, priceRows.length * 20 + 30, 4, 4, 'D');

    let ry = y + 14;
    for (const [label, val] of priceRows) {
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(...MUTED);
      pdf.text(label, summaryX + 10, ry);
      pdf.setTextColor(...DARK);
      pdf.text(val, summaryX + summaryW - 10, ry, { align: 'right' });
      ry += 20;
    }

    // Grand total row
    pdf.setFillColor(...BRAND_COLOR);
    pdf.roundedRect(summaryX, ry - 4, summaryW, 24, 0, 0, 'F');
    pdf.roundedRect(summaryX, ry - 4, summaryW, 24, 4, 4, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    pdf.text('Grand Total', summaryX + 10, ry + 11);
    pdf.text(fmt(order.pricing.grandTotal), summaryX + summaryW - 10, ry + 11, { align: 'right' });

    y = ry + 40;

    // ── Footer ────────────────────────────────────────────────────────────────
    pdf.setFillColor(...BRAND_COLOR);
    pdf.rect(0, pageH - 36, pageW, 36, 'F');
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(220, 240, 215);
    pdf.text('Thank you for shopping with Plantasy!', pageW / 2, pageH - 20, { align: 'center' });
    pdf.setTextColor(180, 220, 170);
    pdf.setFontSize(7.5);
    pdf.text('For support, contact us at support@plantasy.co.in', pageW / 2, pageH - 9, { align: 'center' });

    pdf.save(`invoice-${order.orderId || order.id}.pdf`);
  },
};
