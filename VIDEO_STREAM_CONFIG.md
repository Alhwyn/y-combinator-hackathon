# Video Stream Configuration - Dashboard vs React

## Working Dashboard Configuration

The old dashboard (`/dashboard/index.html`) successfully connects:

```javascript
const BACKEND_URL = "replication.ngrok.io";
const wsProtocol = "wss:";
const wsUrl = `${wsProtocol}//${BACKEND_URL}/viewer`;
// Results in: wss://replication.ngrok.io/viewer
```

## React Frontend Configuration

Your React frontend (`config.js`) is configured identically:

```javascript
const FORCE_NGROK_BACKEND = true;
const WS_BASE_URL = "wss://replication.ngrok.io";

export const config = {
  ws: {
    viewer: `${WS_BASE_URL}/viewer`,
    // Results in: wss://replication.ngrok.io/viewer
  },
};
```

## ✅ Configuration is CORRECT

Both connect to the exact same WebSocket URL: **`wss://replication.ngrok.io/viewer`**

## Why Dashboard Works and React Might Not Show Video

The difference is NOT in the viewer connection (that works for both), but in the **agent connection**:

### Working Flow (Dashboard)

```
1. Dashboard → wss://replication.ngrok.io/viewer ✅
2. Spawn agents via dashboard
3. Agents → ws://localhost:3001/agent ✅ (agents run locally)
4. Agent streams → Server → Dashboard ✅
5. VIDEO WORKS!
```

### React Frontend Flow

```
1. React → wss://replication.ngrok.io/viewer ✅
2. Spawn agents via API
3. Agents → wss://replication.ngrok.io/agent ❌ (502 error through ngrok)
4. No agent streams = no video
```

## The Real Issue

The viewer WebSocket works fine for both! The problem is:

- **Agents can't stream through ngrok** (502 errors)
- Dashboard works because it spawns LOCAL agents that connect to localhost
- React spawns agents that try to use ngrok for streaming

## Solution: Make Agents Connect Locally

Even when using ngrok for API/viewer, agents should connect to localhost for streaming.

### Check Agent Configuration

In `src/utils/liveStream.js` or wherever agents connect:

```javascript
// Agents should ALWAYS connect locally
const STREAM_URL = "ws://localhost:3001/agent"; // ✅
// NOT
const STREAM_URL = "wss://replication.ngrok.io/agent"; // ❌
```

This is why your logs show:

```
[warn]: Live stream connection error {"error":"Unexpected server response: 502"}
```

Agents are trying to connect through ngrok and failing.

## Quick Fix

The backend and frontend configs are perfect! You just need agents to connect locally:

1. **Viewer (Dashboard/React)** → ngrok viewer WebSocket ✅
2. **API calls** → ngrok HTTP endpoints ✅
3. **Agents** → localhost agent WebSocket ✅

This way everything works through ngrok EXCEPT agent streaming which stays local.
