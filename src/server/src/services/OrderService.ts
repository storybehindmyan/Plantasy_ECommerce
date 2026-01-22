/* eslint-disable @typescript-eslint/no-explicit-any */
// services/DelhiveryService.ts
const DELHIVERY_BASE_URL = 'https://ltl-clients-api-dev.delhivery.com';
const API_KEY = import.meta.env.VITE_DELHIVERY_API_KEY || 'your_token_here';

export const createPickupRequest = async (order: { id: string; pickupAddress: string; date: string }) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1); // Pickup tomorrow
  const pickupDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD

  const url = `${DELHIVERY_BASE_URL}/pickup_requests`;
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      client_warehouse: 'your_warehouse_id', // From Delhivery dashboard
      pickup_date: pickupDate,
      start_time: '09:00:00', // Adjust to your availability
      expected_package_count: 1,
      shipments: [{ awb: order.id }] // Link to your order ID (OD000XXXX)
    })
  };

  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
const data = (await res.json()) as any;  // ✅ data is any
    console.log('Pickup created:', data);
    return data.request_id; // Save this in Firestore order doc
  } catch (err) {
    console.error('Pickup error:', err);
    // Fallback: toast.error('Manual pickup scheduling required');
  }
};


export const OrderService = {   // ✅ named export
  // methods here
};
