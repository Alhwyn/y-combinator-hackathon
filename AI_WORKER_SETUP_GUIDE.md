# AI Worker & Playwright Video Streaming Setup Guide

> **Technical documentation for setting up AI-powered test agents with Playwright automation and live video streaming**

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [System Components](#system-components)
3. [Worker Setup](#worker-setup)
4. [AI Agent Configuration](#ai-agent-configuration)
5. [Playwright Integration](#playwright-integration)
6. [Video Streaming Setup](#video-streaming-setup)
7. [Environment Configuration](#environment-configuration)
8. [Running the System](#running-the-system)
9. [Advanced Configuration](#advanced-configuration)
10. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### High-Level Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Test Cases    │────▶│  Agent Spawner   │────▶│  Worker Pool    │
│   (Database)    │     │  (spawner.js)    │     │  (worker.js)    │
└─────────────────┘     └──────────────────┘     └────────┬────────┘
                                                            │
                        ┌───────────────────────────────────┤
                        │                                   │
                        ▼                                   ▼
              ┌──────────────────┐            ┌──────────────────────┐
              │  Standard Mode   │            │    AI Agent Mode     │
              │  ─────────────   │            │   ──────────────     │
              │  - Actions.js    │            │  - aiWorker.js       │
              │  - Pre-scripted  │            │  - Claude Vision API │
              │  - Playwright    │            │  - Screenshot loop   │
              └────────┬─────────┘            └──────────┬───────────┘
                       │                                 │
                       └─────────────┬───────────────────┘
                                     │
                                     ▼
                        ┌────────────────────────┐
                        │   Playwright Browser   │
                        │   ─────────────────    │
                        │   - chromium/firefox   │
                        │   - Screenshot capture │
                        │   - Action execution   │
                        └───────────┬────────────┘
                                    │
                        ┌───────────┴────────────┐
                        │                        │
                        ▼                        ▼
            ┌──────────────────┐    ┌──────────────────────┐
            │  Live Streaming  │    │  Result Storage      │
            │  ─────────────   │    │  ──────────────      │
            │  - Video Server  │    │  - Supabase DB       │
            │  - WebSocket     │    │  - Screenshot Store  │
            │  - Dashboard     │    │  - Test Results      │
            └──────────────────┘    └──────────────────────┘
```

### Key Components

1. **Agent Spawner** (`src/orchestration/spawner.js`): Spawns multiple worker processes
2. **Worker** (`src/agent/worker.js`): Main agent that polls for tests and executes them
3. **AI Worker** (`src/agent/aiWorker.js`): AI-powered agent using Claude's vision API
4. **Action Handler** (`src/agent/actions.js`): Executes Playwright actions
5. **Video Stream Server** (`src/server/videoStream.js`): Handles live streaming and dashboard
6. **Live Stream Manager** (`src/utils/liveStream.js`): WebSocket client for agents

---

## System Components

### 1. Worker (`src/agent/worker.js`)

**Purpose**: Main agent process that polls the database for pending tests and executes them.

**Key Features**:

- Polls database for available test cases
- Claims tests atomically using `claim_test` RPC
- Executes tests in either standard or AI mode
- Manages Playwright browser lifecycle
- Captures and uploads screenshots
- Reports results to database
- Handles test retries on failure
- Streams live video to dashboard

**Architecture**:

```javascript
class Agent {
  constructor(id) {
    this.id = id; // Unique agent ID
    this.browser = null; // Playwright browser instance
    this.page = null; // Current browser page
    this.liveStream = null; // WebSocket connection
    this.aiMode = config.agent.aiMode; // AI autonomous testing
  }
}
```

**Lifecycle**:

```
initialize() → launchBrowser() → start() → executeTest() → stop()
      ↓              ↓              ↓            ↓
  Register      Setup live     Poll DB    Run actions    Cleanup
  in DB         streaming                 or AI loop
```

### 2. AI Worker (`src/agent/aiWorker.js`)

**Purpose**: AI-powered agent that uses Claude's vision API to analyze screenshots and autonomously decide actions.

**Key Features**:

- Uses Claude 3.5 Sonnet with vision capabilities
- Analyzes screenshots to understand page state
- Maintains conversation history for context
- Returns JSON actions based on visual analysis
- Prevents infinite loops with max step limit
- Records each AI decision step in database

**Prompt Engineering**:

```javascript
const systemPrompt = `You are an autonomous QA testing agent.
Goal: "${testCase.name}"

Available actions:
- navigate: {"type": "navigate", "url": "..."}
- click: {"type": "click", "selector": "...", "description": "..."}
- fill: {"type": "fill", "selector": "...", "value": "...", "description": "..."}
- keyboard: {"type": "keyboard", "text": "...", "description": "..."}
- wait: {"type": "wait", "timeout": 2000, "description": "..."}
- scroll: {"type": "scroll", "direction": "down", "description": "..."}
- complete: {"type": "complete", "reason": "...", "success": true}

Rules:
1. Always respond with SINGLE JSON action
2. Be specific with selectors (IDs, classes, unique attributes)
3. Add clear descriptions for each action
4. Use "complete" when goal achieved
5. Wait after actions that trigger page changes
`;
```

**AI Loop**:

```
1. Take screenshot (JPEG, base64)
2. Send to Claude API with conversation history
3. Parse JSON response
4. Execute action via ActionHandler
5. Record step in database
6. Repeat until "complete" action or max steps
```

### 3. Action Handler (`src/agent/actions.js`)

**Purpose**: Abstraction layer for executing Playwright actions.

**Supported Actions**:

```javascript
-navigate(target, waitUntil) - // Navigate to URL
  click(selector, button, clickCount) - // Click element
  fill(selector, value, delay) - // Fill input field
  select(selector, values) - // Select dropdown option
  wait(selector, timeout, state) - // Wait for element/timeout
  scroll(selector, behavior) - // Scroll to element/bottom
  hover(selector, timeout) - // Hover over element
  press(key, selector) - // Press keyboard key
  keyboard(text, key, delay) - // Type text or press key
  assert(selector, expected, assertType) - // Assert element state
  screenshot(fullPage, path); // Capture screenshot
```

**Action Execution Flow**:

```javascript
execute(action) {
  const { type, ...params } = action;

  switch (type) {
    case 'click':
      return await this.click(params);
    case 'fill':
      return await this.fill(params);
    // ... etc
  }
}
```

### 4. Video Stream Server (`src/server/videoStream.js`)

**Purpose**: WebSocket server for live streaming agent screens to dashboard.

**Key Features**:

- Express server with static file serving
- WebSocket server with two connection types:
  - `/agent` - For agents to send video frames
  - `/viewer` - For dashboard viewers to receive frames
- AI Agent API routes (`/api/ai-agent/*`)
- Health check endpoint (`/health`)
- Agent list API (`/api/agents`)

**WebSocket Protocol**:

```javascript
// Agent → Server
{
  type: 'register',
  agentId: 'uuid',
  agentName: 'agent-name'
}

{
  type: 'frame',
  agentId: 'uuid',
  agentName: 'agent-name',
  testId: 'test-uuid',
  timestamp: 1234567890,
  frame: 'base64-jpeg-data'
}

{
  type: 'test_started' | 'test_completed',
  agentId: 'uuid',
  testId: 'test-uuid',
  // ... additional data
}

// Server → Viewers
{
  type: 'agent_list',
  agents: [{agentId, agentName}, ...]
}

{
  type: 'frame',
  agentId: 'uuid',
  frame: 'base64-data',
  // ... forwarded from agent
}
```

### 5. Live Stream Manager (`src/utils/liveStream.js`)

**Purpose**: WebSocket client for agents to send frames to video server.

**Features**:

- Auto-reconnect with exponential backoff
- Connection health monitoring
- Frame buffering and sending
- Event broadcasting (test start/stop)
- Graceful degradation (continues without streaming if server unavailable)

---

## Worker Setup

### Standard Worker Mode

For running pre-scripted Playwright tests:

**Step 1: Configure Environment**

```bash
# .env
CONCURRENT_AGENTS=5
HEADLESS=true
AI_MODE=false
BROWSER_TYPE=chromium
VIEWPORT_WIDTH=1920
VIEWPORT_HEIGHT=1080
SCREENSHOT_QUALITY=80
```

**Step 2: Create Test Case**

```javascript
// Using Supabase client
const testCase = {
  name: "Login Test",
  url: "https://example.com",
  actions: [
    { type: "navigate", target: "https://example.com/login" },
    {
      type: "fill",
      selector: "#email",
      value: "test@test.com",
      description: "Enter email",
    },
    {
      type: "fill",
      selector: "#password",
      value: "password123",
      description: "Enter password",
    },
    {
      type: "click",
      selector: 'button[type="submit"]',
      description: "Click login",
    },
    {
      type: "wait",
      selector: ".dashboard",
      timeout: 5000,
      description: "Wait for dashboard",
    },
    {
      type: "assert",
      selector: ".user-name",
      expected: "Test User",
      assertType: "text",
    },
  ],
  max_retries: 3,
  status: "pending",
};

await supabase.from("test_cases").insert(testCase);
```

**Step 3: Start Workers**

```bash
# Single worker
node src/agent/worker.js

# Multiple workers via spawner
node src/orchestration/spawner.js
```

### AI Worker Mode

For autonomous AI-powered testing:

**Step 1: Configure Environment**

```bash
# .env
AI_MODE=true
ANTHROPIC_API_KEY=sk-ant-your-key-here
CONCURRENT_AGENTS=3
HEADLESS=false  # Recommended to see AI in action
SCREENSHOT_QUALITY=80
LIVE_STREAM_ENABLED=true
```

**Step 2: Create AI Test Case**

```javascript
const aiTestCase = {
  name: "Play Wordle Game",
  url: "https://www.nytimes.com/games/wordle/",
  actions: [
    {
      type: "ai_autonomous",
      description:
        "Close any welcome modals, type the word ABOUT, press Enter, type CRANE, press Enter, take screenshot of results",
    },
  ],
  metadata: {
    mode: "ai_autonomous",
    maxSteps: 50,
  },
  status: "pending",
};

await supabase.from("test_cases").insert(aiTestCase);
```

**Step 3: Start AI Workers**

```bash
# Start with AI mode enabled
AI_MODE=true node src/agent/worker.js

# Or via spawner
AI_MODE=true node src/orchestration/spawner.js
```

---

## AI Agent Configuration

### System Prompt Customization

The AI agent behavior is controlled via the system prompt in `src/agent/worker.js` (line 483-510):

```javascript
const systemPrompt = `You are an autonomous QA testing agent.
Goal: ${instructions}
Website: ${testCase.url}

Your task is to:
1. Analyze screenshots of the web page
2. Decide what action to take next to accomplish the test goal
3. Return ONE action at a time in JSON format

Available actions:
- click: {"type": "click", "selector": "button.submit", "description": "..."}
- fill: {"type": "fill", "selector": "input#email", "value": "...", "description": "..."}
- keyboard: {"type": "keyboard", "text": "HELLO", "description": "..."}
- keypress: {"type": "keyboard", "key": "Enter", "description": "..."}
- wait: {"type": "wait", "timeout": 2000, "description": "..."}
- scroll: {"type": "scroll", "description": "..."}
- complete: {"type": "complete", "reason": "...", "success": true}

Rules:
1. Always respond with ONLY valid JSON - no markdown, no explanations
2. Be specific with selectors (use IDs, classes, aria-labels, unique attributes)
3. Add clear descriptions for each action
4. When goal achieved, use complete action with success: true
5. If stuck, use complete action with success: false
6. Be patient - wait after actions that trigger page changes
7. Look carefully at screenshots to understand current state
`;
```

### Response Parsing

The AI response is parsed using flexible JSON extraction (`src/agent/worker.js` line 758-788):

````javascript
parseAIAction(text) {
  // Remove markdown code blocks if present
  let jsonStr = text.trim();

  // Extract from ```json blocks
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1];
  }

  // Find JSON object
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  const action = JSON.parse(jsonStr);

  // Validate required fields
  if (!action.type) {
    throw new Error('Action missing required field: type');
  }

  return action;
}
````

### Claude API Configuration

Located in `src/agent/worker.js` (line 568-576):

```javascript
const anthropic = await import("@anthropic-ai/sdk").then((m) => m.default);
const client = new anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const response = await client.messages.create({
  model: "claude-3-5-sonnet-20241022", // Latest model with vision
  max_tokens: 1024, // Response length limit
  messages: conversationHistory, // Full conversation for context
});

const aiResponse = response.content[0].text;
```

---

## Playwright Integration

### Browser Lifecycle

**Initialization** (`src/agent/worker.js` line 79-103):

```javascript
async launchBrowser() {
  const browserType = config.browser.type; // chromium, firefox, or webkit
  const browsers = { chromium, firefox, webkit };

  this.browser = await browsers[browserType].launch({
    headless: config.agent.headless,
  });

  this.context = await this.browser.newContext({
    viewport: config.browser.viewport,  // 1920x1080 by default
    ignoreHTTPSErrors: true,
  });

  this.page = await this.context.newPage();

  // Navigate to blank page so screenshots work immediately
  await this.page.goto('about:blank');

  // Start live screenshot capture if enabled
  if (config.liveStream?.enabled && this.liveStream) {
    this.startLiveCapture();
  }
}
```

### Screenshot Capture

**Standard Mode** (`src/agent/actions.js` line 163-169):

```javascript
async captureScreenshot(quality = 80) {
  const screenshot = await this.page.screenshot({
    type: 'jpeg',
    quality,
  });
  return screenshot; // Buffer
}
```

**AI Mode** (`src/agent/worker.js` line 525-529):

```javascript
const screenshot = await this.page.screenshot({
  type: "jpeg",
  quality: 80,
});
const screenshotBase64 = screenshot.toString("base64");
```

### Action Execution

All actions flow through `ActionHandler.execute()` which delegates to specific handlers:

```javascript
// Navigate
await this.page.goto(target, { waitUntil });

// Click
await this.page.click(selector, { button, clickCount, delay });

// Fill
await this.page.fill(selector, value, { delay });

// Wait for element
await this.page.waitForSelector(selector, { timeout, state });

// Scroll
await this.page.locator(selector).scrollIntoViewIfNeeded();
// or
await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

// Assert
const actual = await this.page.locator(selector).textContent();
if (!actual?.includes(expected)) {
  throw new Error(
    `Assertion failed: Expected "${expected}" but got "${actual}"`
  );
}
```

---

## Video Streaming Setup

### Architecture

```
Agent (worker.js)
    ↓
LiveStreamManager (liveStream.js)
    ↓ WebSocket
VideoStreamServer (videoStream.js)
    ↓ WebSocket
Dashboard (frontend/public/dashboard/index.html)
```

### Server Setup

**Step 1: Start Video Stream Server**

```bash
# Start server (also serves dashboard)
node src/server/videoStream.js

# Or start with main system
npm start
```

The server runs on:

- **Local**: `http://localhost:3001`
- **Railway**: Uses `process.env.PORT` and `process.env.RAILWAY_PUBLIC_DOMAIN`

**Step 2: Configure Agents**

```bash
# .env
ENABLE_LIVE_STREAM=true
LIVE_STREAM_FPS=2        # Frames per second (1-10)
LIVE_STREAM_QUALITY=60   # JPEG quality (1-100)
LIVE_STREAM_PORT=3001    # Server port
LIVE_STREAM_WS_URL=ws://localhost:3001/agent  # WebSocket URL
```

**Step 3: Agent Connection**

When agents start, they automatically connect to the video server (`src/agent/worker.js` line 57-63):

```javascript
if (config.liveStream?.enabled) {
  this.liveStream = new LiveStreamManager(this.id, this.name);
  await this.liveStream.connect();

  if (this.liveStream.connected) {
    logger.info(`📡 Live streaming enabled for ${this.name}`);
  }
}
```

### Live Capture Loop

Started automatically when browser launches (`src/agent/worker.js` line 105-136):

```javascript
startLiveCapture() {
  const fps = config.liveStream.fps;      // Default: 2 FPS
  const interval = 1000 / fps;            // 500ms for 2 FPS

  this.liveCaptureInterval = setInterval(async () => {
    try {
      if (this.page && this.liveStream?.connected) {
        // Capture screenshot
        const screenshot = await this.page.screenshot({
          type: 'jpeg',
          quality: config.liveStream.quality,  // Default: 60
        });

        // Send to server
        await this.liveStream.sendFrame({
          agentId: this.id,
          agentName: this.name,
          testId: this.currentTestId || 'idle',
          timestamp: Date.now(),
          frame: screenshot.toString('base64'),
        });
      }
    } catch (error) {
      // Log once to avoid spam
      if (!this.captureErrorLogged) {
        logger.warn('Live capture error (will retry):', { error: error.message });
        this.captureErrorLogged = true;
      }
    }
  }, interval);
}
```

### Dashboard Access

Open the dashboard to view live streams:

```bash
# Local
http://localhost:3001/dashboard/

# Railway (production)
https://your-app.up.railway.app/dashboard/
```

**Dashboard Features**:

- Multi-agent grid view
- Real-time video feeds at 2 FPS
- Agent status indicators
- Test information overlays
- Auto-connects to WebSocket
- Shows agent connection/disconnection events

---

## Environment Configuration

### Complete `.env` Example

```bash
# ============================================
# REQUIRED - AI Agent Configuration
# ============================================
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here

# ============================================
# REQUIRED - Supabase Configuration
# ============================================
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# Agent Configuration
# ============================================
# Number of parallel agents to spawn
CONCURRENT_AGENTS=5

# Run browsers in headless mode (no GUI)
HEADLESS=true

# Enable AI autonomous testing mode
AI_MODE=false

# Screenshot quality for step recordings (1-100)
SCREENSHOT_QUALITY=80

# Agent heartbeat interval in milliseconds
AGENT_HEARTBEAT_INTERVAL_MS=5000

# Max timeout for agent operations
AGENT_TIMEOUT_MS=300000

# ============================================
# Browser Configuration
# ============================================
# Browser type: chromium, firefox, or webkit
BROWSER_TYPE=chromium

# Browser viewport size
VIEWPORT_WIDTH=1920
VIEWPORT_HEIGHT=1080

# ============================================
# Live Streaming Configuration
# ============================================
# Enable live video streaming to dashboard
ENABLE_LIVE_STREAM=true

# Frames per second for live stream (1-10 recommended)
LIVE_STREAM_FPS=2

# JPEG quality for live stream frames (1-100)
LIVE_STREAM_QUALITY=60

# Port for video stream server
LIVE_STREAM_PORT=3001

# WebSocket URL for agents to connect
# Local: ws://localhost:3001/agent
# Railway: wss://your-app.up.railway.app/agent
LIVE_STREAM_WS_URL=ws://localhost:3001/agent

# ============================================
# Retry Configuration
# ============================================
MAX_RETRIES=3
RETRY_DELAY_MS=1000

# ============================================
# Logging Configuration
# ============================================
LOG_LEVEL=info

# ============================================
# Railway Deployment (Optional)
# ============================================
# These are set automatically by Railway
# PORT=3001
# RAILWAY_PUBLIC_DOMAIN=your-app.up.railway.app
# NODE_ENV=production
```

### Configuration Loading

Configuration is centralized in `src/config/index.js`:

```javascript
export const config = {
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
  },
  agent: {
    concurrentAgents: parseInt(process.env.CONCURRENT_AGENTS || "5", 10),
    headless: process.env.HEADLESS === "true",
    screenshotQuality: parseInt(process.env.SCREENSHOT_QUALITY || "80", 10),
    heartbeatInterval: parseInt(
      process.env.AGENT_HEARTBEAT_INTERVAL_MS || "5000",
      10
    ),
    timeout: parseInt(process.env.AGENT_TIMEOUT_MS || "300000", 10),
    aiMode: process.env.AI_MODE === "true",
  },
  browser: {
    type: process.env.BROWSER_TYPE || "chromium",
    viewport: {
      width: parseInt(process.env.VIEWPORT_WIDTH || "1920", 10),
      height: parseInt(process.env.VIEWPORT_HEIGHT || "1080", 10),
    },
  },
  liveStream: {
    enabled: process.env.ENABLE_LIVE_STREAM === "true",
    fps: parseInt(process.env.LIVE_STREAM_FPS || "2", 10),
    quality: parseInt(process.env.LIVE_STREAM_QUALITY || "60", 10),
    port: parseInt(process.env.LIVE_STREAM_PORT || "3001", 10),
  },
};
```

---

## Running the System

### Option 1: All-in-One (Recommended for Development)

```bash
# Start video server, spawn agents, and enable live streaming
npm start

# Or with specific configuration
AI_MODE=true CONCURRENT_AGENTS=3 ENABLE_LIVE_STREAM=true npm start
```

This runs `src/startWithStream.js` which:

1. Starts video stream server
2. Spawns configured number of agents
3. Enables live streaming
4. Sets up graceful shutdown handlers

### Option 2: Manual Control (For Testing)

```bash
# Terminal 1: Start video stream server
node src/server/videoStream.js

# Terminal 2: Start single worker
node src/agent/worker.js

# Terminal 3: Start agent spawner (multiple workers)
node src/orchestration/spawner.js
```

### Option 3: AI Mode Only

```bash
# Run in AI autonomous mode
AI_MODE=true HEADLESS=false CONCURRENT_AGENTS=2 npm start

# View dashboard
open http://localhost:3001/dashboard/
```

### Option 4: Production (Railway)

```bash
# Deployed automatically via Railway
# Uses railway.json configuration
# Environment variables set in Railway dashboard
```

---

## Advanced Configuration

### Custom Action Handlers

Add new action types to `src/agent/actions.js`:

```javascript
async customAction({ param1, param2 }) {
  // Your custom Playwright code
  await this.page.evaluate((p1, p2) => {
    // Browser context code
  }, param1, param2);

  return { success: true, result: 'data' };
}
```

Then add to the switch statement in `execute()`:

```javascript
case 'customAction':
  return await this.customAction(params);
```

### Custom AI Prompts

Modify the system prompt in `src/agent/worker.js` (line 483):

```javascript
const systemPrompt = `You are a specialized testing agent for e-commerce sites.

Focus on:
- Product search and filtering
- Cart operations
- Checkout flow validation

Available actions:
... (add custom actions)

Rules:
... (add custom rules)
`;
```

### Screenshot Optimization

**Reduce costs by lowering capture frequency**:

```bash
# Capture every 3 seconds instead of 2
LIVE_STREAM_FPS=0.33

# Lower quality for AI analysis (doesn't affect much)
LIVE_STREAM_QUALITY=50
SCREENSHOT_QUALITY=70
```

**Full page screenshots for AI**:

```javascript
// In worker.js, modify screenshot capture
const screenshot = await this.page.screenshot({
  type: "jpeg",
  quality: 80,
  fullPage: true, // Capture entire page, not just viewport
});
```

### Database Polling Optimization

Adjust polling frequency in `src/agent/worker.js` (line 162-169):

```javascript
if (!testId) {
  // No tests available, wait and retry
  await this.sleep(2000);  // Change to 5000 for less frequent polling
  continue;
}
```

---

## Troubleshooting

### Issue: AI Agent Not Responding

**Symptoms**: Agent starts but doesn't take actions

**Solutions**:

```bash
# 1. Verify API key
node test-anthropic-key.js

# 2. Check logs for API errors
tail -f logs/combined.log | grep "AI"

# 3. Verify model version in code
# src/agent/worker.js line 571
model: 'claude-3-5-sonnet-20241022'

# 4. Check token limits
max_tokens: 1024  # Increase to 2048 if responses cut off
```

### Issue: Live Stream Not Working

**Symptoms**: Dashboard shows no video feeds

**Solutions**:

```bash
# 1. Verify server is running
curl http://localhost:3001/health

# 2. Check WebSocket connection
# Open browser console on dashboard, look for:
# "WebSocket connection established"

# 3. Verify agent connection
# Agent logs should show:
# "📡 Live streaming enabled for agent-xxx"

# 4. Check port availability
lsof -i :3001

# 5. Verify environment variables
echo $ENABLE_LIVE_STREAM  # Should be "true"
echo $LIVE_STREAM_WS_URL  # Should match server address
```

### Issue: Playwright Actions Failing

**Symptoms**: "Element not found" or timeout errors

**Solutions**:

```javascript
// 1. Increase timeouts in actions.js
async wait({ selector, timeout = 30000, state = 'visible' }) {
  timeout = 60000;  // Increase to 60 seconds
  // ...
}

// 2. Add retry logic
let retries = 3;
while (retries > 0) {
  try {
    await this.page.click(selector);
    break;
  } catch (error) {
    retries--;
    await this.sleep(1000);
  }
}

// 3. Use more robust selectors
// Bad: 'button'
// Good: 'button[aria-label="Submit"]'
// Better: '[data-testid="submit-button"]'

// 4. Wait for network idle
await this.page.waitForLoadState('networkidle');
```

### Issue: High Claude API Costs

**Symptoms**: Expensive test runs

**Solutions**:

```bash
# 1. Reduce screenshot frequency
LIVE_STREAM_FPS=1  # Only 1 frame per second for AI

# 2. Lower screenshot quality
SCREENSHOT_QUALITY=60

# 3. Set lower max steps
# In test case metadata:
metadata: { maxSteps: 20 }  # Stop after 20 steps

# 4. Use more specific test goals
# Bad: "Test the website"
# Good: "Click login button, enter credentials, verify dashboard loads"

# 5. Implement early completion detection
# Modify AI prompt to detect success faster
```

### Issue: Agent Crashes or Hangs

**Symptoms**: Agent process exits unexpectedly

**Solutions**:

```bash
# 1. Check system resources
# Ensure enough RAM for browsers
# Each agent needs ~500MB-1GB RAM

# 2. Enable respawning in spawner
# In spawner.js, it's already enabled by default
spawner.enableRespawn();

# 3. Set browser timeouts
# In worker.js, add timeout to page actions
this.page.setDefaultTimeout(30000);

# 4. Monitor with PM2 (production)
npm install -g pm2
pm2 start src/startWithStream.js --name "ai-agents"
pm2 logs
pm2 restart ai-agents

# 5. Check for memory leaks
# Add to worker.js after each test:
if (global.gc) {
  global.gc();
}
# Run with: node --expose-gc src/agent/worker.js
```

### Issue: Database Connection Errors

**Symptoms**: "Failed to claim test" or connection timeouts

**Solutions**:

```bash
# 1. Verify Supabase is running
docker ps | grep supabase

# 2. Test connection
node -e "
import supabase from './src/lib/supabase.js';
const { data, error } = await supabase.from('agents').select('*').limit(1);
console.log(data, error);
"

# 3. Check database migrations
supabase db reset
supabase db push

# 4. Verify RPC functions exist
# In Supabase dashboard, check:
# - claim_test
# - release_test

# 5. Connection pooling
# If many agents, increase Supabase connection limit
# In supabase/config.toml:
[db]
pool_size = 50
```

---

## Performance Tuning

### For High Volume Testing

```bash
# .env optimized for throughput
CONCURRENT_AGENTS=10
HEADLESS=true
ENABLE_LIVE_STREAM=false  # Disable for faster execution
SCREENSHOT_QUALITY=60
AGENT_HEARTBEAT_INTERVAL_MS=10000
```

### For AI Quality

```bash
# .env optimized for AI accuracy
CONCURRENT_AGENTS=2
HEADLESS=false  # See what AI sees
ENABLE_LIVE_STREAM=true
SCREENSHOT_QUALITY=90
LIVE_STREAM_FPS=1  # Don't overwhelm AI
```

### For Local Development

```bash
# .env optimized for development
CONCURRENT_AGENTS=1
HEADLESS=false
ENABLE_LIVE_STREAM=true
LIVE_STREAM_FPS=2
LOG_LEVEL=debug
```

---

## Monitoring & Logging

### Log Locations

```bash
# Combined logs (info + errors)
tail -f logs/combined.log

# Errors only
tail -f logs/error.log

# Real-time with filtering
tail -f logs/combined.log | grep "🤖 AI"
tail -f logs/combined.log | grep "✅ TEST COMPLETED"
tail -f logs/combined.log | grep "❌ TEST FAILED"
```

### Health Monitoring

```bash
# Check server health
curl http://localhost:3001/health

# Response:
{
  "status": "ok",
  "agents": 5,
  "viewers": 2,
  "timestamp": "2024-10-04T...",
  "uptime": 3600
}

# Check active agents
curl http://localhost:3001/api/agents

# Response:
[
  {"id": "uuid", "name": "agent-abc123", "connected": true},
  {"id": "uuid", "name": "agent-def456", "connected": true}
]
```

### Database Monitoring

```sql
-- Check agent status
SELECT id, name, status, last_heartbeat
FROM agents
WHERE last_heartbeat > NOW() - INTERVAL '1 minute';

-- Check running tests
SELECT tc.name, tc.status, a.name as agent_name
FROM test_cases tc
LEFT JOIN agents a ON tc.assigned_agent_id = a.id
WHERE tc.status = 'running';

-- Check recent test results
SELECT tc.name, tr.status, tr.duration_ms, tr.completed_at
FROM test_results tr
JOIN test_cases tc ON tr.test_case_id = tc.id
ORDER BY tr.completed_at DESC
LIMIT 10;
```

---

## Security Considerations

### API Key Management

```bash
# Never commit .env
echo ".env" >> .gitignore

# Use environment variables in production
# Railway: Set in dashboard
# Docker: Use --env-file

# Rotate keys regularly
# Anthropic Console → API Keys → Rotate
```

### Supabase Security

```sql
-- Enable RLS on test tables
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- Only service role can access
CREATE POLICY "Service role only" ON test_cases
  FOR ALL
  USING (auth.role() = 'service_role');
```

### Network Security

```bash
# Firewall for production
# Only allow:
# - Port 443 (HTTPS)
# - Port 3001 (WebSocket) from trusted IPs

# Use WSS (secure WebSocket) in production
LIVE_STREAM_WS_URL=wss://your-domain.com/agent
```

---

## Next Steps

1. **Read the full guides**:

   - [AI_AGENT_GUIDE.md](AI_AGENT_GUIDE.md) - End-user documentation
   - [PARALLEL_WORDLE_GUIDE.md](PARALLEL_WORDLE_GUIDE.md) - Parallel testing example
   - [API_USAGE_GUIDE.md](API_USAGE_GUIDE.md) - API reference

2. **Try examples**:

   ```bash
   node examples/loadSampleTests.js
   npm start
   ```

3. **Customize for your use case**:

   - Modify system prompts
   - Add custom actions
   - Adjust performance settings

4. **Deploy to production**:
   - Follow [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md)
   - Set up monitoring
   - Configure autoscaling

---

## Support

For issues or questions:

- Check existing documentation
- Review logs: `logs/combined.log`
- Test components individually
- Open GitHub issue with logs and configuration

---

**Happy Testing! 🚀**
