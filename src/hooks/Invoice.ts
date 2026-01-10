/* eslint-disable @typescript-eslint/no-explicit-any */
import { jsPDF } from 'jspdf';
import { db } from '../firebase/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

// Types are minimal and local to this file to keep it decoupled from admin types
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
  userId: string;
  deliveryAddress: OrderAddress;
  items: OrderItem[];
  payment: OrderPayment;
  pricing: OrderPricing;
  orderStatus?: string | null;
};

export const Invoice = {
  // Fetch a single order (user side) and download an invoice PDF
  async download(orderId: string): Promise<void> {
    // Read the order directly from "orders" collection
    const ref = doc(db, 'orders', orderId);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      throw new Error('Order not found');
    }

    const data = snap.data() as any;

    const order: OrderDocForInvoice = {
      id: snap.id,
      orderId: data.orderId || snap.id,
      userId: data.userId || '',
      deliveryAddress: data.deliveryAddress,
      items: data.items || [],
      payment: data.payment || {
        paymentId: '',
        paymentMethod: '',
        paymentStatus: data.payment?.paymentStatus || '',
        transactionRef: data.payment?.transactionRef || '',
      },
      pricing: data.pricing,
      orderStatus: data.orderStatus ?? null,
    };

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
      order.pricing?.discount > 0
        ? `<tr>
             <td colspan="3" style="text-align:right;">Discount (${order.pricing.couponCode || ''})</td>
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
        Status: ${order.orderStatus || 'N/A'}<br/>
        Payment: ${order.payment.paymentStatus}
      </div>
    </div>

    <div class="section">
      <h3>Billing Information</h3>
      <div class="muted">
        ${order.deliveryAddress.firstName} ${order.deliveryAddress.lastName}<br/>
        ${order.deliveryAddress.addressLine1}<br/>
        ${
          order.deliveryAddress.addressLine2
            ? order.deliveryAddress.addressLine2 + '<br/>'
            : ''
        }
        ${order.deliveryAddress.city}, ${order.deliveryAddress.region} ${
      order.deliveryAddress.zip
    }<br/>
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

    // Open a print window (optional, like admin side)
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (printWindow) {
      printWindow.document.write(invoiceHtml);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }

    // Generate and save PDF
    const pdf = new jsPDF('p', 'pt', 'a4');
    await pdf.html(invoiceHtml, {
      x: 20,
      y: 20,
      callback: (docPdf) => {
        docPdf.save(`invoice-${order.orderId || order.id}.pdf`);
      },
      autoPaging: 'text',
    });
  },
};
