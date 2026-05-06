# Quick Setup Guide - Plantasy Production Deployment

## 🚀 Quick Start (5 Minutes)

### 1. Environment Setup

All environment variables are already configured! Just verify these key settings:

**Root `.env` file:**
```env
VITE_API_URL=https://plantasy.co.in
USE_MOCK_DELIVERY=false
DELHIVERY_PICKUP_URL=https://track.delhivery.com/fm/request/new/
```

**Frontend `Admin-plantasy/.env`:**
```env
VITE_API_URL=https://plantasy.co.in
VITE_USE_MOCK_DELIVERY=false
```

### 2. Build & Deploy

```bash
# Build frontend
cd Admin-plantasy
npm run build
cd ..

# Build backend
cd src/server
npm run build
cd ../..

# Start server (using PM2)
pm2 start src/server/dist/index.js --name plantasy-api --watch
pm2 save
pm2 startup
```

### 3. Verify Deployment

```bash
# Test API is running
curl https://plantasy.co.in/

# Test pickup endpoint
curl -X POST https://plantasy.co.in/api/shipping/create-pickup-new \
  -H "Content-Type: application/json" \
  -d '{"orderId": "TEST001"}'

# Check server logs
pm2 logs plantasy-api
```

## 🔧 Common Commands

### Development Mode

```bash
# Start backend in dev mode
cd src/server
npm run dev

# Start frontend in dev mode (new terminal)
cd Admin-plantasy
npm run dev
```

### Production Mode

```bash
# Restart server
pm2 restart plantasy-api

# Stop server
pm2 stop plantasy-api

# View logs
pm2 logs plantasy-api

# Monitor server
pm2 monit
```

## 🌐 URLs Reference

| Service | URL |
|---------|-----|
| Frontend | `https://plantasy.co.in` |
| Backend API | `https://plantasy.co.in/api/` |
| Pickup Request Endpoint | `https://plantasy.co.in/api/shipping/create-pickup-new` |
| Delhivery API | `https://track.delhivery.com/fm/request/new/` |

## 📝 Configuration Files

| File | Purpose |
|------|---------|
| `.env` | Main configuration (backend + shared) |
| `Admin-plantasy/.env` | Frontend configuration |
| `src/server/.env` | Server-specific configuration |
| `src/server/src/index.ts` | CORS configuration |
| `src/services/DelhiveryService.ts` | Delhivery API integration |

## 🐛 Troubleshooting

### CORS Errors

**Problem**: "Access to fetch has been blocked by CORS policy"

**Solution**:
1. Check `src/server/src/index.ts` - ensure your domain is in `allowedOrigins`
2. Clear browser cache
3. Verify both frontend and backend use HTTPS

### API Not Connecting

**Problem**: Frontend can't connect to backend

**Solution**:
1. Verify `VITE_API_URL=https://plantasy.co.in` in all `.env` files
2. Rebuild frontend: `npm run build`
3. Restart server: `pm2 restart plantasy-api`

### Delhivery API Failing

**Problem**: Pickup requests not working

**Solution**:
1. Set `USE_MOCK_DELIVERY=false` in all `.env` files
2. Verify `DELHIVERY_API_KEY` is correct
3. Check Delhivery API status

## 📞 Support

For detailed documentation, see:
- `PRODUCTION_DEPLOYMENT_GUIDE.md` - Complete deployment guide
- `PICKUP_REQUEST_INTEGRATION.md` - Delhivery integration details
- `SHIPPING_INTEGRATION_SUMMARY.md` - Shipping overview

## ✅ Pre-deployment Checklist

- [ ] All `.env` files have `VITE_API_URL=https://plantasy.co.in`
- [ ] `USE_MOCK_DELIVERY=false` in all `.env` files
- [ ] Frontend is rebuilt after `.env` changes
- [ ] Server is running with PM2
- [ ] CORS configuration includes production domain
- [ ] SSL certificate is installed and valid
- [ ] API endpoints are tested with curl

## 🔄 Update Procedure

When making changes:

1. **Update code** → Commit to git
2. **Pull changes** on server
3. **Update `.env`** if needed
4. **Rebuild frontend**: `cd Admin-plantasy && npm run build`
5. **Rebuild backend**: `cd src/server && npm run build`
6. **Restart server**: `pm2 restart plantasy-api`
7. **Test** the changes

## 🛡️ Security Notes

- ✅ API keys are in `.env` files (not committed to git)
- ✅ CORS is properly configured
- ✅ HTTPS is enforced
- ✅ Delhivery API uses Token authentication
- ✅ Mock mode is disabled in production

---

**Need help?** Check the detailed guides or review server logs with `pm2 logs plantasy-api`