# 🚀 Complete Frontend + Backend Setup & Testing

## Overview

Your system has two parts:

1. **Backend** - Agents running on Railway (already deployed)
2. **Frontend** - Live dashboard showing video feeds

Let's test everything end-to-end!

---

## ✅ Step 1: Verify Backend (Railway Agents)

### Check Railway Deployment

1. Go to https://railway.app
2. Check your service status: Should show **"Active"**
3. Click **"View Logs"** - Look for:

```
[info]: Starting Multi-Agent Browser Testing System...
[info]: Configuration: 5 agents, chromium browser
[info]: Spawning 5 agents...
[info]: All 5 agents spawned successfully
```

### Check Supabase Database

1. Go to your Supabase dashboard
2. Navigate to **Table Editor** → **agents** table
3. You should see **5 agents** with:
   - `status: 'idle'` or `'busy'`
   - `last_heartbeat`: Recent timestamp
   - `browser_type: 'chromium'`

✅ **Backend is working if you see 5 active agents!**

---

## ✅ Step 2: Enable Live Streaming (Frontend)

### Add Environment Variables to Railway

1. **Railway Dashboard** → Your Service → **"Variables"**
2. Add these **4 variables**:

```env
ENABLE_LIVE_STREAM=true
LIVE_STREAM_PORT=3001
LIVE_STREAM_FPS=2
LIVE_STREAM_QUALITY=60
```

3. Click **"Deploy"** or wait for auto-deploy
4. Wait 1-2 minutes for redeploy

### Verify Stream Server Started

Check Railway logs for:

```
[info]: ✅ Video stream server started on port 3001
[info]: 📊 Dashboard: http://localhost:3001/dashboard
```

✅ **Frontend is ready if you see these logs!**

---

## ✅ Step 3: Test Frontend Dashboard

### Open Dashboard

Visit: https://multi-agent-testing-production.up.railway.app/dashboard

### What You Should See:

```
🎬 Agent Live Dashboard
Watch your AI agents perform QA testing in real-time

[Stats]
Active Agents: 5 | Running Tests: 0 | Stream FPS: 0

[5 Agent Cards showing]
- agent-d3e76826 [Online] [Waiting for stream...] Test: Idle
- agent-1fc0a5d6 [Online] [Waiting for stream...] Test: Idle
- agent-a507e18c [Online] [Waiting for stream...] Test: Idle
- agent-03cf2b4d [Online] [Waiting for stream...] Test: Idle
- agent-xxxxx    [Online] [Waiting for stream...] Test: Idle
```

✅ **Frontend is working if you see 5 online agents!**

---

## ✅ Step 4: Test Complete System (Backend + Frontend)

Now let's run tests and watch them execute live!

### Option A: Using the Test Script

```bash
cd /Users/alhwyngeonzon/Programming/yc-supabase
./test-railway-agents.sh
```

### Option B: Manual Testing

```bash
# Load sample tests
npm run load:samples
```

### What Happens:

1. **In Supabase** (backend):

   - `test_cases` table: 4 tests added with `status='pending'`
   - Agents claim tests: `status` changes to `'running'`
   - Tests complete: `status` changes to `'completed'`

2. **In Dashboard** (frontend):

   - **Stats update**: "Running Tests: 1" (or more)
   - **Agent picks test**: Test ID appears (e.g., "16291c06...")
   - **🎬 VIDEO APPEARS**: Live browser screenshots at 2 FPS!
   - **Agent completes**: Goes back to "Idle"

3. **What You'll See in Video**:
   - Browser navigating to websites
   - Pages loading
   - Elements being interacted with
   - All in real-time!

✅ **System is fully working when you see live video!**

---

## 🧪 Full Test Sequence

### Terminal Window 1: Load Tests and Watch

```bash
# Go to project directory
cd /Users/alhwyngeonzon/Programming/yc-supabase

# Load 4 sample tests
npm run load:samples

# Wait 5 seconds, then load more
sleep 5 && npm run load:samples

# Keep loading tests for continuous demo
for i in {1..5}; do
  npm run load:samples
  sleep 10
done
```

### Browser: Watch Dashboard

Keep https://multi-agent-testing-production.up.railway.app/dashboard open

Watch for:

- Stats changing (Running Tests goes up/down)
- Agents claiming tests
- Video feeds appearing
- FPS counter updating

### Terminal Window 2: Monitor Logs (Optional)

```bash
# Watch Railway logs live
railway logs -f

# Or check Supabase realtime
# Go to: Supabase → Table Editor → test_results
# Enable real-time updates
```

---

## 📊 Complete Testing Checklist

### Backend (Agents)

- [ ] Railway deployment shows "Active"
- [ ] Railway logs show agents spawned
- [ ] Supabase shows 5 agents in `agents` table
- [ ] Agents have recent `last_heartbeat`
- [ ] Agent `status` is 'idle' or 'busy'

### Frontend (Dashboard)

- [ ] Dashboard URL loads successfully
- [ ] 5 agent cards visible
- [ ] All agents show "Online" status
- [ ] Stats displayed at top (0/0/0 initially)
- [ ] WebSocket connection established

### Integration (Backend + Frontend)

- [ ] Loaded tests appear in Supabase
- [ ] Agents claim tests (status changes)
- [ ] Dashboard shows test IDs
- [ ] **Live video appears during test execution**
- [ ] FPS counter shows "2"
- [ ] Tests complete successfully
- [ ] Screenshots saved to Supabase Storage
- [ ] Results recorded in `test_results` table

---

## 🔧 Common Issues & Fixes

### Issue: "Dashboard not loading"

**Check:**

```bash
# Verify Railway deployment
railway status

# Check if port 3001 is exposed
# Look in Railway logs for:
[info]: ✅ Video stream server started on port 3001
```

**Fix:**

- Redeploy Railway service
- Check environment variables are set
- Clear browser cache

---

### Issue: "Agents not appearing in dashboard"

**Check:**

```bash
# Verify environment variable
echo $ENABLE_LIVE_STREAM  # Should be "true"

# Check Railway environment variables
# Go to Railway → Variables → Verify ENABLE_LIVE_STREAM=true
```

**Fix:**
Add `ENABLE_LIVE_STREAM=true` to Railway variables and redeploy

---

### Issue: "No video appearing"

**Cause:** Agents are idle (not running tests)

**Fix:**

```bash
# Load tests!
npm run load:samples
```

Video **only appears when tests are running**. This is normal behavior.

---

### Issue: "Video is choppy or slow"

**Adjust quality:**

In Railway variables, change:

```env
LIVE_STREAM_FPS=1          # Lower FPS
LIVE_STREAM_QUALITY=40     # Lower quality
```

Trade-off: Lower values = less CPU/bandwidth, but less smooth video

---

## 🎯 Quick Test Commands

```bash
# Quick backend test (30 seconds)
npm run test:backend

# Load sample tests
npm run load:samples

# Load 10 tests for extended demo
for i in {1..10}; do npm run load:samples; sleep 5; done

# Create a custom test
node -e "
import('./src/utils/testHelpers.js').then(({ createTestCase }) => {
  createTestCase({
    name: 'Custom Test',
    url: 'https://playwright.dev',
    actions: [
      { type: 'navigate', target: 'https://playwright.dev' },
      { type: 'wait', selector: 'h1', timeout: 5000 },
      { type: 'click', selector: 'a[href=\"/docs/intro\"]' },
      { type: 'wait', selector: '.markdown', timeout: 5000 }
    ],
    priority: 10
  });
});
"

# Watch live logs
railway logs -f
```

---

## 📊 Performance Monitoring

### Check System Health

**Railway Metrics:**

- Go to Railway → Metrics tab
- Monitor: CPU, Memory, Network

**Supabase Monitoring:**

- Go to Supabase → Database → Usage
- Monitor: Connections, Queries

**Dashboard Stats:**

- Active Agents (should be 5)
- Running Tests (0-5 depending on load)
- FPS (should be ~2 when tests running)

---

## 🎬 Demo Script for Stakeholders

**1. Show Dashboard** (30 seconds)

```
Open: https://multi-agent-testing-production.up.railway.app/dashboard
Point out: 5 agents online, beautiful UI, real-time stats
```

**2. Load Tests** (10 seconds)

```bash
npm run load:samples
```

**3. Watch Magic** (60 seconds)

```
Show: Agents picking up tests
Show: Live video appearing
Show: Tests completing
Show: Stats updating in real-time
```

**4. Show Results** (30 seconds)

```
Supabase → test_results: Show completed tests
Supabase → Storage: Show screenshots
```

**Total Demo Time: ~2.5 minutes** 🚀

---

## ✅ Success Indicators

**You know everything is working when:**

1. ✅ Dashboard loads and shows 5 agents
2. ✅ Agents show "Online" status
3. ✅ Run `npm run load:samples`
4. ✅ Agent cards show test IDs
5. ✅ **Live video feeds appear**
6. ✅ FPS counter updates to ~2
7. ✅ Tests complete and agents go idle
8. ✅ Results appear in Supabase

**If all 8 are true: System is 100% operational! 🎉**

---

## 📞 Quick Links

- **Dashboard**: https://multi-agent-testing-production.up.railway.app/dashboard
- **Railway**: https://railway.app
- **Supabase**: https://supabase.com/dashboard
- **GitHub Repo**: https://github.com/Alhwyn/y-combinator-hackathon

---

## 🚀 What You've Built

A complete **AI-powered QA testing platform** with:

- ✅ 5 parallel browser agents (Railway)
- ✅ Live video streaming dashboard
- ✅ Real-time test orchestration
- ✅ Screenshot capture & storage
- ✅ Automatic retries & error handling
- ✅ Supabase backend integration
- ✅ WebSocket live updates
- ✅ Production-ready deployment

**This is YC Demo Day ready! 🎉**
