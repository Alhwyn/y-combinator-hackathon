# 🚨 QUICK FIX - Edit .env File NOW

## Step 1: Open .env File

```bash
open -e .env
```

Or open in VS Code:
```bash
code .env
```

## Step 2: Find This Line (Line 7)

```bash
LIVE_STREAM_WS_URL="wss://multi-agent-testing-production.up.railway.app/agent"
```

## Step 3: Change It To

```bash
LIVE_STREAM_WS_URL="ws://localhost:3001/agent"
```

## Step 4: Save the File

Press `Cmd+S` (Mac) or `Ctrl+S` (Windows)

## Step 5: Restart Backend

The backend will automatically restart and agents will connect!

## That's It!

This single change will:
- ✅ Stop 502 errors
- ✅ Enable video streaming
- ✅ Make agents connect to local WebSocket
- ✅ Everything works!

**DO THIS NOW and video will work in 10 seconds!** 🎬


