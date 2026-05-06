# Pickup Request Integration - Delhivery API

## Overview

This document explains the implementation of the new Delhivery pickup request endpoint with Token-based authentication.

## API Endpoint Details

**URL:** `https://track.delhivery.com/fm/request/new/`

**Method:** POST

**Authentication:** Token-based (not Bearer)

**Headers:**
```
Authorization: Token YOUR_API_KEY
Content-Type: application/json
```

**Request Body:**
```json
{
  "pickup_time": "11:00:00",
  "pickup_date": "2023-12-29",
  "pickup_location": "warehouse_name",
  "expected_package_count": 1
}
```

## Environment Variables

All configuration is managed through environment variables for easy editing:

### Root `.env` file:
```env
# Delhivery API Configuration
DELHIVERY_API_KEY="15694a64eef55de1784b9702859938f0d264748f"
DELHIVERY_BASE_URL=https://ltl-clients-api-dev.delhivery.com
USE_MOCK_DELIVERY=true   # set false in prod

# Pickup Request Configuration (NEW)
DELHIVERY_PICKUP_URL=https://track.delhivery.com/fm/request/new/
DELHIVERY_PICKUP_TIME=11:00:00

# Warehouse Configuration
WAREHOUSE_NAME=U.Siddhardha
WAREHOUSE_PHONE=9121999499
WAREHOUSE_ADDRESS_LINE1=7-4-37/a, Raja colony
WAREHOUSE_ADDRESS_LINE2=Near DArgah Centere
WAREHOUSE_CITY=Peddapuram
WAREHOUSE_STATE=Andhra Pradesh
WAREHOUSE_PINCODE=533427
WAREHOUSE_CLIENT_CODE=PLANTASY_WH1
```

### Server `.env` file (`src/server/.env`):
```env
DELHIVERY_API_KEY=15694a64eef55de1784b9702859938f0d264748f
DELHIVERY_BASE_URL=https://ltl-clients-api-dev.delhivery.com
USE_MOCK_DELIVERY=true   # set false in prod

# Pickup Request Configuration (NEW)
DELHIVERY_PICKUP_URL=https://track.delhivery.com/fm/request/new/
DELHIVERY_PICKUP_TIME=11:00:00

# Warehouse Configuration
WAREHOUSE_NAME=Plantasy Warehouse
WAREHOUSE_PHONE=9876543210
WAREHOUSE_ADDRESS_LINE1=7-4-37/a, Raja colony
WAREHOUSE_ADDRESS_LINE2=Near DArgah Centere
WAREHOUSE_CITY=Peddapuram
WAREHOUSE_STATE=Andhra Pradesh
WAREHOUSE_PINCODE=533470
WAREHOUSE_CLIENT_CODE=PLANTASY_WH1
```

## Implementation Files

### 1. Frontend Service (`src/services/DelhiveryService.ts`)

Added new method `createPickupRequestNew()`:

```typescript
async createPickupRequestNew(params: {
  orderId: string;
  pickupLocation?: string;
  expectedPackageCount?: number;
  pickupDate?: string;
  pickupTime?: string;
}): Promise<PickupRequestResponse>
```

**Features:**
- Uses `DELHIVERY_PICKUP_URL` from environment
- Uses `DELHIVERY_PICKUP_TIME` as default pickup time
- Defaults to tomorrow's date if not specified
- Token-based authentication: `Authorization: Token ${DELHIVERY_API_KEY}`
- Mock mode support for development
- Comprehensive error handling

### 2. Backend Route (`src/server/src/routes/shipping.ts`)

Added new endpoint: `POST /api/shipping/create-pickup-new`

**Request Body:**
```json
{
  "orderId": "OD000123",
  "pickupLocation": "Plantasy Warehouse",
  "expectedPackageCount": 1,
  "pickupDate": "2023-12-29",
  "pickupTime": "11:00:00"
}
```

**Response:**
```json
{
  "success": true,
  "pickupRequestId": "PUR_NEW_OD000123_1703865600000",
  "orderId": "OD000123",
  "trackingUrl": "https://track.delhivery.com/OD000123",
  "status": "pickup_scheduled",
  "message": "Pickup request created successfully",
  "data": { /* Delhivery API response */ }
}
```

## Usage Examples

### Frontend Usage

```typescript
import { DelhiveryService } from '../services/DelhiveryService';

// Create pickup request
const result = await DelhiveryService.createPickupRequestNew({
  orderId: 'OD000123',
  pickupLocation: 'Plantasy Warehouse',
  expectedPackageCount: 2,
  pickupDate: '2023-12-29',
  pickupTime: '14:00:00'
});

console.log(result);
```

### Backend API Call

```bash
curl -X POST http://localhost:5000/api/shipping/create-pickup-new \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "OD000123",
    "pickupLocation": "Plantasy Warehouse",
    "expectedPackageCount": 2,
    "pickupDate": "2023-12-29",
    "pickupTime": "14:00:00"
  }'
```

## Configuration Guide

### Changing Pickup Time

Edit the `.env` file and update `DELHIVERY_PICKUP_TIME`:

```env
DELHIVERY_PICKUP_TIME=14:00:00  # 2:00 PM
```

### Changing Pickup URL

If Delhivery changes their endpoint, update `DELHIVERY_PICKUP_URL`:

```env
DELHIVERY_PICKUP_URL=https://new.track.delhivery.com/fm/request/new/
```

### Changing Warehouse Name

Update `WAREHOUSE_NAME` in both `.env` files:

```env
WAREHOUSE_NAME=My New Warehouse Name
```

### Disabling Mock Mode

For production, set `USE_MOCK_DELIVERY=false`:

```env
USE_MOCK_DELIVERY=false
```

## Key Differences from Previous Implementation

| Aspect | Old Implementation | New Implementation |
|--------|-------------------|-------------------|
| **URL** | `https://ltl-clients-api-dev.delhivery.com/pickup_requests` | `https://track.delhivery.com/fm/request/new/` |
| **Auth Type** | Bearer Token | Token |
| **Auth Header** | `Authorization: Bearer ${KEY}` | `Authorization: Token ${KEY}` |
| **Request Body** | Includes `shipments` array | Simple flat structure |
| **Fields** | `client_warehouse`, `start_time` | `pickup_location`, `pickup_time` |

## Testing

### Mock Mode (Development)

By default, `USE_MOCK_DELIVERY=true`, so no real API calls are made. The system returns mock responses:

```json
{
  "mock": true,
  "pickupRequestId": "mock_pur_OD000123",
  "orderId": "OD000123",
  "trackingUrl": "https://track.delhivery.com/OD000123",
  "status": "created",
  "success": true,
  "message": "Pickup request created successfully (mock mode)"
}
```

### Production Mode

Set `USE_MOCK_DELIVERY=false` in `.env` to make real API calls to Delhivery.

## Error Handling

The implementation includes comprehensive error handling:

1. **Network Errors:** Caught and returned with status "error"
2. **API Errors:** HTTP status codes are captured and returned
3. **Validation Errors:** Missing required fields return 400 Bad Request
4. **Mock Mode:** Graceful fallback when API key is not configured

## Migration Notes

- The old `createPickupRequest()` method is still available for backward compatibility
- New implementations should use `createPickupRequestNew()` or the `/api/shipping/create-pickup-new` endpoint
- Both methods can coexist during transition period

## Support

For issues or questions:
1. Check the console logs for detailed error messages
2. Verify environment variables are correctly set
3. Ensure API key is valid and has pickup request permissions
4. Test in mock mode first before enabling production mode