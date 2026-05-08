/* eslint-disable @typescript-eslint/no-explicit-any */
import { jsPDF } from 'jspdf';

// ── Brand colors (matches frontend theme) ────────────────────────────────────
const TERRACOTTA: [number, number, number] = [193, 110, 65];   // #c16e41
const FOLIAGE: [number, number, number]    = [74,  93,  78];   // #4a5d4e
const CANVAS_BG: [number, number, number]  = [232, 230, 225];  // #e8e6e1
const FOLIAGE_LIGHT: [number, number, number] = [240, 245, 238];
const BORDER: [number, number, number]     = [210, 205, 195];
const DARK: [number, number, number]       = [30,  30,  30];
const MUTED: [number, number, number]      = [100, 100, 100];
const WHITE: [number, number, number]      = [255, 255, 255];

export type InvoiceData = {
  orderId: string;
  invoiceId?: string;
  userId?: string;
  orderStatus?: string | null;
  timestamps?: any;
  deliveryAddress: {
    firstName: string;
    lastName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    region: string;
    zip: string;
    country: string;
    phone: string;
  };
  items: {
    productName: string;
    quantity: number;
    price: number;
  }[];
  payment: {
    paymentMethod: string;
    paymentStatus: string;
    transactionRef: string;
  };
  pricing: {
    subTotal: number;
    tax: number;
    shippingCharge: number;
    discount?: number;
    couponCode?: string;
    grandTotal: number;
  };
};

async function loadLogoBase64(): Promise<string | null> {
  try {
    const res = await fetch('/clogo.png');
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function fmt(n: number) {
  return `Rs. ${Number(n || 0).toFixed(2)}`;
}

function hRule(pdf: jsPDF, x: number, y: number, w: number, color = BORDER) {
  pdf.setDrawColor(...color);
  pdf.setLineWidth(0.4);
  pdf.line(x, y, x + w, y);
}

function sectionTitle(pdf: jsPDF, text: string, x: number, y: number) {
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(...FOLIAGE);
  pdf.text(text.toUpperCase(), x, y);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...DARK);
}

export async function generateInvoicePdf(data: InvoiceData): Promise<void> {
  const logoBase64 = await loadLogoBase64();

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const W = pdf.internal.pageSize.getWidth();
  const H = pdf.internal.pageSize.getHeight();
  const ML = 42;
  const MR = 42;
  const CW = W - ML - MR;

  let y = 0;

  // ── Header band ─────────────────────────────────────────────────────────────
  pdf.setFillColor(...TERRACOTTA);
  pdf.rect(0, 0, W, 68, 'F');

  // Logo
  if (logoBase64) {
    pdf.addImage(logoBase64, 'PNG', ML, 8, 42, 52);
  }

  // Brand subtitle
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(...WHITE);
  pdf.text('Plantasy', ML + (logoBase64 ? 50 : 0), 32);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(255, 225, 200);
  pdf.text('Your Green World', ML + (logoBase64 ? 50 : 0), 44);
  pdf.text('support@plantasy.co.in', ML + (logoBase64 ? 50 : 0), 56);

  // INVOICE label
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(28);
  pdf.setTextColor(255, 255, 255);
  pdf.text('INVOICE', W - MR, 44, { align: 'right' });

  y = 82;

  // ── Order meta band ──────────────────────────────────────────────────────────
  pdf.setFillColor(...CANVAS_BG);
  pdf.roundedRect(ML, y, CW, 54, 4, 4, 'F');

  const orderDate = data.timestamps?.orderedAt?.seconds
    ? new Date(data.timestamps.orderedAt.seconds * 1000).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const metaCols = [ML + 12, ML + CW * 0.28, ML + CW * 0.55, ML + CW * 0.78];
  const metaLabels = ['ORDER ID', 'INVOICE NO', 'STATUS', 'DATE'];
  const metaValues = [
    data.orderId,
    data.invoiceId || '-',
    data.orderStatus || 'N/A',
    orderDate,
  ];

  metaCols.forEach((cx, i) => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(...MUTED);
    pdf.text(metaLabels[i], cx, y + 16);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(...DARK);
    pdf.text(metaValues[i], cx, y + 32, { maxWidth: CW * 0.25 });
  });

  y += 66;

  // ── Two-column: Billing + Payment ────────────────────────────────────────────
  const halfW = (CW - 12) / 2;
  const boxH = 118;

  // Billing box
  pdf.setFillColor(...FOLIAGE_LIGHT);
  pdf.setDrawColor(...BORDER);
  pdf.setLineWidth(0.6);
  pdf.roundedRect(ML, y, halfW, boxH, 4, 4, 'FD');
  sectionTitle(pdf, 'Bill To', ML + 12, y + 16);

  const addr = data.deliveryAddress;
  const billingLines = [
    `${addr.firstName || ''} ${addr.lastName || ''}`.trim(),
    addr.addressLine1 || '',
    addr.addressLine2 || '',
    `${addr.city || ''}, ${addr.region || ''} ${addr.zip || ''}`.trim(),
    addr.country || '',
    addr.phone ? `Phone: ${addr.phone}` : '',
  ].filter(Boolean);

  let by = y + 30;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...DARK);
  for (const line of billingLines) {
    pdf.text(line, ML + 12, by, { maxWidth: halfW - 20 });
    by += 13;
  }

  // Payment box (right column — NO black background)
  const pX = ML + halfW + 12;
  pdf.setFillColor(...FOLIAGE_LIGHT);
  pdf.roundedRect(pX, y, halfW, boxH, 4, 4, 'FD');
  sectionTitle(pdf, 'Payment Details', pX + 12, y + 16);

  const payRows: [string, string][] = [
    ['Method', data.payment.paymentMethod || '-'],
    ['Status', data.payment.paymentStatus || '-'],
    ['Transaction Ref', data.payment.transactionRef || '-'],
  ];

  let py = y + 30;
  for (const [label, val] of payRows) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...MUTED);
    pdf.text(label, pX + 12, py);
    py += 11;
    pdf.setFont('helvetica', label === 'Status' ? 'bold' : 'normal');
    pdf.setFontSize(9);
    if (label === 'Status') {
      pdf.setTextColor(
        val === 'PAID' ? 34 : 180,
        val === 'PAID' ? 120 : 50,
        val === 'PAID' ? 34 : 50,
      );
    } else {
      pdf.setTextColor(...DARK);
    }
    pdf.text(val, pX + 12, py, { maxWidth: halfW - 20 });
    py += 18;
  }

  y += boxH + 16;

  // ── Items table ──────────────────────────────────────────────────────────────
  sectionTitle(pdf, 'Order Items', ML, y);
  y += 12;

  // Table header (foliage)
  pdf.setFillColor(...FOLIAGE);
  pdf.roundedRect(ML, y, CW, 22, 3, 3, 'F');

  const tC1 = ML + 10;
  const tC2 = ML + CW * 0.55;
  const tC3 = ML + CW * 0.70;
  const tC4 = ML + CW - 10;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(...WHITE);
  pdf.text('Product', tC1, y + 14);
  pdf.text('Qty', tC2, y + 14);
  pdf.text('Unit Price', tC3, y + 14);
  pdf.text('Total', tC4, y + 14, { align: 'right' });
  y += 22;

  const rowH = 24;
  data.items.forEach((item, i) => {
    if (i % 2 === 0) {
      pdf.setFillColor(250, 252, 249);
      pdf.rect(ML, y, CW, rowH, 'F');
    }
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...DARK);
    pdf.text(item.productName || '-', tC1, y + 15, { maxWidth: CW * 0.5 });
    pdf.text(String(item.quantity), tC2, y + 15);
    pdf.text(fmt(item.price), tC3, y + 15);
    pdf.setFont('helvetica', 'bold');
    pdf.text(fmt(item.price * item.quantity), tC4, y + 15, { align: 'right' });
    hRule(pdf, ML, y + rowH, CW);
    y += rowH;
  });

  y += 16;

  // ── Pricing summary ──────────────────────────────────────────────────────────
  const sumX = ML + CW * 0.52;
  const sumW = CW * 0.48;

  sectionTitle(pdf, 'Pricing Summary', sumX, y);
  y += 12;

  const priceRows: [string, string][] = [
    ['Subtotal', fmt(data.pricing.subTotal)],
    ['Tax', fmt(data.pricing.tax)],
    ['Shipping', fmt(data.pricing.shippingCharge)],
  ];
  if ((data.pricing.discount || 0) > 0) {
    priceRows.push([
      `Discount${data.pricing.couponCode ? ' (' + data.pricing.couponCode + ')' : ''}`,
      `-${fmt(data.pricing.discount || 0)}`,
    ]);
  }

  const rowCount = priceRows.length;
  pdf.setFillColor(...FOLIAGE_LIGHT);
  pdf.setDrawColor(...BORDER);
  pdf.setLineWidth(0.5);
  pdf.roundedRect(sumX, y, sumW, rowCount * 20 + 6, 4, 4, 'FD');

  let ry = y + 14;
  for (const [label, val] of priceRows) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...MUTED);
    pdf.text(label, sumX + 10, ry);
    pdf.setTextColor(...DARK);
    pdf.text(val, sumX + sumW - 10, ry, { align: 'right' });
    ry += 20;
  }

  // Grand total row (terracotta)
  const gtY = ry - 2;
  pdf.setFillColor(...TERRACOTTA);
  pdf.roundedRect(sumX, gtY, sumW, 26, 4, 4, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...WHITE);
  pdf.text('Grand Total', sumX + 10, gtY + 17);
  pdf.text(fmt(data.pricing.grandTotal), sumX + sumW - 10, gtY + 17, { align: 'right' });

  // ── Footer band ──────────────────────────────────────────────────────────────
  pdf.setFillColor(...FOLIAGE);
  pdf.rect(0, H - 34, W, 34, 'F');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(200, 230, 205);
  pdf.text('Thank you for shopping with Plantasy!', W / 2, H - 19, { align: 'center' });
  pdf.setFontSize(7);
  pdf.setTextColor(150, 200, 160);
  pdf.text('support@plantasy.co.in  |  www.plantasy.co.in', W / 2, H - 8, { align: 'center' });

  pdf.save(`invoice-${data.orderId}.pdf`);
}
