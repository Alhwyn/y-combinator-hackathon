# Deploy Stream Server to Railway

## Option A: Single Service (Agents + Stream Server)

Update your Railway deployment to include both agents and stream server.

### Step 1: Update package.json

Add a new start script that runs both:

```json
{
  "scripts": {
    "start": "node src/index.js",
    "start:with-stream": "node src/startWithStream.js"
  }
}
```

### Step 2: Create Start Script

Create `src/startWithStream.js`:

```javascript
import VideoStreamServer from "./server/videoStream.js";
import main from "./index.js";
import logger from "./lib/logger.js";

async function startAll() {
  logger.info("Starting Multi-Agent System with Video Streaming...");

  // Start video stream server
  const streamServer = new VideoStreamServer();
  streamServer.start();

  // Start agents
  await main();
}

startAll().catch((error) => {
  logger.error("Failed to start system", { error });
  process.exit(1);
});
```

### Step 3: Update Railway Environment Variables

```env
ENABLE_LIVE_STREAM=true
LIVE_STREAM_WS_URL=wss://multi-agent-testing-production.up.railway.app/agent
LIVE_STREAM_PORT=3001
```

### Step 4: Update Railway Start Command

In Railway settings, change start command to:

```
npm run start:with-stream
```

---

## Option B: Separate Services

Deploy stream server as a separate Railway service.

### Step 1: Create New Railway Service

1. Go to Railway dashboard
2. Click "New Project"
3. Deploy from same GitHub repo
4. Name it "video-stream-server"

### Step 2: Set Environment Variables for Stream Service

```env
# Only these needed for stream server
LOG_LEVEL=info
LIVE_STREAM_PORT=3001
```

### Step 3: Set Start Command for Stream Service

```
npm run stream:server
```

### Step 4: Update Agent Service Environment Variables

Get the public URL of your stream service (e.g., `video-stream-xyz.railway.app`)

Then update agent service:

```env
ENABLE_LIVE_STREAM=true
LIVE_STREAM_WS_URL=wss://video-stream-xyz.railway.app/agent
```

---

## Access Your Dashboard

Once deployed, access at:

```
https://your-stream-service.railway.app/dashboard
```

Or for Option A:

```
https://multi-agent-testing-production.up.railway.app/dashboard
```
