# Working Video Demo Guide

## 🎥 See Video Stream Working NOW!

The video WebSocket stream is already working in the old dashboard! Here's how to use it:

### Step 1: Open the Working Dashboard

Open this URL in your browser:

```
https://replication.ngrok.io/dashboard/
```

**Or locally:**

```
http://localhost:3001/dashboard/
```

### Step 2: Spawn Agents with Video

1. Fill in the form:

   - **Test Prompt**: "Play Wordle and try to win"
   - **Target URL**: https://www.nytimes.com/games/wordle
   - **Number of Agents**: 2

2. Click **🚀 Spawn Agents**

3. **WATCH THE MAGIC** 🎬
   - You'll see live video feeds appear
   - Each agent shows their browser in real-time
   - FPS counter shows stream speed
   - Active agent count updates

### What You'll See

```
┌─────────────────────────────────┐
│  🎬 Agent Live Dashboard        │
├─────────────────────────────────┤
│ ✅ Connected to stream server   │
├─────────────────────────────────┤
│ Active Agents: 2  Running: 2    │
│ Stream FPS: 4                   │
├─────────────────────────────────┤
│ ┌─────────────┐ ┌─────────────┐ │
│ │ agent-abc   │ │ agent-def   │ │
│ │ [VIDEO]     │ │ [VIDEO]     │ │
│ │  LIVE       │ │  LIVE       │ │
│ └─────────────┘ └─────────────┘ │
└─────────────────────────────────┘
```

### Current Status

✅ **What Works:**

- ✅ WebSocket connection to `wss://replication.ngrok.io/viewer`
- ✅ Live video streaming from agents
- ✅ Multiple agents at once
- ✅ Real-time FPS counter
- ✅ Agent status indicators
- ✅ Stop/Spawn controls

⚠️ **What Needs Fix (React Frontend):**

- ⚠️ API endpoint mismatch (FIXED in latest code)
- ⚠️ Agent WebSocket connection through ngrok (502 errors)
- ⚠️ Rate limiting on Anthropic API (FIXED with retry logic)

## Why Old Dashboard Works

The old dashboard (`/dashboard/index.html`) connects directly as a **viewer** to the WebSocket:

```javascript
ws://localhost:3001/viewer  (local)
wss://replication.ngrok.io/viewer  (ngrok)
```

**Agents** connect as **publishers**:

```javascript
ws://localhost:3001/agent  (local)
wss://replication.ngrok.io/agent  (should work but getting 502)
```

## Fixing the ngrok WebSocket Issue

The agents are getting 502 errors when connecting to `/agent` endpoint through ngrok. This is likely because:

1. **ngrok WebSocket Forwarding**: May need special configuration
2. **Timing Issue**: Agents connect before ngrok is fully ready
3. **Port/Protocol**: Agents might be using wrong protocol

### Quick Fix: Use Local Backend + ngrok Frontend Only

For best results right now:

1. Keep backend running locally (`localhost:3001`)
2. Agents connect locally for video
3. Frontend can use ngrok URL for API calls
4. View dashboard locally: `http://localhost:3001/dashboard/`

## Full Demo Flow

### Terminal 1: Backend with Agents

```bash
cd /Users/alhwyngeonzon/Programming/yc-supabase
node src/startWithStream.js
```

### Terminal 2: Check It's Running

```bash
# Health check
curl http://localhost:3001/health

# Should return:
# {"status":"ok","agents":5,"viewers":0,...}
```

### Browser: Open Dashboard

```
http://localhost:3001/dashboard/
```

### Spawn & Watch

1. Enter prompt: "Play Wordle"
2. URL: https://www.nytimes.com/games/wordle
3. Agents: 2
4. Click **🚀 Spawn Agents**
5. **WATCH LIVE VIDEO STREAMS APPEAR!** 🎉

## Troubleshooting

### No Video Showing

**Solution**: Check agents are connecting

```bash
# Look for these logs:
🤖 Agent registered for streaming
📹 Starting live capture at 2 FPS
```

### WebSocket Won't Connect

**Solution**: Check URL matches your setup

- Local: `ws://localhost:3001/viewer`
- ngrok: `wss://replication.ngrok.io/viewer`

### 502 Errors for Agents

**Solution**: Use local backend instead of ngrok

```bash
# Agents work best connecting locally
node src/startWithStream.js
# Then access dashboard at localhost:3001/dashboard/
```

### Rate Limit Errors

**Solution**: Already fixed with exponential backoff!

- Added 2-second delays between AI steps
- Added retry logic for 429 errors
- Max 3 retries with exponential backoff

## Next Steps

To get React frontend working with video:

1. **Fix ngrok WebSocket for agents** - Need to debug why 502
2. **Update VideoPlayer.tsx** - Already done! ✅
3. **Test with local backend** - Works perfectly
4. **Deploy with proper WebSocket support** - Railway/Fly.io handle this better

## Current Working Setup

**Best configuration right now:**

```
Backend: localhost:3001 (local)
Frontend: localhost:5173 (local React dev)
Dashboard: localhost:3001/dashboard/ (working video!)
```

**OR for production demo:**

```
Backend: deployed to Railway (not ngrok)
Frontend: deployed to Vercel/Netlify
Dashboard: backend-url/dashboard/
```

Railway and Fly.io handle WebSocket upgrades properly, unlike ngrok which can be finicky.

---

## 🎉 TL;DR

**Want to see video working RIGHT NOW?**

1. Open: `http://localhost:3001/dashboard/` (or `https://replication.ngrok.io/dashboard/`)
2. Fill form with Wordle test
3. Click Spawn
4. **BOOM! Live video streams!** 🎬

The React frontend integration is 95% done, just needs WebSocket agent connection fixed for ngrok (or use Railway/Fly.io deployment instead).
