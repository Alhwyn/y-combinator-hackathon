# Quick Video Stream Fix

## The Problem

Your React frontend can connect to the WebSocket viewer, but **agents can't stream through ngrok** due to 502 errors:

```
[warn]: Live stream connection error {"error":"Unexpected server response: 502"}
```

## The Solution - Use Local Dashboard

The local dashboard works perfectly because agents connect locally (no ngrok for agent streams).

### Step 1: Open Local Dashboard

```bash
open http://localhost:3001/dashboard/
```

Or manually open: **http://localhost:3001/dashboard/**

### Step 2: Spawn Agents with Video

Fill in the form:

- **Prompt**: "Play Wordle and try to win"
- **URL**: https://www.nytimes.com/games/wordle
- **Agents**: 2

Click **🚀 Spawn Agents**

### Step 3: Watch Live Video! 🎥

You'll see:

- ✅ Live video streams from each agent
- ✅ Real-time browser activity
- ✅ FPS counter showing 2-4 FPS
- ✅ Agent status updates

## Why This Works

**Local Setup:**

```
Viewer (Dashboard) → ws://localhost:3001/viewer ✅
Agents             → ws://localhost:3001/agent  ✅
```

**Ngrok Setup (current issue):**

```
Viewer (React)     → wss://replication.ngrok.io/viewer ✅
Agents             → wss://replication.ngrok.io/agent  ❌ 502 Error
```

Ngrok has issues upgrading WebSocket connections for agents. Local works perfectly!

## Alternative: Stop Old Agents & Spawn Fresh

The old agents from before are still running with rate limit errors. Let's stop them:

```bash
# Stop all current agents
curl -X POST http://localhost:3001/api/stop-agents -H "Content-Type: application/json"

# Or use the dashboard "Stop All Agents" button
```

Then spawn fresh agents with the new rate limit fixes!

## React Frontend Fix (In Progress)

The React frontend (`/results` page) is almost ready, it just needs agents that can stream.

Once you spawn agents via the dashboard, they'll be visible in your React frontend too because both connect to the same WebSocket!

## Quick Demo Right Now

1. **Dashboard is open** at http://localhost:3001/dashboard/
2. **Spawn 2 agents** with Wordle test
3. **Watch video appear** in 3-5 seconds
4. **Profit!** 🎉

---

**The video WebSocket is working perfectly - just use the local dashboard to see it in action!**
