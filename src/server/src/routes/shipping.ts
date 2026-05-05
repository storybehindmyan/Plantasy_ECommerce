/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import type { Request, Response } from "express";

const router = express.Router();

const DELHIVERY_API_KEY = process.env.DELHIVERY_API_KEY || "";
const USE_MOCK_DELIVERY = process.env.USE_MOCK_DELIVERY !== "false"; // default true

// Mock shipping rates based on pincode zones
const getMockShippingCost = (_pincode: string, itemCount: number): number => {
  // Base rate for first item
  const baseRate = 50;
  // Additional item rate
  const additionalItemRate = 20;
  
  // Calculate total
  const totalItems = Math.max(itemCount, 1);
  const shippingCost = baseRate + (totalItems - 1) * additionalItemRate;
  
  return shippingCost;
};

const getMockEstimatedDelivery = (pincode: string): string => {
  // Mock delivery estimate: 3-7 business days
  const today = new Date();
  const minDays = 3;
  const maxDays = 7;
  
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + minDays);
  
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + maxDays);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };
  
  return `${formatDate(minDate)} - ${formatDate(maxDate)}`;
};

// POST /api/shipping/quote
router.post("/quote", async (req: Request, res: Response) => {
  try {
    const { pincode, items } = req.body;

    if (!pincode) {
      return res.status(400).json({ error: "Pincode is required" });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "At least one item is required" });
    }

    // Validate pincode format (Indian PIN code: 6 digits)
    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ error: "Invalid pincode format. Must be 6 digits." });
    }

    console.log(`📦 Shipping quote request: pincode=${pincode}, items=${items.length}`);

    // Use mock delivery by default or if API key is not set
    if (USE_MOCK_DELIVERY || !DELHIVERY_API_KEY) {
      console.log("📋 Using mock shipping calculation");
      
      const shippingCost = getMockShippingCost(pincode, items.length);
      const estimatedDelivery = getMockEstimatedDelivery(pincode);

      return res.json({
        courier: "Delhivery",
        shippingCost,
        estimatedDelivery,
        billableWeightGrams: items.length * 500, // Mock weight
      });
    }

    // Real Delhivery API call would go here
    // For now, we'll use mock as the API structure may vary
    const shippingCost = getMockShippingCost(pincode, items.length);
    const estimatedDelivery = getMockEstimatedDelivery(pincode);

    res.json({
      courier: "Delhivery",
      shippingCost,
      estimatedDelivery,
      billableWeightGrams: items.length * 500,
    });

  } catch (error: any) {
    console.error("❌ Shipping quote error:", error);
    res.status(500).json({
      error: "Failed to calculate shipping quote",
      details: error.message || "Unknown error",
    });
  }
});

// GET /api/shipping/verify - Verify delivery availability for a pincode
router.get("/verify/:pincode", async (req: Request, res: Response) => {
  try {
    const { pincode } = req.params;

    if (!pincode) {
      return res.status(400).json({ available: false, error: "Pincode is required" });
    }

    // Validate Indian PIN code format
    const isValid = /^\d{6}$/.test(pincode);

    res.json({
      available: isValid,
      pincode,
      serviceable: isValid,
    });

  } catch (error: any) {
    console.error("❌ Shipping verification error:", error);
    res.status(500).json({
      available: false,
      error: "Failed to verify delivery",
      details: error.message || "Unknown error",
    });
  }
});

export default router;