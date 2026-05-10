const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN || "";
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
const BASE_URL = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;

const isMock = !WHATSAPP_TOKEN || !PHONE_NUMBER_ID;

const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("91") && cleaned.length === 12) return cleaned;
  if (cleaned.length === 10) return `91${cleaned}`;
  return cleaned;
};

const sendTemplate = async (
  phone: string,
  templateName: string,
  parameters: { type: string; text: string }[]
): Promise<void> => {
  const formatted = formatPhone(phone);

  if (isMock) {
    console.log(
      `[WhatsApp MOCK] To: +${formatted} | Template: ${templateName} | Params:`,
      parameters.map((p) => p.text).join(", ")
    );
    return;
  }

  const body = {
    messaging_product: "whatsapp",
    to: formatted,
    type: "template",
    template: {
      name: templateName,
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: parameters.map((p) => ({ type: "text", text: p.text })),
        },
      ],
    },
  };

  try {
    const res = await fetch(BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error(`WhatsApp error [${templateName}]:`, res.status, text);
    }
  } catch (err) {
    console.error(`WhatsApp send failed [${templateName}]:`, err);
  }
};

export const WhatsAppService = {
  async sendCartReminder(phone: string, name: string, cartUrl: string): Promise<void> {
    await sendTemplate(phone, "cart_reminder", [
      { type: "text", text: name },
      { type: "text", text: cartUrl },
    ]);
  },

  async sendCheckoutPending(
    phone: string,
    name: string,
    amount: number,
    checkoutUrl: string
  ): Promise<void> {
    await sendTemplate(phone, "checkout_pending", [
      { type: "text", text: name },
      { type: "text", text: `₹${amount}` },
      { type: "text", text: checkoutUrl },
    ]);
  },

  async sendPaymentFailed(
    phone: string,
    name: string,
    amount: number,
    retryUrl: string
  ): Promise<void> {
    await sendTemplate(phone, "payment_failed", [
      { type: "text", text: name },
      { type: "text", text: `₹${amount}` },
      { type: "text", text: retryUrl },
    ]);
  },

  async sendOrderConfirmed(
    phone: string,
    name: string,
    orderId: string,
    amount: number
  ): Promise<void> {
    await sendTemplate(phone, "order_confirmed", [
      { type: "text", text: name },
      { type: "text", text: orderId },
      { type: "text", text: `₹${amount}` },
    ]);
  },

  async sendOrderShipped(
    phone: string,
    orderId: string,
    waybill: string,
    trackingUrl: string
  ): Promise<void> {
    await sendTemplate(phone, "order_shipped", [
      { type: "text", text: orderId },
      { type: "text", text: waybill },
      { type: "text", text: trackingUrl },
    ]);
  },

  async sendOrderDelivered(
    phone: string,
    name: string,
    orderId: string,
    reviewUrl: string
  ): Promise<void> {
    await sendTemplate(phone, "order_delivered", [
      { type: "text", text: name },
      { type: "text", text: orderId },
      { type: "text", text: reviewUrl },
    ]);
  },
};
