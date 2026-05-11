import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "Plantasy <orders@plantasy.co.in>";

const isMock = !RESEND_API_KEY;

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const BASE_URL = "https://plantasy.co.in";

const emailWrapper = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    body { margin: 0; padding: 0; background: #f5f5f0; font-family: 'Helvetica Neue', Arial, sans-serif; color: #2d2d2d; }
    .container { max-width: 580px; margin: 32px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: #3a5a40; padding: 28px 32px; text-align: center; }
    .header img { height: 36px; }
    .header h1 { color: #ffffff; margin: 8px 0 0; font-size: 20px; font-weight: 600; letter-spacing: 0.5px; }
    .body { padding: 32px; }
    .body p { font-size: 15px; line-height: 1.6; margin: 0 0 16px; color: #444; }
    .highlight { background: #f0f7f0; border-left: 4px solid #3a5a40; padding: 16px 20px; border-radius: 6px; margin: 20px 0; }
    .highlight p { margin: 4px 0; font-size: 14px; }
    .highlight .label { color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .highlight .value { color: #2d2d2d; font-weight: 600; font-size: 15px; }
    .btn { display: inline-block; background: #3a5a40; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-size: 15px; font-weight: 600; margin: 8px 0; }
    .footer { background: #f5f5f0; padding: 20px 32px; text-align: center; }
    .footer p { font-size: 12px; color: #999; margin: 4px 0; }
    .footer a { color: #3a5a40; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🌿 Plantasy</h1>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>Plantasy — Bringing nature closer to you</p>
      <p><a href="${BASE_URL}">plantasy.co.in</a> &nbsp;|&nbsp; <a href="mailto:official@plantasy.co.in">official@plantasy.co.in</a></p>
    </div>
  </div>
</body>
</html>`;

const send = async (to: string, subject: string, html: string): Promise<void> => {
  if (!to || !to.includes("@")) return;

  if (isMock || !resend) {
    console.log(`[Email MOCK] To: ${to} | Subject: ${subject}`);
    return;
  }

  try {
    const { error } = await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
    if (error) console.error("[Email] Resend error:", error);
  } catch (err) {
    console.error("[Email] Send failed:", err);
  }
};

export const EmailService = {
  async sendOrderConfirmed(email: string, name: string, orderId: string, amount: number): Promise<void> {
    const html = emailWrapper(`
      <p>Hi <strong>${name}</strong>,</p>
      <p>🎉 Your order has been placed successfully! We've received your payment and will start preparing your plants right away.</p>
      <div class="highlight">
        <p><span class="label">Order ID</span><br/><span class="value">${orderId}</span></p>
        <p><span class="label">Amount Paid</span><br/><span class="value">₹${amount}</span></p>
      </div>
      <p>You'll get another email once your order is packed and ready for pickup by the courier.</p>
      <p style="text-align:center;margin-top:24px;">
        <a class="btn" href="${BASE_URL}/orders">View My Orders</a>
      </p>
      <p>Thank you for shopping with Plantasy! 🌱</p>
    `);
    await send(email, `Order Confirmed — ${orderId}`, html);
  },

  async sendOrderPacked(email: string, name: string, orderId: string, waybill: string, trackingUrl: string): Promise<void> {
    const html = emailWrapper(`
      <p>Hi <strong>${name}</strong>,</p>
      <p>📦 Great news! Your order has been packed and handed over to <strong>Delhivery</strong> for pickup.</p>
      <div class="highlight">
        <p><span class="label">Order ID</span><br/><span class="value">${orderId}</span></p>
        <p><span class="label">Tracking / Waybill</span><br/><span class="value">${waybill}</span></p>
      </div>
      <p>Track your shipment in real time using the button below:</p>
      <p style="text-align:center;margin-top:24px;">
        <a class="btn" href="${trackingUrl}">Track My Order</a>
      </p>
      <p>Your plants are on their way! 🌿</p>
    `);
    await send(email, `Your Order Is Packed — ${orderId}`, html);
  },

  async sendOrderShipped(email: string, name: string, orderId: string, waybill: string, trackingUrl: string): Promise<void> {
    const html = emailWrapper(`
      <p>Hi <strong>${name}</strong>,</p>
      <p>🚚 Your order is out for delivery! Delhivery has picked up your package and it's on its way to you.</p>
      <div class="highlight">
        <p><span class="label">Order ID</span><br/><span class="value">${orderId}</span></p>
        <p><span class="label">Waybill</span><br/><span class="value">${waybill}</span></p>
      </div>
      <p style="text-align:center;margin-top:24px;">
        <a class="btn" href="${trackingUrl}">Track Live</a>
      </p>
      <p>Please ensure someone is available to receive the package. 🏠</p>
    `);
    await send(email, `Your Order Is On The Way — ${orderId}`, html);
  },

  async sendOrderDelivered(email: string, name: string, orderId: string, reviewUrl: string): Promise<void> {
    const html = emailWrapper(`
      <p>Hi <strong>${name}</strong>,</p>
      <p>✅ Your order <strong>${orderId}</strong> has been delivered! We hope your plants arrived safely and make your space greener.</p>
      <p>We'd love to hear your feedback — it helps us grow (just like your plants 🌱).</p>
      <p style="text-align:center;margin-top:24px;">
        <a class="btn" href="${reviewUrl}">Leave a Review</a>
      </p>
      <p>Thank you for choosing Plantasy! See you again soon. 🌿</p>
    `);
    await send(email, `Order Delivered — How Was It? 🌿`, html);
  },
};
