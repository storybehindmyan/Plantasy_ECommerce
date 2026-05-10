import express from "express";
import type { Request, Response } from "express";

const router = express.Router();

const USE_MOCK_DELIVERY = process.env.USE_MOCK_DELIVERY !== "false";
const DELHIVERY_API_KEY = process.env.DELHIVERY_API_KEY || "";

const getMockShippingCost = (_pincode: string, itemCount: number): number => {
  const baseRate = 50;
  const additionalItemRate = 20;
  const totalItems = Math.max(itemCount, 1);
  return baseRate + (totalItems - 1) * additionalItemRate;
};

const getMockEstimatedDelivery = (_pincode: string): string => {
  const today = new Date();
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + 3);
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 7);
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

    if (USE_MOCK_DELIVERY || !DELHIVERY_API_KEY) {
      return res.json({
        courier: "Delhivery",
        shippingCost: getMockShippingCost(pincode, items.length),
        estimatedDelivery: getMockEstimatedDelivery(pincode),
        billableWeightGrams: items.length * 500,
      });
    }

    return res.json({
      courier: "Delhivery",
      shippingCost: getMockShippingCost(pincode, items.length),
      estimatedDelivery: getMockEstimatedDelivery(pincode),
      billableWeightGrams: items.length * 500,
    });
  } catch (error: any) {
    console.error("Shipping quote error:", error);
    return res.status(500).json({
      error: "Failed to calculate shipping quote",
      details: error.message || "Unknown error",
    });
  }
});

router.get("/verify/:pincode", async (req: Request, res: Response) => {
  try {
    const { pincode } = req.params;
    if (!pincode) return res.status(400).json({ available: false, error: "Pincode is required" });
    const isValid = /^\d{6}$/.test(pincode);
    return res.json({ available: isValid, pincode, serviceable: isValid });
  } catch (error: any) {
    console.error("Shipping verification error:", error);
    return res.status(500).json({ available: false, error: "Failed to verify delivery" });
  }
});

export default router;
