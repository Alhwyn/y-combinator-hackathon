# 🎬 Enable Live Streaming on Railway

## Quick Setup (5 minutes)

### Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Add live video streaming support"
git push origin main
```

Railway will automatically detect and redeploy.

### Step 2: Update Railway Environment Variables

Go to your Railway dashboard: https://railway.app

1. Click on your `multi-agent-testing-production` service
2. Go to **"Variables"** tab
3. Add these new variables:

```env
ENABLE_LIVE_STREAM=true
LIVE_STREAM_PORT=3001
LIVE_STREAM_FPS=2
LIVE_STREAM_QUALITY=60
```

4. Click **"Deploy"** or wait for auto-deploy

### Step 3: Access the Dashboard

Once deployed, open:
```
https://multi-agent-testing-production.up.railway.app/dashboard
```

You should see your agents with live video! 🎉

---

## 🔧 Optional: Run Agents + Stream Server Together

If you want everything in one service (agents + video server):

### Update Railway Start Command

1. Go to Railway dashboard
2. Click on your service
3. Go to **"Settings"** → **"Deploy"**
4. Set **"Custom Start Command"** to:
   ```
   npm run start:with-stream
   ```
5. Save and redeploy

This will start both the video stream server AND the agents in the same Railway service.

---

## 📊 What You'll See

After deployment:

1. **Navigate to:** `https://multi-agent-testing-production.up.railway.app/dashboard`
2. **See:** All 5 agents connected
3. **Load tests:** `npm run load:samples` from your local machine
4. **Watch:** Live video of agents executing tests!

---

## 🐛 Troubleshooting

### "Agents not showing video"

Check Railway logs:
```
# You should see:
[info]: 📡 Live streaming enabled for agent-xxxxx
```

If not, verify environment variables are set.

### "Dashboard not loading"

Make sure Railway deployed successfully:
1. Check deployment logs in Railway
2. Verify no errors during build
3. Check that port 3001 is accessible

### "WebSocket connection failed"

Railway should support WebSockets by default. If issues:
1. Check Railway doesn't have WebSocket restrictions
2. Try redeploying
3. Check browser console for errors

---

## 🚀 Success Indicators

✅ Dashboard loads at `/dashboard`
✅ Agents appear as "Online"
✅ Live video appears when tests run
✅ FPS counter updates
✅ Test status shows in real-time

---

## 💡 Performance Notes

For Railway's free/hobby tier:
- Use FPS=2 (not higher)
- Quality=60 is optimal
- Don't run more than 5 agents simultaneously

For Railway Pro:
- Can handle FPS=5
- Up to 10 agents
- Higher quality streams

---

## 🎉 You're Done!

Your Railway deployment now has:
- ✅ Live video dashboard
- ✅ Real-time agent monitoring  
- ✅ Public URL to share with team
- ✅ Professional QA testing platform

Share your dashboard URL with stakeholders! 🚀

