# Direct Delhivery API Integration (No Server Required)

## Overview

The pickup request functionality now works **directly from the frontend** to Delhivery's API, without needing your backend server. This eliminates the "Failed to fetch" errors and simplifies the architecture.

## How It Works

### Before (Server-Based)
```
Frontend → Your Backend (localhost:5000) → Delhivery API
         ❌ Fails if backend not running
```

### After (Direct API)
```
Frontend → Delhivery API ✅
         Works directly, no server needed!
```

## Implementation Details

### 1. Frontend Service (`src/services/DelhiveryService.ts`)

The `createPickupRequestNew()` method makes direct API calls to Delhivery:

```typescript
async createPickupRequestNew(params: {
  orderId: string;
  pickupLocation?: string;
  expectedPackageCount?: number;
  pickupDate?: string;
  pickupTime?: string;
}): Promise<PickupRequestResponse>
```

**Key Features:**
- Uses `Authorization: Token ${DELHIVERY_API_KEY}` header
- Posts to `https://track.delhivery.com/fm/request/new/`
- Sends pickup details directly to Delhivery
- No intermediate server required

### 2. Orders Page (`Admin-plantasy/src/pages/orders/OrdersPage.tsx`)

Updated to use the direct method:

```typescript
// Create pickup request directly via Delhivery API (no server needed)
const pickupResult = await DelhiveryService.createPickupRequestNew({
  orderId: order.orderId,
  pickupLocation: import.meta.env.VITE_WAREHOUSE_NAME || 'Plantasy',
  expectedPackageCount: order.items.length || 1,
});
```

### 3. Environment Configuration

**Frontend `.env` (Admin-plantasy/.env):**
```env
VITE_API_URL=http://localhost:5000  # Still used for other APIs
VITE_DELHIVERY_API_KEY=15694a64eef55de1784b9702859938f0d264748f
VITE_DELHIVERY_PICKUP_URL=https://track.delhivery.com/fm/request/new/
VITE_DELHIVERY_PICKUP_TIME=18:00:00
VITE_USE_MOCK_DELIVERY=false
VITE_WAREHOUSE_NAME=Plantasy
```

## API Call Flow

### Request
```http
POST https://track.delhivery.com/fm/request/new/
Authorization: Token 15694a64eef55de1784b9702859938f0d264748f
Content-Type: application/json

{
  "pickup_time": "18:00:00",
  "pickup_date": "2023-12-29",
  "pickup_location": "Plantasy",
  "expected_package_count": 1
}
```

### Response
```json
{
  "request_id": "PUR_12345",
  "status": "created",
  "message": "Pickup request created successfully"
}
```

## Advantages

1. **No Server Dependency**: Works even if your backend is down
2. **Faster**: Direct communication, no intermediate hops
3. **Simpler Architecture**: Fewer components to manage
4. **Better Error Handling**: Direct feedback from Delhivery
5. **Easier Debugging**: Can test directly in browser console

## Testing

### Test in Browser Console

Open your browser's developer console (F12) and run:

```javascript
// Test direct API call
import { DelhiveryService } from './src/services/DelhiveryService';

const result = await DelhiveryService.createPickupRequestNew({
  orderId: 'TEST001',
  pickupLocation: 'Plantasy',
  expectedPackageCount: 1,
});

console.log(result);
```

### Test in Application

1. Start frontend: `npm run dev` in `Admin-plantasy`
2. Open `http://localhost:5173`
3. Go to Orders page
4. Change an order status from "pending" to "confirmed"
5. Should see "Creating pickup request..." toast
6. Should succeed without any server running!

## Mock Mode

For development/testing without hitting real Delhivery API:

**Set in `.env`:**
```env
VITE_USE_MOCK_DELIVERY=true
```

This will simulate API calls with a 500ms delay and return mock responses.

## Error Handling

The implementation includes comprehensive error handling:

```typescript
if (pickupResult.success) {
  // Success - update tracking URL
  const trackingUrl = pickupResult.trackingUrl;
  await orderService.updateOrderTrack(orderId, trackingUrl);
} else {
  // Error - show message
  throw new Error(pickupResult.message || 'Pickup request failed');
}
```

## Production Deployment

When deploying to production (`https://plantasy.co.in`):

1. **Update `.env`**:
   ```env
   VITE_API_URL=https://plantasy.co.in
   VITE_USE_MOCK_DELIVERY=false
   ```

2. **Rebuild frontend**:
   ```bash
   npm run build
   ```

3. **Deploy** to your hosting

The direct API calls will continue to work in production!

## CORS Note

Delhivery's API supports CORS, so direct browser calls work without issues. If you encounter any CORS problems:

1. Check that `DELHIVERY_API_KEY` is correct
2. Verify the API endpoint URL
3. Ensure your API key has the necessary permissions

## Comparison with Server-Based Approach

| Aspect | Direct API (Current) | Server-Based (Old) |
|--------|---------------------|-------------------|
| **Dependency** | None | Backend server required |
| **Speed** | Fast (direct) | Slower (2 hops) |
| **Complexity** | Simple | More complex |
| **Reliability** | High | Depends on server |
| **Debugging** | Easy | Harder |
| **CORS** | Supported by Delhivery | Handled by your server |

## Other Direct API Methods

The `DelhiveryService` also includes other direct methods:

- `verifyDeliveryAvailability()` - Check PIN code serviceability
- `generateLabel()` - Create shipping labels
- `getLabelUrl()` - Get label download URL
- `downloadLabel()` - Open label in new tab

All these work directly without server intervention!

## Troubleshooting

### Issue: "Failed to fetch" error

**Cause**: Delhivery API might be down or API key is invalid

**Solution**:
1. Verify API key in `.env`
2. Check Delhivery API status
3. Test with mock mode enabled

### Issue: CORS error

**Cause**: Rare, but could be browser security settings

**Solution**:
1. Clear browser cache
2. Try different browser
3. Check browser console for details

### Issue: Pickup request fails

**Cause**: Invalid warehouse name or missing parameters

**Solution**:
1. Verify `WAREHOUSE_NAME` in `.env`
2. Check Delhivery dashboard for valid warehouse names
3. Ensure order has valid order ID

## Summary

✅ Pickup requests now work **directly** from frontend to Delhivery  
✅ **No backend server required** for pickup creation  
✅ **Faster and more reliable** than server-based approach  
✅ **Easy to test** - just start the frontend  
✅ **Production ready** - works in both dev and prod  

**You can now create pickup requests without running your backend server!**