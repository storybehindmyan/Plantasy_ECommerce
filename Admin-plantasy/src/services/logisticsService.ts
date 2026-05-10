/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "../firebase/firebaseConfig";

const API_URL = import.meta.env.VITE_API_URL || "";

async function authedFetch(path: string, init?: RequestInit) {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  const token = await user.getIdToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
  return res;
}

export const logisticsService = {
  async generateLabel(orderId: string): Promise<{ labelUrl: string }> {
    const res = await authedFetch("/api/delhivery/label", {
      method: "POST",
      body: JSON.stringify({ orderId }),
    });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as any;
  },

  async generateWaybill(orderId: string): Promise<{ waybill: string; trackingUrl: string }> {
    const res = await authedFetch("/api/delhivery/waybill", {
      method: "POST",
      body: JSON.stringify({ orderId }),
    });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as any;
  },

  async track(waybill: string) {
    const res = await authedFetch(`/api/delhivery/track?waybill=${encodeURIComponent(waybill)}`, {
      method: "GET",
    });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as any;
  },

  async syncTracking(orderId: string) {
    const res = await authedFetch("/api/delhivery/track-sync", {
      method: "POST",
      body: JSON.stringify({ orderId }),
    });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as any;
  },

  async syncAll(): Promise<{ synced: number; updated: number }> {
    const res = await authedFetch("/api/delhivery/sync-all", { method: "POST" });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as any;
  },

  async retryPickup(orderId: string): Promise<{ waybill: string }> {
    const res = await authedFetch("/api/delhivery/retry-pickup", {
      method: "POST",
      body: JSON.stringify({ orderId }),
    });
    if (!res.ok) throw new Error(await res.text());
    return (await res.json()) as any;
  },
};

