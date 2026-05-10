import { useEffect, useRef } from "react";
import type { CartItem } from "../context/CartContext";

const REMINDER_DELAY_MS = 30 * 60 * 1000; // 30 minutes
const STORAGE_KEY = "cart_reminder_sent";

interface UseCartReminderParams {
  cartItems: CartItem[];
  phone?: string;
  name?: string;
}

export const useCartReminder = ({ cartItems, phone, name }: UseCartReminderParams) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const sendReminder = async () => {
    if (!phone || cartItems.length === 0) return;

    const lastSent = localStorage.getItem(STORAGE_KEY);
    const now = Date.now();

    if (lastSent && now - Number(lastSent) < 60 * 60 * 1000) return;

    try {
      await fetch("/api/whatsapp/cart-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          name: name || "there",
          cartUrl: "https://plantasy.co.in/cart",
        }),
      });
      localStorage.setItem(STORAGE_KEY, String(now));
    } catch (err) {
      console.error("Cart reminder error:", err);
    }
  };

  useEffect(() => {
    clearTimer();
    localStorage.removeItem(STORAGE_KEY);
  }, [cartItems.length === 0]);

  useEffect(() => {
    if (cartItems.length === 0 || !phone) {
      clearTimer();
      return;
    }

    clearTimer();
    timerRef.current = setTimeout(sendReminder, REMINDER_DELAY_MS);

    return clearTimer;
  }, [cartItems, phone]);
};
