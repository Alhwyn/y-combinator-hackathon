# 🔌 WebSocket Video Stream API - Developer Guide

## Overview

This guide explains how to connect to the WebSocket video streaming endpoint at **https://replication.ngrok.io** to either:

1. **Stream video as an agent** (send video frames from your test automation)
2. **View video as a viewer** (receive and display live agent video feeds)

---

## 🌐 Endpoints

### Base URL

```
https://replication.ngrok.io
```

### WebSocket Endpoints

| Endpoint                            | Purpose                     | Connection Type  |
| ----------------------------------- | --------------------------- | ---------------- |
| `wss://replication.ngrok.io/agent`  | For agents sending video    | WebSocket Agent  |
| `wss://replication.ngrok.io/viewer` | For viewers receiving video | WebSocket Viewer |

### HTTP Endpoints

| Endpoint      | Method | Purpose                   |
| ------------- | ------ | ------------------------- |
| `/health`     | GET    | Server health check       |
| `/api/agents` | GET    | List all connected agents |
| `/dashboard/` | GET    | Web-based viewer UI       |

---

## 🤖 Creating an Agent (Send Video)

### Step 1: Connect to WebSocket

```javascript
const WebSocket = require("ws");

const agentId = "my-unique-agent-id";
const agentName = "My Test Agent";
const wsUrl = "wss://replication.ngrok.io/agent";

const ws = new WebSocket(wsUrl);

ws.on("open", () => {
  console.log("✅ Connected to video stream server");

  // Step 2: Register your agent
  ws.send(
    JSON.stringify({
      type: "register",
      agentId: agentId,
      agentName: agentName,
    })
  );
});

ws.on("error", (error) => {
  console.error("WebSocket error:", error);
});

ws.on("close", () => {
  console.log("Disconnected from server");
});
```

### Step 2: Send Video Frames

```javascript
// Capture screenshot (example using Playwright)
async function captureAndSendFrame(page, testId) {
  const screenshot = await page.screenshot({
    type: "jpeg",
    quality: 80,
  });

  const base64Frame = screenshot.toString("base64");

  // Send frame to server
  ws.send(
    JSON.stringify({
      type: "frame",
      agentId: agentId,
      frame: base64Frame,
      testId: testId,
      timestamp: Date.now(),
    })
  );
}

// Send frames periodically (every 2 seconds)
setInterval(async () => {
  if (ws.readyState === WebSocket.OPEN && isTestRunning) {
    await captureAndSendFrame(page, currentTestId);
  }
}, 2000);
```

### Step 3: Send Test Events

```javascript
// When test starts
ws.send(
  JSON.stringify({
    type: "test_started",
    agentId: agentId,
    testId: "test-123",
    testName: "Wordle Test",
    timestamp: Date.now(),
  })
);

// When test completes
ws.send(
  JSON.stringify({
    type: "test_completed",
    agentId: agentId,
    testId: "test-123",
    status: "passed", // or 'failed'
    timestamp: Date.now(),
  })
);
```

### Complete Agent Example

```javascript
const WebSocket = require("ws");
const playwright = require("playwright");

class VideoStreamAgent {
  constructor(agentId, agentName) {
    this.agentId = agentId;
    this.agentName = agentName;
    this.ws = null;
    this.connected = false;
  }

  async connect() {
    const wsUrl = "wss://replication.ngrok.io/agent";
    this.ws = new WebSocket(wsUrl);

    return new Promise((resolve, reject) => {
      this.ws.on("open", () => {
        console.log("✅ Connected to stream server");
        this.connected = true;

        // Register agent
        this.ws.send(
          JSON.stringify({
            type: "register",
            agentId: this.agentId,
            agentName: this.agentName,
          })
        );

        resolve();
      });

      this.ws.on("error", reject);
    });
  }

  async sendFrame(page, testId) {
    if (!this.connected || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      const screenshot = await page.screenshot({
        type: "jpeg",
        quality: 80,
      });

      const base64Frame = screenshot.toString("base64");

      this.ws.send(
        JSON.stringify({
          type: "frame",
          agentId: this.agentId,
          frame: base64Frame,
          testId: testId,
        })
      );
    } catch (error) {
      console.error("Failed to send frame:", error);
    }
  }

  async sendTestStarted(testId, testName) {
    if (!this.connected) return;

    this.ws.send(
      JSON.stringify({
        type: "test_started",
        agentId: this.agentId,
        testId: testId,
        testName: testName,
      })
    );
  }

  async sendTestCompleted(testId, status) {
    if (!this.connected) return;

    this.ws.send(
      JSON.stringify({
        type: "test_completed",
        agentId: this.agentId,
        testId: testId,
        status: status,
      })
    );
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.connected = false;
    }
  }
}

// Usage Example
async function runTest() {
  const agent = new VideoStreamAgent("agent-1", "Demo Agent");
  await agent.connect();

  const browser = await playwright.chromium.launch();
  const page = await browser.newPage();

  const testId = "test-" + Date.now();
  await agent.sendTestStarted(testId, "Wordle Test");

  // Navigate to site
  await page.goto("https://www.nytimes.com/games/wordle/");

  // Stream video every 2 seconds
  const streamInterval = setInterval(async () => {
    await agent.sendFrame(page, testId);
  }, 2000);

  // Do your testing...
  await page.click('button[aria-label="Close"]');
  await page.keyboard.type("CRANE");
  await page.keyboard.press("Enter");

  // Stop streaming
  clearInterval(streamInterval);

  await agent.sendTestCompleted(testId, "passed");
  await browser.close();
  agent.disconnect();
}

runTest();
```

---

## 👀 Creating a Viewer (Receive Video)

### Step 1: Connect as Viewer

```javascript
const wsUrl = "wss://replication.ngrok.io/viewer";
const ws = new WebSocket(wsUrl);

ws.onopen = () => {
  console.log("✅ Connected to stream as viewer");
};

ws.onerror = (error) => {
  console.error("WebSocket error:", error);
};

ws.onclose = () => {
  console.log("Disconnected from stream");
};
```

### Step 2: Receive Messages

```javascript
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case "agent_list":
      // Initial list of all connected agents
      console.log("Connected agents:", message.agents);
      message.agents.forEach((agent) => {
        createAgentCard(agent.agentId, agent.agentName);
      });
      break;

    case "agent_connected":
      // New agent connected
      console.log("New agent:", message.agentName);
      createAgentCard(message.agentId, message.agentName);
      break;

    case "agent_disconnected":
      // Agent disconnected
      console.log("Agent offline:", message.agentId);
      markAgentOffline(message.agentId);
      break;

    case "frame":
      // New video frame from agent
      updateVideoFrame(message.agentId, message.frame, message.testId);
      break;

    case "test_started":
      console.log(`Test started: ${message.testId} on ${message.agentId}`);
      updateTestStatus(message.agentId, message.testId, "running");
      break;

    case "test_completed":
      console.log(`Test completed: ${message.testId} on ${message.agentId}`);
      updateTestStatus(message.agentId, message.testId, "completed");
      break;
  }
};
```

### Step 3: Display Video Frames

```javascript
function updateVideoFrame(agentId, frameBase64, testId) {
  const img = document.getElementById(`video-${agentId}`);
  if (!img) return;

  // Convert base64 to data URL
  img.src = `data:image/jpeg;base64,${frameBase64}`;
  img.style.display = "block";

  // Update test info
  const testSpan = document.getElementById(`test-${agentId}`);
  if (testSpan) {
    testSpan.textContent = testId ? testId.substring(0, 8) + "..." : "Idle";
  }
}

function createAgentCard(agentId, agentName) {
  const card = document.createElement("div");
  card.id = `agent-${agentId}`;
  card.className = "agent-card";
  card.innerHTML = `
    <div class="agent-header">
      <div class="agent-name">${agentName}</div>
      <div class="agent-status">
        <div class="status-dot"></div>
        <span>Online</span>
      </div>
    </div>
    <div class="agent-video">
      <img id="video-${agentId}" style="display:none" alt="${agentName} stream" />
    </div>
    <div class="agent-info">
      <span>Test: <span id="test-${agentId}">Idle</span></span>
    </div>
  `;
  document.getElementById("agents-grid").appendChild(card);
}
```

### Complete Viewer Example (HTML + JS)

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Agent Video Viewer</title>
    <style>
      .agents-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
        gap: 20px;
        padding: 20px;
      }
      .agent-card {
        border: 1px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
      }
      .agent-header {
        background: #f5f5f5;
        padding: 10px;
        display: flex;
        justify-content: space-between;
      }
      .agent-video img {
        width: 100%;
        height: auto;
      }
      .status-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: green;
        display: inline-block;
        margin-right: 5px;
      }
    </style>
  </head>
  <body>
    <h1>Live Agent Stream</h1>
    <div id="connection-status">Connecting...</div>
    <div class="agents-grid" id="agents-grid"></div>

    <script>
      const ws = new WebSocket("wss://replication.ngrok.io/viewer");

      ws.onopen = () => {
        document.getElementById("connection-status").textContent =
          "✅ Connected";
      };

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === "agent_list") {
          message.agents.forEach((agent) => {
            addAgent(agent.agentId, agent.agentName);
          });
        } else if (message.type === "agent_connected") {
          addAgent(message.agentId, message.agentName);
        } else if (message.type === "frame") {
          updateFrame(message.agentId, message.frame);
        }
      };

      ws.onclose = () => {
        document.getElementById("connection-status").textContent =
          "❌ Disconnected";
      };

      function addAgent(agentId, agentName) {
        if (document.getElementById(`agent-${agentId}`)) return;

        const card = document.createElement("div");
        card.id = `agent-${agentId}`;
        card.className = "agent-card";
        card.innerHTML = `
        <div class="agent-header">
          <div class="agent-name">${agentName}</div>
          <div><span class="status-dot"></span>Online</div>
        </div>
        <div class="agent-video">
          <img id="video-${agentId}" alt="${agentName}" />
        </div>
      `;
        document.getElementById("agents-grid").appendChild(card);
      }

      function updateFrame(agentId, frameBase64) {
        const img = document.getElementById(`video-${agentId}`);
        if (img) {
          img.src = `data:image/jpeg;base64,${frameBase64}`;
        }
      }
    </script>
  </body>
</html>
```

---

## 📋 Message Protocol

### Agent → Server Messages

#### 1. Register Agent

```json
{
  "type": "register",
  "agentId": "agent-unique-id",
  "agentName": "My Agent Name"
}
```

#### 2. Send Video Frame

```json
{
  "type": "frame",
  "agentId": "agent-unique-id",
  "frame": "base64-encoded-jpeg-string",
  "testId": "test-123",
  "timestamp": 1696384800000
}
```

#### 3. Test Started Event

```json
{
  "type": "test_started",
  "agentId": "agent-unique-id",
  "testId": "test-123",
  "testName": "Login Flow Test"
}
```

#### 4. Test Completed Event

```json
{
  "type": "test_completed",
  "agentId": "agent-unique-id",
  "testId": "test-123",
  "status": "passed"
}
```

### Server → Viewer Messages

#### 1. Initial Agent List

```json
{
  "type": "agent_list",
  "agents": [
    {
      "agentId": "agent-1",
      "agentName": "Agent 1"
    },
    {
      "agentId": "agent-2",
      "agentName": "Agent 2"
    }
  ]
}
```

#### 2. Agent Connected

```json
{
  "type": "agent_connected",
  "agentId": "agent-3",
  "agentName": "New Agent"
}
```

#### 3. Agent Disconnected

```json
{
  "type": "agent_disconnected",
  "agentId": "agent-1"
}
```

#### 4. Video Frame

```json
{
  "type": "frame",
  "agentId": "agent-1",
  "frame": "base64-encoded-jpeg",
  "testId": "test-123"
}
```

#### 5. Test Events

```json
{
  "type": "test_started",
  "agentId": "agent-1",
  "testId": "test-123",
  "testName": "Login Test"
}
```

```json
{
  "type": "test_completed",
  "agentId": "agent-1",
  "testId": "test-123",
  "status": "passed"
}
```

---

## 🔧 HTTP API

### Health Check

```bash
curl https://replication.ngrok.io/health
```

Response:

```json
{
  "status": "ok",
  "agents": 3,
  "viewers": 5,
  "timestamp": "2025-10-04T12:34:56.789Z",
  "uptime": 3600.5
}
```

### List Connected Agents

```bash
curl https://replication.ngrok.io/api/agents
```

Response:

```json
[
  {
    "id": "agent-1",
    "name": "Wordle Agent",
    "connected": true
  },
  {
    "id": "agent-2",
    "name": "Shopping Agent",
    "connected": true
  }
]
```

---

## 🎯 Integration Examples

### Python Agent Example

```python
import asyncio
import websockets
import json
import base64
from playwright.async_api import async_playwright

async def stream_agent():
    uri = "wss://replication.ngrok.io/agent"

    async with websockets.connect(uri) as websocket:
        # Register
        await websocket.send(json.dumps({
            "type": "register",
            "agentId": "python-agent-1",
            "agentName": "Python Test Agent"
        }))

        # Launch browser
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.newPage()
            await page.goto("https://example.com")

            # Stream frames
            for i in range(10):
                screenshot = await page.screenshot(type='jpeg', quality=80)
                frame_b64 = base64.b64encode(screenshot).decode('utf-8')

                await websocket.send(json.dumps({
                    "type": "frame",
                    "agentId": "python-agent-1",
                    "frame": frame_b64,
                    "testId": "test-python-1"
                }))

                await asyncio.sleep(2)

            await browser.close()

asyncio.run(stream_agent())
```

### React Viewer Component

```jsx
import React, { useState, useEffect } from "react";

function AgentViewer() {
  const [agents, setAgents] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket("wss://replication.ngrok.io/viewer");

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "agent_list") {
        setAgents(
          message.agents.map((a) => ({
            ...a,
            frame: null,
          }))
        );
      } else if (message.type === "agent_connected") {
        setAgents((prev) => [
          ...prev,
          {
            agentId: message.agentId,
            agentName: message.agentName,
            frame: null,
          },
        ]);
      } else if (message.type === "frame") {
        setAgents((prev) =>
          prev.map((agent) =>
            agent.agentId === message.agentId
              ? { ...agent, frame: message.frame }
              : agent
          )
        );
      }
    };

    return () => ws.close();
  }, []);

  return (
    <div>
      <h1>Agent Streams {connected ? "🟢" : "🔴"}</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "20px",
        }}
      >
        {agents.map((agent) => (
          <div
            key={agent.agentId}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "10px",
            }}
          >
            <h3>{agent.agentName}</h3>
            {agent.frame && (
              <img
                src={`data:image/jpeg;base64,${agent.frame}`}
                alt={agent.agentName}
                style={{ width: "100%" }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default AgentViewer;
```

---

## 🔐 Security & Best Practices

### Connection Security

- ✅ Use WSS (secure WebSocket) for production
- ✅ Connection uses HTTPS/WSS encryption
- ✅ No authentication required (public demo endpoint)

### Performance Tips

1. **Frame Rate**: Send 1 frame every 2-5 seconds (not more frequently)
2. **Image Quality**: Use JPEG with quality 70-80% for good balance
3. **Image Size**: Keep screenshots under 1MB (resize if needed)
4. **Reconnection**: Implement exponential backoff for reconnections
5. **Error Handling**: Always handle WebSocket errors gracefully

### Frame Optimization

```javascript
// Good: Optimized screenshot
const screenshot = await page.screenshot({
  type: "jpeg",
  quality: 80,
  clip: { x: 0, y: 0, width: 1280, height: 720 }, // Limit viewport
});

// Bad: Full quality PNG (too large)
const screenshot = await page.screenshot({
  type: "png",
  fullPage: true,
});
```

---

## 🐛 Troubleshooting

### Connection Issues

**Problem**: WebSocket fails to connect

**Solutions**:

```javascript
// Add connection timeout
const timeout = setTimeout(() => {
  ws.close();
  console.error("Connection timeout");
}, 10000);

ws.on("open", () => {
  clearTimeout(timeout);
});
```

### Frame Not Displaying

**Problem**: Frames sent but not showing on viewer

**Check**:

1. Ensure `agentId` matches in all messages
2. Verify base64 encoding is correct
3. Check frame size (should be < 1MB)
4. Confirm agent registered before sending frames

```javascript
// Validate frame before sending
if (base64Frame && base64Frame.length > 0) {
  ws.send(
    JSON.stringify({
      type: "frame",
      agentId: agentId,
      frame: base64Frame,
      testId: testId,
    })
  );
} else {
  console.error("Invalid frame data");
}
```

### High Latency

**Problem**: Frames appear delayed

**Solutions**:

- Reduce screenshot frequency (3-5 seconds instead of 1-2)
- Decrease image quality (60-70% instead of 80-90%)
- Resize screenshots before encoding

```javascript
// Resize before encoding
const resized = await sharp(screenshot)
  .resize(1280, 720, { fit: "inside" })
  .jpeg({ quality: 75 })
  .toBuffer();

const base64Frame = resized.toString("base64");
```

---

## 📊 Rate Limits & Constraints

| Resource                   | Limit                   |
| -------------------------- | ----------------------- |
| Max agents per connection  | 100                     |
| Max viewers per connection | 1000                    |
| Max frame size             | 2MB                     |
| Recommended frame rate     | 0.5-1 FPS               |
| WebSocket timeout          | 60 seconds idle         |
| Reconnection attempts      | Unlimited (use backoff) |

---

## 🎓 Quick Reference

### Agent Connection Flow

```
1. Connect to wss://replication.ngrok.io/agent
2. On 'open', send 'register' message with agentId and agentName
3. Send 'frame' messages with base64 screenshots
4. Send 'test_started' and 'test_completed' events as needed
5. Handle reconnection if connection drops
```

### Viewer Connection Flow

```
1. Connect to wss://replication.ngrok.io/viewer
2. On 'open', wait for 'agent_list' message
3. Handle 'agent_connected', 'frame', and event messages
4. Display frames as base64 data URLs in <img> tags
5. Handle reconnection if connection drops
```

---

## 📞 Support

- **Dashboard**: https://replication.ngrok.io/dashboard/
- **Health Check**: https://replication.ngrok.io/health
- **API Docs**: This document

---

## ✅ Checklist for Integration

### Agent Checklist

- [ ] Connect to `/agent` WebSocket endpoint
- [ ] Send `register` message on connection
- [ ] Capture screenshots as JPEG with 70-80% quality
- [ ] Convert screenshots to base64
- [ ] Send frames every 2-5 seconds
- [ ] Include `agentId`, `frame`, and `testId` in frame messages
- [ ] Send test lifecycle events (started, completed)
- [ ] Handle reconnection with exponential backoff
- [ ] Test with multiple agents simultaneously

### Viewer Checklist

- [ ] Connect to `/viewer` WebSocket endpoint
- [ ] Handle `agent_list` initial message
- [ ] Create UI elements for each agent
- [ ] Display frames as base64 data URLs
- [ ] Handle `agent_connected` and `agent_disconnected` events
- [ ] Update test status from events
- [ ] Implement reconnection logic
- [ ] Test with multiple agents streaming

---

**Happy streaming! 🎬**

_Last Updated: October 2025_
