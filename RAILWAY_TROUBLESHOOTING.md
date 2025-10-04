# 🔧 Railway 502 Error - Troubleshooting Guide

## Problem: Application failed to respond (502)

Your Railway deployment at `multi-agent-testing-production.up.railway.app` is returning a 502 error.

---

## 🔍 Issues Found

### 1. **Dockerfile vs package.json Mismatch**

**Problem:**

```dockerfile
# Dockerfile line 61
CMD ["node", "src/index.js"]

# But package.json says:
"start": "node src/startWithStream.js"
```

Railway runs `npm start`, which tries to run `startWithStream.js`, but your Dockerfile references `index.js`.

**Fix:** Update Dockerfile line 61:

```dockerfile
CMD ["npm", "start"]
```

### 2. **Port Configuration Issues**

**Problem:**

- Dockerfile exposes ports 3000 and 3001
- Health check checks port 3000
- But your app likely runs on port 3001

**Fix:** Update ports to use Railway's `PORT` environment variable

### 3. **Missing Environment Variables**

Railway needs these environment variables set:

```bash
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
CONCURRENT_AGENTS=5
HEADLESS=true
AI_MODE=true
ENABLE_LIVE_STREAM=true
PORT=3001
```

---

## ✅ Quick Fixes

### Fix 1: Update Dockerfile

Replace your Dockerfile with this:

```dockerfile
# Multi-Agent Browser Testing System - Production Dockerfile

FROM node:18-slim

# Install system dependencies
RUN apt-get update && \
    apt-get install -y \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
    libcups2 libdrm2 libdbus-1-3 libxkbcommon0 \
    libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
    libgbm1 libasound2 libpango-1.0-0 libcairo2 \
    python3 build-essential g++ make wget ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev --no-audit --no-fund

# Install Playwright browsers
RUN npx playwright install chromium --with-deps

# Copy application code
COPY . .

# Create directories
RUN mkdir -p logs screenshots videos

# Expose port (Railway will set PORT env var)
EXPOSE ${PORT:-3001}

# Health check - use Railway's PORT
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 3001) + '/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application - use npm start
CMD ["npm", "start"]
```

### Fix 2: Update src/server/videoStream.js

Make sure it uses Railway's PORT:

```javascript
const PORT = process.env.PORT || 3001;

this.httpServer.listen(PORT, () => {
  logger.info(`🚀 Video Stream Server running on port ${PORT}`);
  logger.info(`📊 Dashboard: http://localhost:${PORT}/dashboard/`);
});
```

### Fix 3: Create railway.json

Create a `railway.json` file in your project root:

```json
{
  "build": {
    "builder": "dockerfile"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3
  }
}
```

---

## 🚀 Deployment Steps

### 1. Check Current Railway Configuration

```bash
# Check if you have Railway CLI
railway --version

# If not installed:
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link
```

### 2. Set Environment Variables

```bash
# Set all required variables in Railway dashboard or via CLI:
railway variables set ANTHROPIC_API_KEY=sk-ant-your-key
railway variables set SUPABASE_URL=https://your-project.supabase.co
railway variables set SUPABASE_ANON_KEY=your-anon-key
railway variables set SUPABASE_SERVICE_KEY=your-service-key
railway variables set CONCURRENT_AGENTS=5
railway variables set HEADLESS=true
railway variables set AI_MODE=true
railway variables set ENABLE_LIVE_STREAM=true
railway variables set PORT=3001
```

### 3. Redeploy

```bash
# Commit your changes
git add Dockerfile railway.json src/server/videoStream.js
git commit -m "Fix Railway deployment configuration"

# Deploy
railway up
```

### 4. Check Logs

```bash
# Watch logs in real-time
railway logs
```

---

## 📊 Verification Checklist

After redeploying, check:

- [ ] Health endpoint: `curl https://multi-agent-testing-production.up.railway.app/health`
- [ ] Should return: `{"status": "ok", "timestamp": "...", "agents": ...}`
- [ ] Check logs: `railway logs`
- [ ] Look for: `🚀 Video Stream Server running on port 3001`
- [ ] Dashboard: `https://multi-agent-testing-production.up.railway.app/dashboard/`
- [ ] API: `https://multi-agent-testing-production.up.railway.app/api/agents`

---

## 🔍 Debugging Commands

### Check Railway Status

```bash
railway status
```

### View Environment Variables

```bash
railway variables
```

### Check Build Logs

```bash
railway logs --build
```

### Check Runtime Logs

```bash
railway logs --tail
```

### SSH into Container (if needed)

```bash
railway run bash
```

---

## Common Issues & Solutions

### Issue 1: "Module not found"

**Cause:** Missing dependencies or wrong Node version  
**Solution:**

```bash
# Check package.json engines
"engines": {
  "node": ">=18.0.0"
}

# Rebuild on Railway
railway run npm install
```

### Issue 2: "Port already in use"

**Cause:** Hard-coded port instead of using Railway's PORT  
**Solution:** Always use `process.env.PORT || 3001`

### Issue 3: "Playwright browser not found"

**Cause:** Browsers not installed properly  
**Solution:** Make sure Dockerfile has:

```dockerfile
RUN npx playwright install chromium --with-deps
```

### Issue 4: "Health check failed"

**Cause:** Health endpoint not responding  
**Solution:** Check that:

- Server is listening on correct port
- `/health` endpoint exists
- Health check uses correct port

### Issue 5: "502 Bad Gateway"

**Cause:** Application crashed or not starting  
**Solution:**

1. Check logs: `railway logs`
2. Look for startup errors
3. Verify environment variables
4. Test locally first: `npm start`

---

## 🧪 Local Testing Before Railway

Always test locally first:

```bash
# Set environment variables
export ANTHROPIC_API_KEY=sk-ant-...
export SUPABASE_URL=https://...
export SUPABASE_ANON_KEY=...
export SUPABASE_SERVICE_KEY=...
export HEADLESS=true
export PORT=3001

# Start server
npm start

# Test health endpoint
curl http://localhost:3001/health

# Should return: {"status":"ok",...}
```

---

## 📝 Expected Log Output

When working correctly, you should see:

```
🚀 Starting Multi-Agent System with Video Streaming...
🚀 Video Stream Server running on port 3001
📊 Dashboard: http://localhost:3001/dashboard/
Starting agent orchestration...
Spawning 5 agents in AI agent mode...
Agent 1 spawned (PID: 12345) - AI agent mode
Agent 2 spawned (PID: 12346) - AI agent mode
...
All 5 agents spawned successfully in AI agent mode
```

---

## 🆘 Still Not Working?

If you're still having issues:

1. **Share Railway logs:**

   ```bash
   railway logs > logs.txt
   ```

2. **Check environment variables:**

   ```bash
   railway variables
   ```

3. **Verify Dockerfile builds locally:**

   ```bash
   docker build -t test-app .
   docker run -p 3001:3001 --env-file .env test-app
   ```

4. **Check Railway service health:**
   ```bash
   railway status
   ```

---

## 🎯 Next Steps After Fix

Once deployed successfully:

1. ✅ Test health endpoint
2. ✅ Open dashboard
3. ✅ Update browser extension with Railway URL
4. ✅ Run a test from extension
5. ✅ Monitor costs in Anthropic console

---

**Need more help?** Share your Railway logs and I can provide more specific guidance!
