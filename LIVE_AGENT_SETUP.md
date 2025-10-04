# 🎬 Live Agent Setup - Quick Start

Watch your AI agents work in real-time with live video streaming!

## ✅ What You Just Set Up

1. **Video Stream Server** ✅ (Running on port 3001)
2. **Live Dashboard** ✅ (http://localhost:3001/dashboard)
3. **Agent Live Streaming** ✅ (Updated agent code)

---

## 🚀 How to Start Live Agents

### Step 1: Make Sure Stream Server is Running

In Terminal 1 (already running):

```bash
npm run stream:server
```

You should see:

```
✅ Video stream server started on port 3001
📊 Dashboard: http://localhost:3001/dashboard
```

### Step 2: Open the Dashboard

In your browser, go to:

```
http://localhost:3001/dashboard
```

You'll see the dashboard waiting for agents to connect.

### Step 3: Start Agents with Live Streaming

Open a **new terminal** (Terminal 2) and run:

```bash
# Start a single agent with live streaming
ENABLE_LIVE_STREAM=true HEADLESS=true npm run agent
```

**Or start multiple agents:**

```bash
# Start 3 agents with live streaming
ENABLE_LIVE_STREAM=true CONCURRENT_AGENTS=3 npm start
```

### Step 4: Load Tests

Open **another terminal** (Terminal 3) and load some tests:

```bash
npm run load:samples
```

---

## 🎥 What You'll See

### In the Dashboard:

1. **Agent cards appear** when agents connect
2. **Live video feed** showing the browser (2 FPS)
3. **Test status** showing which test is running
4. **Real-time stats** (active agents, running tests, FPS)

### In the Terminal:

```
[info]: Initializing agent: agent-a1b2c3d4
[info]: Browser launched: chromium
[info]: 📡 Live streaming enabled for agent-a1b2c3d4
[info]: Agent agent-a1b2c3d4 started, polling for tests...
[info]: Executing test: 16291c06-82d4-4e72-919c-a19a01bd4322
```

---

## ⚙️ Configuration Options

Create or update your `.env` file:

```env
# Enable live streaming
ENABLE_LIVE_STREAM=true

# Streaming quality (1-100, lower = faster)
LIVE_STREAM_QUALITY=60

# Frames per second (1-10, lower = less CPU)
LIVE_STREAM_FPS=2

# Stream server port
LIVE_STREAM_PORT=3001

# Agent settings
CONCURRENT_AGENTS=3
HEADLESS=true
```

---

## 📊 Performance Tips

| FPS | Quality | CPU Impact | Bandwidth | Best For      |
| --- | ------- | ---------- | --------- | ------------- |
| 1   | 40      | Very Low   | ~3 KB/s   | Many agents   |
| 2   | 60      | Low        | ~5 KB/s   | Recommended   |
| 5   | 80      | Medium     | ~15 KB/s  | Demo/watching |
| 10  | 100     | High       | ~30 KB/s  | Debug only    |

**Recommendation:** Use FPS=2, Quality=60 for production

---

## 🎯 Common Commands

```bash
# Terminal 1: Stream server
npm run stream:server

# Terminal 2: Single agent with live stream
ENABLE_LIVE_STREAM=true npm run agent

# Terminal 3: Multiple agents with live stream
ENABLE_LIVE_STREAM=true CONCURRENT_AGENTS=5 npm start

# Terminal 4: Load tests
npm run load:samples

# Watch in browser
open http://localhost:3001/dashboard
```

---

## 🐛 Troubleshooting

### "No agents showing in dashboard"

1. Check stream server is running (Terminal 1)
2. Make sure you set `ENABLE_LIVE_STREAM=true`
3. Check agents are connecting:
   ```bash
   # You should see this in agent logs:
   [info]: 📡 Live streaming enabled for agent-xxxxx
   ```

### "Agent connected but no video"

- Video only appears **when a test is running**
- Agents stay idle until you load tests: `npm run load:samples`

### "Dashboard shows 'Waiting for stream...'"

- This is normal when agent is idle
- Video starts when agent claims a test

### "Connection failed"

- Make sure stream server is on port 3001
- Check firewall isn't blocking WebSocket connections
- Try refreshing the dashboard page

---

## 🎬 Testing the Full System

### Quick Test (2 minutes):

```bash
# Terminal 1
npm run stream:server

# Terminal 2
ENABLE_LIVE_STREAM=true npm run agent

# Terminal 3
npm run load:samples

# Browser
open http://localhost:3001/dashboard
```

You should see:

1. ✅ Agent appears in dashboard
2. ✅ Test starts running
3. ✅ Live video shows browser activity
4. ✅ Test completes (~10-30 seconds)

---

## 📸 What You're Seeing

The dashboard shows:

- **Live browser screenshots** captured at 2 FPS
- **Test progress** as agents execute actions
- **Real-time status** for each agent
- **Performance metrics** (FPS, active agents)

This is **actual browser activity** from your Playwright agents!

---

## 🚀 Next Steps

### For Local Development:

- ✅ You're all set! Use the commands above

### For Production/Railway:

- ⚠️ Live streaming requires WebSocket support
- Railway may not support WebSockets reliably
- Consider using Fly.io or deploying stream server separately
- Or just use Supabase monitoring (logs, screenshots, results)

### Alternative: View in Supabase

Without live streaming, you can still:

- Check **test results** in Supabase dashboard
- View **screenshots** in Supabase Storage
- Monitor **agent status** in real-time
- Read **Railway logs** for test execution

---

## 🎉 Success!

You now have:

- ✅ Live video dashboard
- ✅ Real-time agent monitoring
- ✅ Visual test execution
- ✅ Professional QA testing system

**Watch your agents work! 🎬**
