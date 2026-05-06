/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import express from "express";
import type { Request, Response } from "express";

const router = express.Router();

const DELHIVERY_API_KEY = process.env.DELHIVERY_API_KEY || "";
const DELHIVERY_PICKUP_URL = process.env.DELHIVERY_PICKUP_URL || "https://track.delhivery.com/fm/request/new/";
const DELHIVERY_PICKUP_TIME = process.env.DELHIVERY_PICKUP_TIME || "11:00:00";
const USE_MOCK_DELIVERY = process.env.USE_MOCK_DELIVERY !== "false"; // default true

// Pickup location configuration from environment
const PICKUP_LOCATION = {
  name: process.env.WAREHOUSE_NAME || "Plantasy",
  clientCode: process.env.WAREHOUSE_CLIENT_CODE || "PLANTASY_WH1",
  addressLine1: process.env.WAREHOUSE_ADDRESS_LINE1 || "",
  addressLine2: process.env.WAREHOUSE_ADDRESS_LINE2 || "",
  city: process.env.WAREHOUSE_CITY || "",
  state: process.env.WAREHOUSE_STATE || "",
  pincode: process.env.WAREHOUSE_PINCODE || "",
  phone: process.env.WAREHOUSE_PHONE || "",
};

// Parse dimension string to cm (e.g., "55cm" -> 55, "21in" -> 53.34)
const parseDimensionToCm = (dimension: string): number => {
  const match = dimension.match(/^(\d+(?:\.\d+)?)\s*(cm|in|inch)?$/i);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = (match[2] || "cm").toLowerCase();
  
  if (unit === "in" || unit === "inch") {
    return value * 2.54; // Convert inches to cm
  }
  return value;
};

// Calculate volumetric weight in kg (L x W x H / 5000 for domestic)
const calculateVolumetricWeight = (length: number, width: number, height: number): number => {
  return (length * width * height) / 5000;
};

// Mock shipping rates based on pincode zones and product dimensions
const getMockShippingCost = (pincode: string, items: any[]): number => {
  // Base rate
  let baseRate = 50;
  
  // Calculate total volumetric weight for all items
  let totalVolumetricWeight = 0;
  let totalActualWeight = 0;
  
  items.forEach((item) => {
    const quantity = item.quantity || 1;
    
    if (item.dimensions) {
      const height = parseDimensionToCm(item.dimensions.height || "10cm");
      const width = parseDimensionToCm(item.dimensions.width || "10cm");
      const length = parseDimensionToCm(item.dimensions.length || "10cm");
      const weight = item.dimensions.weight || 500; // default 500g
      
      const volWeight = calculateVolumetricWeight(length, width, height) * quantity;
      const actualWeight = (weight / 1000) * quantity; // Convert to kg
      
      totalVolumetricWeight += volWeight;
      totalActualWeight += actualWeight;
    } else {
      // Default weight assumption: 0.5kg per item
      totalActualWeight += 0.5 * quantity;
      totalVolumetricWeight += 1 * quantity; // Default volumetric
    }
  });
  
  // Use the greater of volumetric or actual weight
  const billableWeight = Math.max(totalVolumetricWeight, totalActualWeight);
  
  // Rate calculation based on weight slabs
  if (billableWeight <= 0.5) {
    baseRate = 50;
  } else if (billableWeight <= 1) {
    baseRate = 70;
  } else if (billableWeight <= 2) {
    baseRate = 100;
  } else if (billableWeight <= 5) {
    baseRate = 180;
  } else if (billableWeight <= 10) {
    baseRate = 300;
  } else {
    baseRate = 300 + Math.ceil((billableWeight - 10) * 40);
  }
  
  // Zone-based adjustment (based on pincode)
  const firstDigit = parseInt(pincode.charAt(0));
  // Metro cities (1, 4, 5, 6, 7, 8) vs rest
  const isMetro = [1, 4, 5, 6, 7, 8].includes(firstDigit);
  if (!isMetro) {
    baseRate = Math.round(baseRate * 1.15); // 15% surcharge for non-metro
  }
  
  return Math.round(baseRate);
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
      
      const shippingCost = getMockShippingCost(pincode, items);
      const estimatedDelivery = getMockEstimatedDelivery(pincode);

      // Calculate total weight
      let totalWeight = 0;
      items.forEach((item) => {
        const quantity = item.quantity || 1;
        if (item.dimensions) {
          totalWeight += (item.dimensions.weight || 500) * quantity;
        } else {
          totalWeight += 500 * quantity;
        }
      });

      return res.json({
        courier: "Delhivery",
        shippingCost,
        estimatedDelivery,
        billableWeightGrams: totalWeight,
        volumetricWeightKg: items.reduce((acc: number, item: any) => {
          if (item.dimensions) {
            const h = parseDimensionToCm(item.dimensions.height || "10cm");
            const w = parseDimensionToCm(item.dimensions.width || "10cm");
            const l = parseDimensionToCm(item.dimensions.length || "10cm");
            return acc + calculateVolumetricWeight(l, w, h) * (item.quantity || 1);
          }
          return acc + 1;
        }, 0),
      });
    }

    // Real Delhivery API call would go here
    const shippingCost = getMockShippingCost(pincode, items);
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

// GET /api/shipping/pickup-location - Get pickup location details
router.get("/pickup-location", async (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      pickupLocation: PICKUP_LOCATION,
    });
  } catch (error: any) {
    console.error("❌ Pickup location error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get pickup location",
      details: error.message || "Unknown error",
    });
  }
});

// POST /api/shipping/generate-label - Generate shipping label for an order
router.post("/generate-label", async (req: Request, res: Response) => {
  try {
    const { orderId, orderItems } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    console.log(`📦 Generating label for order: ${orderId}`);

    // Use mock delivery by default
    if (USE_MOCK_DELIVERY || !DELHIVERY_API_KEY) {
      console.log("📋 Using mock label generation");
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate a mock label URL (in real implementation, this would be a PDF)
      const labelUrl = `https://labels.delhivery.com/${orderId}.pdf`;
      const manifestUrl = `https://manifests.delhivery.com/${orderId}.pdf`;
      
      return res.json({
        success: true,
        mock: true,
        orderId,
        labelUrl,
        manifestUrl,
        message: "Label generated successfully (mock mode)",
      });
    }

    // Real Delhivery API call for label generation
    const url = `${process.env.DELHIVERY_BASE_URL || 'https://ltl-clients-api-dev.delhivery.com'}/labels`;

    const body = {
      shipments: [
        {
          awb: orderId,
          order_id: orderId,
        },
      ],
    };

    console.log("Generating Delhivery label:", body);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DELHIVERY_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Delhivery label error:", response.status, errorText);
      return res.status(response.status).json({
        error: "Failed to generate label",
        details: errorText,
      });
    }

    // The response typically contains a PDF or URL to PDF
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/pdf')) {
      // Return PDF directly
      const pdfBuffer = await response.arrayBuffer();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="label-${orderId}.pdf"`);
      return res.send(Buffer.from(pdfBuffer));
    }

    const data = await response.json() as any;
    console.log("✅ Delhivery label generated:", data);

    res.json({
      success: true,
      orderId,
      labelUrl: data.label_url || `https://labels.delhivery.com/${orderId}.pdf`,
      manifestUrl: data.manifest_url,
      data,
    });

  } catch (error: any) {
    console.error("❌ Generate label error:", error);
    res.status(500).json({
      error: "Failed to generate label",
      details: error.message || "Unknown error",
    });
  }
});

// GET /api/shipping/label/:orderId - Download label for an order
router.get("/label/:orderId", async (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    console.log(`📦 Downloading label for order: ${orderId}`);

    // Use mock delivery by default
    if (USE_MOCK_DELIVERY || !DELHIVERY_API_KEY) {
      // Redirect to mock label URL
      const labelUrl = `https://labels.delhivery.com/${orderId}.pdf`;
      return res.json({
        success: true,
        mock: true,
        labelUrl,
      });
    }

    // Real Delhivery API call to get label
    const url = `${process.env.DELHIVERY_BASE_URL || 'https://ltl-clients-api-dev.delhivery.com'}/labels?awb=${orderId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${DELHIVERY_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Delhivery label download error:", response.status, errorText);
      return res.status(response.status).json({
        error: "Failed to download label",
        details: errorText,
      });
    }

    // Return PDF directly
    const pdfBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="label-${orderId}.pdf"`);
    res.send(Buffer.from(pdfBuffer));

  } catch (error: any) {
    console.error("❌ Download label error:", error);
    res.status(500).json({
      error: "Failed to download label",
      details: error.message || "Unknown error",
    });
  }
});

// POST /api/shipping/create-pickup - Create pickup request for confirmed order
router.post("/create-pickup", async (req: Request, res: Response) => {
  try {
    const { orderId, orderItems, expectedPackageCount = 1 } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    console.log(`📦 Creating pickup request for order: ${orderId}`);

    // Use mock delivery by default
    if (USE_MOCK_DELIVERY || !DELHIVERY_API_KEY) {
      console.log("📋 Using mock pickup creation");
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const pickupRequestId = `PUR_${orderId}_${Date.now()}`;
      const trackingUrl = `https://track.delhivery.com/${orderId}`;
      
      return res.json({
        success: true,
        mock: true,
        pickupRequestId,
        orderId,
        trackingUrl,
        status: "pickup_scheduled",
        message: "Pickup request created successfully (mock mode)",
      });
    }

    // Real Delhivery API call
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const pickupDate = tomorrow.toISOString().split('T')[0];

    const url = `${process.env.DELHIVERY_BASE_URL || 'https://ltl-clients-api-dev.delhivery.com'}/pickup_requests`;

    const body = {
      client_warehouse: PICKUP_LOCATION.clientCode,
      pickup_date: pickupDate,
      start_time: "09:00:00",
      expected_package_count: expectedPackageCount,
      shipments: [
        {
          awb: orderId,
          order_id: orderId,
        },
      ],
    };

    console.log("Creating Delhivery pickup:", body);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DELHIVERY_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Delhivery pickup error:", response.status, errorText);
      return res.status(response.status).json({
        error: "Failed to create pickup request",
        details: errorText,
      });
    }

    const data = await response.json() as any;
    console.log("✅ Delhivery pickup created:", data);

    res.json({
      success: true,
      pickupRequestId: data.request_id || orderId,
      orderId,
      trackingUrl: `https://track.delhivery.com/${orderId}`,
      status: "pickup_scheduled",
      data,
    });

  } catch (error: any) {
    console.error("❌ Create pickup error:", error);
    res.status(500).json({
      error: "Failed to create pickup request",
      details: error.message || "Unknown error",
    });
  }
});

// POST /api/shipping/create-pickup-new - Create pickup request using new endpoint with Token auth
router.post("/create-pickup-new", async (req: Request, res: Response) => {
  try {
    const { orderId, pickupLocation, expectedPackageCount = 1, pickupDate, pickupTime } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is required" });
    }

    console.log(`📦 Creating pickup request (new endpoint) for order: ${orderId}`);

    // Use mock delivery by default
    if (USE_MOCK_DELIVERY || !DELHIVERY_API_KEY) {
      console.log("📋 Using mock pickup creation (new endpoint)");
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const pickupRequestId = `PUR_NEW_${orderId}_${Date.now()}`;
      const trackingUrl = `https://track.delhivery.com/${orderId}`;
      
      return res.json({
        success: true,
        mock: true,
        pickupRequestId,
        orderId,
        trackingUrl,
        status: "pickup_scheduled",
        message: "Pickup request created successfully (mock mode)",
      });
    }

    // Default pickup date = tomorrow
    const defaultPickupDate = new Date();
    defaultPickupDate.setDate(defaultPickupDate.getDate() + 1);
    const finalPickupDate = pickupDate || defaultPickupDate.toISOString().split('T')[0];
    const finalPickupTime = pickupTime || DELHIVERY_PICKUP_TIME;
    const finalPickupLocation = pickupLocation || PICKUP_LOCATION.name;

    const body = {
      pickup_time: finalPickupTime,
      pickup_date: finalPickupDate,
      pickup_location: finalPickupLocation,
      expected_package_count: expectedPackageCount,
    };

    console.log("Creating Delhivery pickup (new endpoint):", { url: DELHIVERY_PICKUP_URL, body });

    const response = await fetch(DELHIVERY_PICKUP_URL, {
      method: "POST",
      headers: {
        Authorization: `Token ${DELHIVERY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Delhivery pickup error (new endpoint):", response.status, errorText);
      return res.status(response.status).json({
        error: "Failed to create pickup request",
        details: errorText,
      });
    }

    const data = await response.json() as any;
    console.log("✅ Delhivery pickup created (new endpoint):", data);

    res.json({
      success: true,
      pickupRequestId: data.request_id || orderId,
      orderId,
      trackingUrl: `https://track.delhivery.com/${orderId}`,
      status: "pickup_scheduled",
      message: "Pickup request created successfully",
      data,
    });

  } catch (error: any) {
    console.error("❌ Create pickup (new endpoint) error:", error);
    res.status(500).json({
      error: "Failed to create pickup request",
      details: error.message || "Unknown error",
    });
  }
});

export default router;
