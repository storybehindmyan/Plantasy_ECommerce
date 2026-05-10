import express from "express";
import type { Request, Response } from "express";

const router = express.Router();

const DELHIVERY_API_KEY = process.env.DELHIVERY_API_KEY || "";
const DELHIVERY_BASE_URL = process.env.DELHIVERY_BASE_URL || "https://track.delhivery.com";

const getShippingCost = (itemCount: number): number => {
  const baseRate = 50;
  const additionalItemRate = 20;
  return baseRate + (Math.max(itemCount, 1) - 1) * additionalItemRate;
};

const getEstimatedDeliveryDates = (minDays = 3, maxDays = 7): string => {
  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + minDays);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + maxDays);
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  return `${fmt(minDate)} - ${fmt(maxDate)}`;
};

router.post("/quote", async (req: Request, res: Response) => {
  try {
    const { pincode, items } = req.body;

    if (!pincode) return res.status(400).json({ error: "Pincode is required" });
    if (!items || !Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: "At least one item is required" });
    if (!/^\d{6}$/.test(pincode))
      return res.status(400).json({ error: "Invalid pincode format. Must be 6 digits." });

    const shippingCost = getShippingCost(items.length);

    if (!DELHIVERY_API_KEY) {
      // Dev mode — no API key configured
      console.warn("[Shipping] No DELHIVERY_API_KEY — returning dev-mode mock");
      return res.json({
        courier: "Delhivery",
        shippingCost,
        estimatedDelivery: getEstimatedDeliveryDates(3, 7),
        serviceable: true,
        devMode: true,
        billableWeightGrams: items.length * 500,
      });
    }

    // Real Delhivery serviceability check
    const svcRes = await fetch(
      `${DELHIVERY_BASE_URL}/c/api/pin-codes/json/?filter_codes=${pincode}`,
      { headers: { Authorization: `Token ${DELHIVERY_API_KEY}` } }
    );

    if (!svcRes.ok) {
      console.error(`Delhivery API error: ${svcRes.status} ${await svcRes.text()}`);
      return res.status(503).json({
        error: "Delivery check failed. Please try again.",
        serviceable: false,
      });
    }

    const svcData = (await svcRes.json()) as any;
    const deliveryCodes = svcData?.delivery_codes ?? [];

    if (deliveryCodes.length === 0) {
      return res.status(200).json({
        serviceable: false,
        error: `Delivery not available for PIN code ${pincode}`,
      });
    }

    const code = deliveryCodes[0]?.postal_code;
    const services: string = code?.services ?? "";
    const isExpress = services.includes("E");

    return res.json({
      courier: "Delhivery",
      shippingCost,
      estimatedDelivery: getEstimatedDeliveryDates(isExpress ? 2 : 3, isExpress ? 5 : 7),
      serviceable: true,
      serviceType: isExpress ? "Express" : "Standard",
      billableWeightGrams: items.length * 500,
    });
  } catch (error: any) {
    console.error("Shipping quote error:", error);
    return res.status(503).json({
      error: "Unable to check delivery availability. Please try again.",
      serviceable: false,
    });
  }
});

router.get("/verify/:pincode", async (req: Request, res: Response) => {
  try {
    const { pincode } = req.params;
    if (!pincode || !/^\d{6}$/.test(pincode))
      return res.status(400).json({ available: false, error: "Invalid pincode" });

    if (DELHIVERY_API_KEY) {
      try {
        const svcRes = await fetch(
          `${DELHIVERY_BASE_URL}/c/api/pin-codes/json/?filter_codes=${pincode}`,
          { headers: { Authorization: `Token ${DELHIVERY_API_KEY}` } }
        );
        if (svcRes.ok) {
          const svcData = (await svcRes.json()) as any;
          const deliveryCodes = svcData?.delivery_codes ?? [];
          const serviceable = deliveryCodes.length > 0;
          return res.json({ available: serviceable, serviceable, pincode });
        }
      } catch (apiErr) {
        console.warn("Delhivery verify failed, falling back to format check:", apiErr);
      }
    }

    return res.json({ available: true, serviceable: true, pincode });
  } catch (error: any) {
    console.error("Shipping verification error:", error);
    return res.status(500).json({ available: false, error: "Failed to verify delivery" });
  }
});

export default router;
