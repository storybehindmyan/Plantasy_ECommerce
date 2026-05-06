# Production Readiness Checklist - Delhivery Pickup Request

## ✅ Pre-Production Verification

### 1. Environment Configuration

**Check your `.env` files:**

**Root `.env`:**
```env
USE_MOCK_DELIVERY=false   # Must be false for production
DELHIVERY_API_KEY="15694a64eef55de1784b9702859938f0d264748f"  # Your real API key
DELHIVERY_PICKUP_URL=https://track.delhivery.com/fm/request/new/
DELHIVERY_PICKUP_TIME=18:00:00
WAREHOUSE_NAME=Plantasy  # Must match your Delhivery warehouse name
```

**Frontend `Admin-plantasy/.env`:**
```env
VITE_USE_MOCK_DELIVERY=false  # Must be false for production
VITE_DELHIVERY_API_KEY=15694a64eef55de1784b9702859938f0d264748f
VITE_DELHIVERY_PICKUP_URL=https://track.delhivery.com/fm/request/new/
VITE_DELHIVERY_PICKUP_TIME=18:00:00
VITE_WAREHOUSE_NAME=Plantasy
```

### 2. API Key Verification

**Steps to verify your Delhivery API key:**

1. **Check API Key Format:**
   - Should be a 40-character hexadecimal string
   - Example: `15694a64eef55de1784b9702859938f0d264748f`

2. **Test API Key in Browser Console:**
   ```javascript
   // Open browser console (F12) and run:
   const apiKey = "15694a64eef55de1784b9702859938f0d264748f";
   console.log("API Key Length:", apiKey.length);
   console.log("API Key Format Valid:", /^[a-f0-9]{40}$/.test(apiKey));
   ```

3. **Verify API Key Permissions:**
   - Log into Delhivery dashboard
   - Check that your API key has "Pickup Request" permissions
   - Ensure the key is active and not expired

### 3. Warehouse Configuration

**Verify warehouse name matches Delhivery:**

1. **Check Delhivery Dashboard:**
   - Log into your Delhivery account
   - Go to Settings → Warehouse
   - Note the exact warehouse name (case-sensitive)

2. **Update `.env` files:**
   ```env
   WAREHOUSE_NAME=YourExactWarehouseName
   ```

3. **Common Issues:**
   - Warehouse name mismatch (case-sensitive)
   - Warehouse not activated in Delhivery
   - Warehouse name has spaces or special characters

### 4. Pickup Time Configuration

**Set appropriate pickup time:**

```env
DELHIVERY_PICKUP_TIME=18:00:00  # 6:00 PM in 24-hour format
```

**Valid formats:**
- `09:00:00` (9:00 AM)
- `14:30:00` (2:30 PM)
- `18:00:00` (6:00 PM)

**Note:** Pickup time should be during Delhivery's operational hours (typically 9 AM - 6 PM)

## 🧪 Testing in Production Mode

### 1. Enable Production Mode

**Set in both `.env` files:**
```env
VITE_USE_MOCK_DELIVERY=false
```

### 2. Restart Development Server

```bash
# Stop current server (Ctrl+C)
cd Admin-plantasy
npm run dev
```

### 3. Test Pickup Request

1. **Open browser console** (F12)
2. **Navigate to Orders page**
3. **Change order status** from "pending" to "confirmed"
4. **Watch console logs** for detailed output

### 4. Expected Console Output

**✅ Success:**
```
🔧 Delhivery Config: {
  USE_MOCK_DELIVERY: false,
  hasApiKey: true,
  apiKeyPrefix: "15694a64...",
  pickupUrl: "https://track.delhivery.com/fm/request/new/",
  pickupTime: "18:00:00",
  pickupLocation: "Plantasy"
}
🚀 Creating REAL Delhivery pickup request for order: OD000123
📦 Pickup Request Details: {...}
📥 Delhivery API Response Status: 200 OK
✅ Delhivery pickup created successfully (new endpoint): {...}
```

**❌ Common Errors:**

**Error 1: Mock Mode Still Active**
```
✅ Using mock pickup creation (new endpoint) for order: OD000123
```
**Fix:** Set `VITE_USE_MOCK_DELIVERY=false` and restart server

**Error 2: API Key Missing**
```
🔧 Delhivery Config: {
  hasApiKey: false,
  ...
}
```
**Fix:** Add `VITE_DELHIVERY_API_KEY` to `.env` file

**Error 3: Network Error**
```
❌ Error creating pickup request (new endpoint): TypeError: Failed to fetch
```
**Fix:** Check internet connection, verify API URL

**Error 4: Authentication Failed (401)**
```
📥 Delhivery API Response Status: 401 Unauthorized
❌ Delhivery pickup error (new endpoint): 401 Invalid API key
```
**Fix:** Verify API key is correct and has proper permissions

**Error 5: Bad Request (400)**
```
📥 Delhivery API Response Status: 400 Bad Request
❌ Delhivery pickup error (new endpoint): 400 Invalid warehouse name
```
**Fix:** Check warehouse name matches exactly with Delhivery dashboard

## 🚀 Production Deployment

### 1. Build for Production

```bash
cd Admin-plantasy
npm run build
```

### 2. Deploy to Production Server

- Upload built files to your hosting
- Ensure `.env` variables are set correctly on production server
- Restart the application

### 3. Verify Production Deployment

1. **Access production URL:** `https://plantasy.co.in`
2. **Test pickup request** on a real order
3. **Check browser console** for any errors
4. **Verify pickup request** in Delhivery dashboard

## 📊 Monitoring and Debugging

### 1. Enable Detailed Logging

The updated `DelhiveryService` includes comprehensive logging:
- Configuration details
- Request/response data
- Error messages with details

### 2. Check Browser Console

All pickup request attempts will show:
- Configuration status
- API call details
- Success/failure status
- Error messages

### 3. Monitor Delhivery Dashboard

- Check if pickup requests appear in your Delhivery account
- Verify pickup dates and times
- Monitor pickup status

## 🔧 Troubleshooting Guide

### Issue: Pickup request works in mock mode but fails in production

**Checklist:**
- [ ] `VITE_USE_MOCK_DELIVERY=false` in `.env`
- [ ] `VITE_DELHIVERY_API_KEY` is set correctly
- [ ] API key is valid and has pickup permissions
- [ ] Warehouse name matches exactly
- [ ] Internet connection is stable
- [ ] Delhivery API is operational

### Issue: Getting 401 Unauthorized

**Solutions:**
1. Verify API key is correct (40-character hex string)
2. Check API key hasn't expired
3. Ensure API key has "Pickup Request" permission
4. Try regenerating API key in Delhivery dashboard

### Issue: Getting 400 Bad Request

**Solutions:**
1. Check warehouse name matches exactly (case-sensitive)
2. Verify pickup date format is `YYYY-MM-DD`
3. Verify pickup time format is `HH:MM:SS`
4. Ensure `expected_package_count` is a positive integer

### Issue: Network Error / Failed to Fetch

**Solutions:**
1. Check internet connection
2. Verify `DELHIVERY_PICKUP_URL` is correct
3. Check if Delhivery API is down
4. Try from different network/browser

## 📋 Final Checklist Before Going Live

- [ ] `USE_MOCK_DELIVERY=false` in all `.env` files
- [ ] Delhivery API key is valid and tested
- [ ] Warehouse name matches Delhivery dashboard exactly
- [ ] Pickup time is set to appropriate hour
- [ ] Application is rebuilt after `.env` changes
- [ ] Tested pickup request in development with mock=false
- [ ] Production deployment is complete
- [ ] Monitoring is set up for pickup requests
- [ ] Error handling is in place
- [ ] Team is trained on the new system

## 🆘 Emergency Rollback

If production issues occur:

1. **Quick Rollback:**
   ```env
   VITE_USE_MOCK_DELIVERY=true
   ```
   This will revert to mock mode immediately

2. **Restart frontend:**
   ```bash
   npm run dev  # or rebuild and redeploy
   ```

3. **Investigate logs** to identify the issue

4. **Fix the issue** and test again

5. **Deploy again** with `VITE_USE_MOCK_DELIVERY=false`

## 📞 Support Resources

- **Delhivery API Documentation:** Check Delhivery's official docs
- **Console Logs:** Browser console shows detailed debugging info
- **Delhivery Dashboard:** Monitor pickup requests and status
- **Error Messages:** The updated service provides clear error messages

## ✅ Success Indicators

You'll know it's working when:

1. Console shows: `🚀 Creating REAL Delhivery pickup request`
2. Console shows: `✅ Delhivery pickup created successfully`
3. Pickup request appears in Delhivery dashboard
4. Tracking URL is generated and saved
5. No errors in browser console

---

**Remember:** Always test thoroughly in development with `VITE_USE_MOCK_DELIVERY=false` before deploying to production!

**Need help?** Check the console logs - they now include detailed debugging information for every step of the process.