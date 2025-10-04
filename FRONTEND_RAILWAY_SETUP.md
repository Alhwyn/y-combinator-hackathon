# 🎨 Frontend Railway Configuration

## Quick Summary

Your **dashboard** already auto-detects Railway! 🎉  
Your **browser extension** needs a one-line config update.

---

## Dashboard (Already Works!)

The live dashboard at `frontend/public/dashboard/index.html` is **already configured** to work with Railway automatically.

### How It Works

```javascript
// Line 308 in dashboard/index.html
const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const wsUrl = `${wsProtocol}//${window.location.host}/viewer`;
```

This means:

- **Local**: Connects to `ws://localhost:3001/viewer`
- **Railway**: Connects to `wss://your-app.railway.app/viewer`

**No changes needed!** ✅

---

## Browser Extension (One Change)

Update the default server URL in the extension after deploying to Railway.

### Step 1: Deploy to Railway

```bash
railway up
```

Copy your Railway URL (e.g., `https://yc-supabase-production.up.railway.app`)

### Step 2: Update Extension Config

Open `browser-extension/popup.js` and update line 17:

```javascript
// BEFORE (local):
document.getElementById("serverUrl").value = "http://localhost:3001";

// AFTER (Railway):
document.getElementById("serverUrl").value =
  "https://your-app-name.railway.app";
```

### Step 3: Reload Extension

1. Go to `chrome://extensions/`
2. Click the reload icon on your extension
3. Done! 🎉

---

## Alternative: Keep Both (Recommended)

You can also keep it dynamic and let users configure it:

### Option A: Smart Default

```javascript
// browser-extension/popup.js (line 14)
const settings = await chrome.storage.local.get([
  "apiKey",
  "serverUrl",
  "testGoal",
  "interval",
]);
if (settings.apiKey) document.getElementById("apiKey").value = settings.apiKey;

// Smart default - checks if Railway URL exists in storage
if (settings.serverUrl) {
  document.getElementById("serverUrl").value = settings.serverUrl;
} else {
  // Ask user which environment
  const isRailway = confirm(
    "Are you using Railway? Click OK for Railway, Cancel for local"
  );
  const defaultUrl = isRailway
    ? "https://your-app-name.railway.app" // Replace with your Railway URL
    : "http://localhost:3001";
  document.getElementById("serverUrl").value = defaultUrl;
}
```

### Option B: Environment Variables (Advanced)

Create `browser-extension/.env`:

```bash
# Local development
VITE_API_URL=http://localhost:3001

# Railway production (update after deployment)
# VITE_API_URL=https://your-app-name.railway.app
```

---

## Testing Your Setup

### 1. Test Local Connection

```bash
# Start local server
npm start

# Server should be running on http://localhost:3001
```

Open extension → Enter `http://localhost:3001` → Test should work

### 2. Test Railway Connection

```bash
# Make sure Railway is deployed
railway status
```

Get your Railway URL:

```bash
railway open
# Copy the URL from browser
```

Open extension → Enter Railway URL → Test should work

### 3. Verify WebSocket Connection

**Dashboard Method:**

1. Open `https://your-app.railway.app/dashboard/`
2. Check browser console (F12)
3. You should see:
   ```
   ✅ Connected to stream server
   📋 Received agent list: X agents
   ```

**Extension Method:**

1. Click extension icon
2. Start a test
3. Check extension console (right-click → Inspect popup)
4. You should see WebSocket messages

---

## Common Issues

### Issue: "Connection failed" in dashboard

**Solution:**

1. Check Railway logs: `railway logs`
2. Ensure `ENABLE_LIVE_STREAM=true` in Railway env vars
3. Verify WebSocket endpoint is running

### Issue: Extension can't connect

**Solution:**

1. Verify Railway URL is correct (no trailing slash)
2. Check HTTPS vs HTTP (Railway uses HTTPS)
3. Look for CORS errors in console

### Issue: Mixed content (HTTP/HTTPS)

**Railway uses HTTPS**, so make sure:

```javascript
// Extension should use HTTPS for Railway
https://your-app.railway.app  ✅
http://your-app.railway.app   ❌
```

---

## Quick Reference

### Local Development URLs

```
Dashboard:   http://localhost:3001/dashboard/
API:         http://localhost:3001/api/
WebSocket:   ws://localhost:3001/viewer
Health:      http://localhost:3001/health
```

### Railway Production URLs

```
Dashboard:   https://your-app.railway.app/dashboard/
API:         https://your-app.railway.app/api/
WebSocket:   wss://your-app.railway.app/viewer
Health:      https://your-app.railway.app/health
```

---

## Auto-Configuration Script

Want to make it even easier? Create a config file:

**frontend/config.js** (already created):

```javascript
const isLocalhost = window.location.hostname === "localhost";

const API_BASE_URL = isLocalhost
  ? "http://localhost:3001"
  : window.location.origin;

export const config = {
  api: {
    baseUrl: API_BASE_URL,
    agents: `${API_BASE_URL}/api/agents`,
    tests: `${API_BASE_URL}/api/tests`,
  },
  ws: {
    viewer: isLocalhost
      ? "ws://localhost:3001/viewer"
      : `wss://${window.location.host}/viewer`,
  },
};
```

Then in your extension:

```javascript
import { config } from "./config.js";

// Automatically uses correct URL
fetch(config.api.agents)
  .then((res) => res.json())
  .then((data) => console.log(data));
```

---

## Deployment Checklist

- [ ] Deploy backend to Railway (`railway up`)
- [ ] Copy Railway URL from dashboard
- [ ] Update `browser-extension/popup.js` with Railway URL
- [ ] Reload extension in Chrome
- [ ] Test connection from extension
- [ ] Test dashboard at `https://your-app.railway.app/dashboard/`
- [ ] Verify WebSocket connection (check console logs)
- [ ] Start test from extension → should work! 🎉

---

## Need Help?

1. Check Railway logs: `railway logs`
2. Check browser console (F12)
3. Verify environment variables in Railway dashboard
4. Make sure `ENABLE_LIVE_STREAM=true`

---

**Ready to deploy!** 🚀

Your dashboard will automatically work on Railway.  
Just update the extension's default URL and you're done!
