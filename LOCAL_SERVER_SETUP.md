# Local Server Setup & Troubleshooting

## 🚨 "Failed to fetch" Error - Quick Fix

This error means your **backend server is not running** or not reachable at `http://localhost:5000`.

### Step-by-Step Solution:

#### 1. Start the Backend Server

Open a **new terminal** and run:

```bash
cd src/server
npm run dev
```

You should see output like:
```
📁 Loading .env from: /path/to/.env
✅ Environment variables loaded:
   PORT: 5000
   RAZORPAY_KEY_ID: rzp_live_Sc9GkrN8gQ2xF7...
   KEY TYPE: 🔴 LIVE

🚀 ===============================================
   Server running on http://localhost:5000
   Razorpay: 🔴 LIVE MODE
===============================================
```

#### 2. Restart the Frontend

After starting the backend, **restart your frontend dev server**:

```bash
# In another terminal
cd Admin-plantasy
npm run dev
```

#### 3. Verify Backend is Running

Open your browser and visit: `http://localhost:5000`

You should see:
```json
{
  "message": "Plantasy Backend API is running"
}
```

#### 4. Test the API

Visit: `http://localhost:5000/api/shipping/verify/500072`

You should see:
```json
{
  "available": true,
  "pincode": "500072",
  "serviceable": true
}
```

## Common Issues & Solutions

### Issue 1: Port Already in Use

**Error**: `EADDRINUSE: address already in use :::5000`

**Solution**:
```bash
# Kill the process using port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -i :5000
kill -9 <PID>
```

### Issue 2: Environment Variables Not Loading

**Error**: `ERROR: Razorpay credentials not found in .env file!`

**Solution**:
1. Check that `.env` file exists in the root directory
2. Verify it contains:
   ```env
   RAZORPAY_KEY_ID=rzp_live_Sc9GkrN8gQ2xF7
   RAZORPAY_KEY_SECRET=OrMGgGUOtGkn0UH6HC0sjGTx
   ```

### Issue 3: TypeScript Compilation Errors

**Error**: Various TypeScript errors when running `npm run dev`

**Solution**:
```bash
# Install dependencies
cd src/server
npm install

# Build the project
npm run build

# Then run dev
npm run dev
```

### Issue 4: Frontend Still Can't Connect

**Solution**:
1. **Restart frontend dev server** (important!)
   ```bash
   cd Admin-plantasy
   # Press Ctrl+C to stop
   npm run dev
   ```

2. **Clear browser cache** (Ctrl+Shift+Delete)

3. **Check network tab** in browser DevTools:
   - Open DevTools (F12)
   - Go to Network tab
   - Try creating a pickup request
   - Look for failed requests to `http://localhost:5000/api/shipping/create-pickup`

4. **Verify API_URL**:
   - Check browser console for the API URL being used
   - Should be `http://localhost:5000`

## Complete Setup Checklist

### Prerequisites
- [ ] Node.js installed (v16 or higher)
- [ ] npm or yarn installed

### Backend Setup
- [ ] Navigate to `src/server` directory
- [ ] Run `npm install` to install dependencies
- [ ] Verify `.env` file exists with required keys
- [ ] Run `npm run dev` to start server
- [ ] Verify server is running at `http://localhost:5000`

### Frontend Setup
- [ ] Navigate to `Admin-plantasy` directory
- [ ] Run `npm install` to install dependencies
- [ ] Verify `.env` file has `VITE_API_URL=http://localhost:5000`
- [ ] Run `npm run dev` to start dev server
- [ ] Open `http://localhost:5173` in browser

### Testing
- [ ] Visit `http://localhost:5000` - should see API running message
- [ ] Visit `http://localhost:5173` - should see admin panel
- [ ] Try creating a pickup request - should work without errors

## Quick Commands Reference

### Start Backend
```bash
cd src/server
npm install    # First time only
npm run dev    # Start development server
```

### Start Frontend (New Terminal)
```bash
cd Admin-plantasy
npm install    # First time only
npm run dev    # Start development server
```

### Stop Servers
- Press `Ctrl+C` in each terminal

### Build for Production
```bash
# Backend
cd src/server
npm run build

# Frontend
cd Admin-plantasy
npm run build
```

## Network Connectivity Check

If you're still having issues, run these commands:

```bash
# Check if port 5000 is listening
netstat -an | grep 5000

# Test if server responds
curl http://localhost:5000

# Check if frontend can reach backend
# (Run this in browser console)
fetch('http://localhost:5000/api/shipping/verify/500072')
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.error(e))
```

## What Each Server Does

### Backend Server (Port 5000)
- Handles API requests
- Processes payments (Razorpay)
- Creates pickup requests (Delhivery)
- Manages orders and shipping

### Frontend Server (Port 5173)
- Admin dashboard
- Order management
- User interface

## Expected Console Output

### Backend Server
```
📁 Loading .env from: /path/to/.env
✅ Environment variables loaded:
   PORT: 5000
   RAZORPAY_KEY_ID: rzp_live_Sc9GkrN8gQ2xF7...
   KEY TYPE: 🔴 LIVE

📡 GET /
📡 GET /api/shipping/verify/500072
📡 POST /api/shipping/create-pickup

🚀 ===============================================
   Server running on http://localhost:5000
   Razorpay: 🔴 LIVE MODE
===============================================
```

### Frontend Console
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

## Still Having Issues?

1. **Delete node_modules and reinstall**:
   ```bash
   rm -rf src/server/node_modules
   rm -rf Admin-plantasy/node_modules
   npm install
   ```

2. **Check for firewall blocking**:
   - Temporarily disable firewall
   - Try again

3. **Use different ports**:
   - Change PORT in `.env` to 5001
   - Update VITE_API_URL to `http://localhost:5001`

4. **Check logs**:
   ```bash
   # Backend logs
   cd src/server
   npm run dev 2>&1 | tee backend.log
   
   # Frontend logs
   cd Admin-plantasy
   npm run dev 2>&1 | tee frontend.log
   ```

---

**Remember**: Always restart BOTH servers after making changes to `.env` files!