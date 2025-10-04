# ✅ Railway Setup Checklist for Live Streaming

## Current Status
- ✅ Code pushed to GitHub
- ✅ Dockerfile fixed (Sharp dependencies added)
- ⏳ Railway will auto-deploy (2-3 minutes)

---

## 📋 Steps to Complete Setup

### 1. Watch Railway Deployment

Go to: https://railway.app

Watch the deployment logs. You should now see:
```
✅ Building image...
✅ Installing dependencies... (this should work now!)
✅ Installing Playwright browsers...
✅ Deployment successful
```

### 2. Add Environment Variables

Once deployment succeeds, click on your service and go to **"Variables"** tab.

Add these 4 variables:

```env
ENABLE_LIVE_STREAM=true
LIVE_STREAM_PORT=3001
LIVE_STREAM_FPS=2
LIVE_STREAM_QUALITY=60
```

**Click "Deploy"** after adding variables.

### 3. Access Your Live Dashboard

After redeploy completes, visit:

```
https://multi-agent-testing-production.up.railway.app/dashboard
```

You should see:
- ✅ Beautiful dashboard loads
- ✅ 5 agent cards appear
- ✅ All showing "Online" status
- ✅ "Waiting for stream..." (video starts when tests run)

### 4. Test with Sample Tests

From your local machine:

```bash
npm run load:samples
```

Watch the dashboard - agents will start executing tests with live video! 🎬

---

## 🐛 If Deployment Still Fails

### Check Build Logs

Look for specific error messages. Common issues:

1. **"npm install failed"**
   - Fixed by our Dockerfile update (added build tools)
   
2. **"playwright install failed"**
   - Usually auto-fixes on retry
   
3. **"Out of memory"**
   - Reduce `CONCURRENT_AGENTS` to 3

### Solution: Trigger Manual Redeploy

In Railway:
1. Go to "Deployments" tab
2. Click the three dots menu
3. Click "Redeploy"

---

## 📊 What You'll Have

After setup:

- **Live Dashboard URL**: `https://multi-agent-testing-production.up.railway.app/dashboard`
- **5 Agents Running**: 24/7 in the cloud
- **Live Video Streaming**: 2 FPS WebSocket feeds
- **Public Access**: Anyone with the URL can watch
- **Real-time Testing**: See tests execute as they happen

---

## 🎥 Testing the Dashboard

### Expected Behavior:

1. **Dashboard loads** - Beautiful dark UI with stats at top
2. **Agents connect** - 5 agent cards show "Online" 
3. **Load tests** - Run `npm run load:samples` locally
4. **Video starts** - Live browser screenshots appear (2 FPS)
5. **Test completes** - Agent goes back to "Idle"

### What Each Agent Shows:

- **Agent Name** - e.g., "agent-d3e76826"
- **Status Badge** - Green dot = Online, Red = Offline
- **Video Feed** - Live browser activity (only when running tests)
- **Test ID** - Current test being executed

---

## 💰 Railway Costs

Your current setup:
- **5 agents** at 2 FPS
- **~$5-10/month** on Railway Hobby plan
- **Very low bandwidth** (2 FPS = ~5 KB/s per agent)

To reduce costs:
- Lower `CONCURRENT_AGENTS` to 3
- Reduce `LIVE_STREAM_FPS` to 1

---

## 🚀 Next Steps

Once dashboard is working:

1. **Share the URL** with your team/investors
2. **Create custom tests** using `src/utils/testHelpers.js`
3. **Monitor in Supabase** - View results and screenshots
4. **Scale up** - Add more agents if needed

---

## 📞 Quick Commands Reference

```bash
# Watch Railway logs
railway logs -f

# Load sample tests
npm run load:samples

# Check Supabase for results
# Go to: https://your-project.supabase.co
# Table: test_results

# View screenshots
# Storage: test-screenshots bucket
```

---

## ✅ Success Checklist

- [ ] Railway deployment successful
- [ ] Environment variables added
- [ ] Dashboard loads at `/dashboard`
- [ ] Agents show as "Online"
- [ ] Sample tests loaded
- [ ] Live video appears during test
- [ ] Tests complete successfully

**Once all checked, you're done! 🎉**

---

## 🆘 Need Help?

If still having issues:

1. Check Railway build logs for specific errors
2. Verify all environment variables are set
3. Make sure Supabase credentials are correct
4. Try redeploying manually

The Dockerfile fix should resolve the build issues!

