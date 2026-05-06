# Production Deployment Guide - Plantasy E-commerce

## Overview

This guide covers the complete production deployment setup for Plantasy, including CORS configuration, API connections, and Delhivery integration.

## Environment Configuration

### 1. Root `.env` File (Backend + Shared)

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Razorpay (Live Mode)
RAZORPAY_KEY_ID=rzp_live_Sc9GkrN8gQ2xF7
RAZORPAY_KEY_SECRET=OrMGgGUOtGkn0UH6HC0sjGTx

# Frontend Razorpay Key (Public)
VITE_RAZORPAY_KEY_ID=rzp_live_Sc9GkrN8gQ2xF7

# API URL - Production
VITE_API_URL=https://plantasy.co.in

# Delhivery API Configuration
DELHIVERY_API_KEY=15694a64eef55de1784b9702859938f0d264748f
DELHIVERY_BASE_URL=https://ltl-clients-api-dev.delhivery.com
USE_MOCK_DELIVERY=false

# Pickup Request Configuration
DELHIVERY_PICKUP_URL=https://track.delhivery.com/fm/request/new/
DELHIVERY_PICKUP_TIME=18:00:00

# Warehouse Configuration
WAREHOUSE_NAME=Plantasy
WAREHOUSE_PHONE=9876543210
WAREHOUSE_ADDRESS_LINE1=Plot no:236,Jal vayu vihar,
WAREHOUSE_ADDRESS_LINE2=Kukatpally,
WAREHOUSE_CITY=Hyderabad
WAREHOUSE_STATE=Telangana
WAREHOUSE_PINCODE=500072
WAREHOUSE_CLIENT_CODE=PLANTASY_WH1
```

### 2. Frontend `.env` (Admin-plantasy/.env)

```env
# API URL - Production
VITE_API_URL=https://plantasy.co.in

# Frontend Razorpay Key (Public)
VITE_RAZORPAY_KEY_ID=rzp_live_Sc9GkrN8gQ2xF7

# Delhivery Configuration
VITE_DELHIVERY_API_KEY=15694a64eef55de1784b9702859938f0d264748f
VITE_DELHIVERY_PICKUP_URL=https://track.delhivery.com/fm/request/new/
VITE_DELHIVERY_PICKUP_TIME=18:00:00
VITE_USE_MOCK_DELIVERY=false
VITE_WAREHOUSE_NAME=Plantasy
```

### 3. Server `.env` (src/server/.env)

```env
PORT=5000
NODE_ENV=production

# Razorpay
RAZORPAY_KEY_ID=rzp_live_Sc9GkrN8gQ2xF7
RAZORPAY_KEY_SECRET=OrMGgGUOtGkn0UH6HC0sjGTx

# Delhivery
DELHIVERY_API_KEY=15694a64eef55de1784b9702859938f0d264748f
DELHIVERY_BASE_URL=https://ltl-clients-api-dev.delhivery.com
USE_MOCK_DELIVERY=false

# Pickup Request Configuration
DELHIVERY_PICKUP_URL=https://track.delhivery.com/fm/request/new/
DELHIVERY_PICKUP_TIME=18:00:00

# Warehouse
WAREHOUSE_NAME=Plantasy
WAREHOUSE_PHONE=9876543210
WAREHOUSE_ADDRESS_LINE1=Plot no:236,Jal vayu vihar,
WAREHOUSE_ADDRESS_LINE2=Kukatpally,
WAREHOUSE_CITY=Hyderabad
WAREHOUSE_STATE=Telangana
WAREHOUSE_PINCODE=500072
WAREHOUSE_CLIENT_CODE=PLANTASY_WH1
```

## CORS Configuration

The server is configured with proper CORS settings in `src/server/src/index.ts`:

```typescript
const allowedOrigins = [
  "http://localhost:5173",      // Vite dev server
  "http://localhost:3000",      // React dev server
  "https://plantasy.co.in",     // Production domain
  "https://www.plantasy.co.in", // Production www domain
  "http://localhost:5174",      // Vite alternate port
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  exposedHeaders: ["Content-Disposition"],
  maxAge: 86400, // 24 hours
}));
```

### CORS Troubleshooting

If you encounter CORS errors:

1. **Check the origin**: Make sure your frontend domain is in the `allowedOrigins` array
2. **Clear browser cache**: CORS policies are cached
3. **Check for redirects**: Ensure no redirects are changing the origin
4. **Verify HTTPS**: Production should use HTTPS for both frontend and backend

## API Endpoints

### Shipping Routes

All shipping endpoints are available at `https://plantasy.co.in/api/shipping/`:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/quote` | POST | Get shipping quote |
| `/verify/:pincode` | GET | Verify delivery availability |
| `/pickup-location` | GET | Get pickup location details |
| `/generate-label` | POST | Generate shipping label |
| `/label/:orderId` | GET | Download shipping label |
| `/create-pickup` | POST | Create pickup request (old endpoint) |
| `/create-pickup-new` | POST | Create pickup request (new endpoint with Token auth) |

### Usage Examples

#### Create Pickup Request (Frontend)

```typescript
import { DelhiveryService } from './src/services/DelhiveryService';

const result = await DelhiveryService.createPickupRequestNew({
  orderId: 'OD000123',
  pickupLocation: 'Plantasy',
  expectedPackageCount: 1,
  pickupDate: '2023-12-29',
  pickupTime: '18:00:00'
});

console.log(result);
```

#### Create Pickup Request (Backend API)

```bash
curl -X POST https://plantasy.co.in/api/shipping/create-pickup-new \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "OD000123",
    "pickupLocation": "Plantasy",
    "expectedPackageCount": 1,
    "pickupDate": "2023-12-29",
    "pickupTime": "18:00:00"
  }'
```

## Deployment Steps

### 1. Build Frontend

```bash
cd Admin-plantasy
npm run build
```

### 2. Build Backend

```bash
cd src/server
npm run build
```

### 3. Deploy to Server

1. Upload built files to your server
2. Ensure `.env` files are properly configured
3. Install dependencies: `npm install`
4. Start the server: `npm start` or use PM2

### 4. Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start src/server/dist/index.js --name plantasy-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### 5. Nginx Configuration (Optional but Recommended)

```nginx
server {
    listen 80;
    server_name plantasy.co.in www.plantasy.co.in;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name plantasy.co.in www.plantasy.co.in;
    
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # Frontend
    location / {
        root /var/www/plantasy;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Testing Production Setup

### 1. Test CORS Configuration

```bash
# Test from browser console or curl
curl -X OPTIONS https://plantasy.co.in/api/shipping/quote \
  -H "Origin: https://plantasy.co.in" \
  -H "Access-Control-Request-Method: POST" \
  -v
```

Expected headers in response:
```
Access-Control-Allow-Origin: https://plantasy.co.in
Access-Control-Allow-Credentials: true
```

### 2. Test Pickup Request

```bash
curl -X POST https://plantasy.co.in/api/shipping/create-pickup-new \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST001",
    "expectedPackageCount": 1
  }'
```

### 3. Test Frontend Connection

1. Open browser console
2. Navigate to your frontend
3. Check for any CORS errors
4. Verify API calls are going to `https://plantasy.co.in`

## Common Issues and Solutions

### Issue 1: CORS Errors

**Error**: "Access to fetch at 'https://plantasy.co.in/api/...' from origin 'http://localhost:5173' has been blocked by CORS policy"

**Solutions**:
- Ensure your frontend origin is in the `allowedOrigins` array
- Check that both frontend and backend are using HTTPS in production
- Clear browser cache and cookies

### Issue 2: API Calls Going to Wrong URL

**Error**: Frontend is calling `http://localhost:5000` instead of production URL

**Solutions**:
- Rebuild frontend after updating `VITE_API_URL` in `.env`
- Clear browser cache
- Check that `.env` file is being loaded correctly

### Issue 3: Delhivery API Not Working

**Error**: Pickup requests failing or returning mock data

**Solutions**:
- Set `USE_MOCK_DELIVERY=false` in all `.env` files
- Verify `DELHIVERY_API_KEY` is correct
- Check Delhivery API status

### Issue 4: Environment Variables Not Loading

**Error**: Environment variables are undefined

**Solutions**:
- Restart the server after changing `.env`
- Rebuild frontend after changing `.env`
- Check file encoding (should be UTF-8)
- Verify `.env` file is in the correct location

## Security Considerations

1. **Never commit `.env` files** to version control
2. **Use HTTPS** for all production endpoints
3. **Keep API keys secure** - never expose server-side keys in frontend code
4. **Implement rate limiting** to prevent abuse
5. **Use environment-specific configurations** for development vs production

## Monitoring and Logging

The server includes request logging:

```typescript
app.use((req, _res, next) => {
  console.log(`📡 ${req.method} ${req.url}`);
  next();
});
```

For production monitoring, consider:
- Using a logging service (e.g., Winston, Morgan)
- Setting up error tracking (e.g., Sentry)
- Monitoring API response times
- Tracking failed pickup requests

## Rollback Plan

If something goes wrong:

1. **Keep previous version** of code backed up
2. **Use PM2** for easy restart: `pm2 restart plantasy-api`
3. **Database backups** if applicable
4. **Rollback `.env` changes** if configuration issues

## Support

For issues:
1. Check server logs: `pm2 logs plantasy-api`
2. Verify environment variables are set correctly
3. Test API endpoints directly with curl
4. Check Delhivery API documentation
5. Review CORS configuration in `src/server/src/index.ts`