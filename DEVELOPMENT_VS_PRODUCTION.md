# Development vs Production Setup

## Current Configuration (Development Mode)

Your application is now configured for **local development**. Here's what's set up:

### Frontend (Admin Panel)
- **Running on**: `http://localhost:5173` (Vite dev server)
- **API URL**: `http://localhost:5000`
- **CORS**: Allowed from `http://localhost:5173`

### Backend (Server)
- **Running on**: `http://localhost:5000`
- **CORS Origins**: 
  - `http://localhost:5173` ✅ (your dev frontend)
  - `http://localhost:3000` ✅
  - `https://plantasy.co.in` ✅ (for production)
  - `https://www.plantasy.co.in` ✅

### Delhivery Integration
- **Mock Mode**: `false` (will make real API calls)
- **Pickup URL**: `https://track.delhivery.com/fm/request/new/`
- **Authentication**: Token-based

## How to Test Locally

### 1. Start Backend Server
```bash
cd src/server
npm run dev
```
Server should start on `http://localhost:5000`

### 2. Start Frontend (New Terminal)
```bash
cd Admin-plantasy
npm run dev
```
Frontend should start on `http://localhost:5173`

### 3. Test Pickup Request
1. Open browser: `http://localhost:5173`
2. Navigate to Orders page
3. Try creating a pickup request
4. Should work without CORS errors! ✅

## Switching to Production

When you're ready to deploy to `https://plantasy.co.in`:

### 1. Update `.env` files

**Root `.env`:**
```env
VITE_API_URL=https://plantasy.co.in
```

**`Admin-plantasy/.env`:**
```env
VITE_API_URL=https://plantasy.co.in
```

### 2. Rebuild Frontend
```bash
cd Admin-plantasy
npm run build
```

### 3. Deploy to Server
Upload built files to your hosting server and restart the backend.

## Environment-Specific Settings

| Setting | Development | Production |
|---------|-------------|------------|
| Frontend URL | `http://localhost:5173` | `https://plantasy.co.in` |
| Backend URL | `http://localhost:5000` | `https://plantasy.co.in` |
| API URL | `http://localhost:5000` | `https://plantasy.co.in` |
| Mock Delivery | `false` | `false` |
| CORS | Allows localhost | Allows plantasy.co.in |

## Troubleshooting

### If you still see CORS errors:

1. **Restart both servers** after changing `.env` files
2. **Clear browser cache** (Ctrl+Shift+Delete)
3. **Check if backend is running**: Visit `http://localhost:5000` in browser
4. **Check console logs**: Look for "Server running on http://localhost:5000"

### If frontend can't connect:

1. Verify backend is running on port 5000
2. Check `VITE_API_URL=http://localhost:5000` in `.env` files
3. Restart frontend dev server

### If Delhivery API fails:

1. Check `USE_MOCK_DELIVERY=false` in `.env`
2. Verify `DELHIVERY_API_KEY` is correct
3. Check Delhivery API status

## Quick Commands Reference

```bash
# Development
cd src/server && npm run dev      # Start backend
cd Admin-plantasy && npm run dev  # Start frontend

# Production Build
cd Admin-plantasy && npm run build
cd src/server && npm run build

# PM2 (Production Server Management)
pm2 start src/server/dist/index.js --name plantasy-api
pm2 restart plantasy-api
pm2 logs plantasy-api
```

## Current Status ✅

- ✅ CORS configured for localhost development
- ✅ API URLs pointing to localhost
- ✅ Delhivery integration ready
- ✅ Pickup request endpoint working
- ✅ Mock mode disabled (real API calls)

**You should now be able to test pickup requests locally without CORS errors!**

---

**Need to switch to production?** Just update the `VITE_API_URL` in both `.env` files to `https://plantasy.co.in` and rebuild the frontend.