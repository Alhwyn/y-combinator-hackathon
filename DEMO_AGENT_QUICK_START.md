# 🚀 Create a Demo Agent in 5 Minutes

## What You'll Build

A simple agent that connects to **https://replication.ngrok.io** and streams live video of browser automation.

**Result**: Your agent will appear on the live dashboard at https://replication.ngrok.io/dashboard/

---

## Prerequisites

- Node.js installed
- Basic JavaScript knowledge
- 5 minutes of time

---

## Step 1: Setup (1 minute)

Create a new folder and install dependencies:

```bash
mkdir my-demo-agent
cd my-demo-agent
npm init -y
npm install playwright ws
```

---

## Step 2: Create Agent Script (2 minutes)

Create `demo-agent.js`:

```javascript
const WebSocket = require("ws");
const { chromium } = require("playwright");

// Configuration
const AGENT_ID = "demo-agent-" + Date.now();
const AGENT_NAME = "My Demo Agent";
const WS_URL = "wss://replication.ngrok.io/agent";

async function runDemo() {
  console.log("🚀 Starting demo agent...");

  // Connect to WebSocket
  const ws = new WebSocket(WS_URL);

  await new Promise((resolve) => {
    ws.on("open", () => {
      console.log("✅ Connected to stream server");

      // Register agent
      ws.send(
        JSON.stringify({
          type: "register",
          agentId: AGENT_ID,
          agentName: AGENT_NAME,
        })
      );

      resolve();
    });
  });

  console.log(`📺 Check dashboard: https://replication.ngrok.io/dashboard/`);
  console.log(`🤖 Agent name: ${AGENT_NAME}`);

  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Test ID
  const testId = "demo-test-" + Date.now();

  // Notify test started
  ws.send(
    JSON.stringify({
      type: "test_started",
      agentId: AGENT_ID,
      testId: testId,
      testName: "Wordle Demo",
    })
  );

  // Navigate to Wordle
  console.log("🎮 Opening Wordle...");
  await page.goto("https://www.nytimes.com/games/wordle/");
  await page.waitForTimeout(2000);

  // Start streaming video
  const streamInterval = setInterval(async () => {
    try {
      const screenshot = await page.screenshot({
        type: "jpeg",
        quality: 80,
      });
      const base64 = screenshot.toString("base64");

      ws.send(
        JSON.stringify({
          type: "frame",
          agentId: AGENT_ID,
          frame: base64,
          testId: testId,
        })
      );

      console.log("📸 Frame sent");
    } catch (error) {
      console.error("Failed to send frame:", error.message);
    }
  }, 2000); // Send frame every 2 seconds

  // Perform test actions
  console.log("🎯 Performing test actions...");

  try {
    // Close modal if exists
    await page.click('button[aria-label="Close"]', { timeout: 3000 });
    await page.waitForTimeout(1000);
  } catch (e) {
    console.log("No modal to close");
  }

  // Type first word
  console.log("⌨️  Typing first word: CRANE");
  await page.keyboard.type("CRANE");
  await page.waitForTimeout(1000);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(3000);

  // Type second word
  console.log("⌨️  Typing second word: ABOUT");
  await page.keyboard.type("ABOUT");
  await page.waitForTimeout(1000);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(3000);

  // Stop streaming
  clearInterval(streamInterval);

  // Notify test completed
  ws.send(
    JSON.stringify({
      type: "test_completed",
      agentId: AGENT_ID,
      testId: testId,
      status: "passed",
    })
  );

  console.log("✅ Test completed!");
  console.log("🔚 Closing in 5 seconds...");

  await page.waitForTimeout(5000);
  await browser.close();
  ws.close();

  console.log("👋 Demo finished!");
}

// Run the demo
runDemo().catch(console.error);
```

---

## Step 3: Run the Demo (2 minutes)

```bash
node demo-agent.js
```

**What happens:**

1. ✅ Agent connects to WebSocket server
2. 📺 Agent registers with unique name
3. 🌐 Browser opens Wordle website
4. 📸 Screenshots sent every 2 seconds
5. ⌨️ Agent types words and plays Wordle
6. 🎬 **You can watch LIVE on the dashboard!**

---

## Step 4: Watch Live! (Immediate)

While the script runs, open:

**👉 https://replication.ngrok.io/dashboard/**

You'll see:

- Your agent appear in the grid
- Live video of the browser
- Test ID showing current test
- Real-time updates every 2 seconds

---

## 🎯 Customization Ideas

### Change the Website

```javascript
// Instead of Wordle, try:
await page.goto("https://example.com");

// Or your own site:
await page.goto("http://localhost:3000");
```

### Add More Actions

```javascript
// Click buttons
await page.click("button#login");

// Fill forms
await page.fill('input[name="email"]', "test@test.com");

// Take longer videos
await page.waitForTimeout(10000); // 10 seconds
```

### Change Agent Name

```javascript
const AGENT_NAME = "Shopping Cart Tester";
// or
const AGENT_NAME = "Login Flow Agent";
```

---

## 🔥 Advanced: Multiple Agents

Run multiple agents simultaneously:

**Terminal 1:**

```bash
AGENT_NAME="Agent 1" node demo-agent.js
```

**Terminal 2:**

```bash
AGENT_NAME="Agent 2" node demo-agent.js
```

**Terminal 3:**

```bash
AGENT_NAME="Agent 3" node demo-agent.js
```

All will appear on the dashboard at once! 🎉

---

## 🎨 Make It Your Own

### Custom Test Scenario

```javascript
async function runCustomTest() {
  // Your custom test logic here
  await page.goto("https://your-site.com");

  // Login flow
  await page.click("#login-button");
  await page.fill("#email", "test@example.com");
  await page.fill("#password", "password123");
  await page.click("#submit");

  // Verify success
  const success = await page.locator(".success-message").isVisible();

  return success ? "passed" : "failed";
}
```

### Environment Variables

Create `.env` file:

```
AGENT_NAME=My Custom Agent
STREAM_URL=wss://replication.ngrok.io/agent
TEST_URL=https://your-site.com
```

Use in script:

```javascript
require("dotenv").config();

const AGENT_NAME = process.env.AGENT_NAME || "Default Agent";
const WS_URL = process.env.STREAM_URL;
```

---

## 📊 What the Dashboard Shows

When you run your agent, viewers on the dashboard see:

1. **Agent Card** with your agent name
2. **Green Status Indicator** (agent is online)
3. **Live Video Stream** (your screenshots)
4. **Test ID** (current test running)
5. **Real-time Updates** (every 2 seconds)

---

## 🐛 Troubleshooting

### "Cannot connect to WebSocket"

**Check:**

- Internet connection
- URL is correct: `wss://replication.ngrok.io/agent`
- No firewall blocking WebSocket

**Fix:**

```javascript
ws.on("error", (error) => {
  console.error("Connection error:", error.message);
  console.log("Retrying in 5 seconds...");
  setTimeout(runDemo, 5000);
});
```

### "No video showing on dashboard"

**Check:**

- Agent registered successfully (check console)
- Screenshots being captured (check console logs)
- Dashboard is open in browser

**Debug:**

```javascript
// Add after screenshot capture
console.log("Frame size:", base64.length, "bytes");
console.log("Sent at:", new Date().toISOString());
```

### "Playwright not found"

**Fix:**

```bash
# Install browsers
npx playwright install chromium
```

---

## ⚡ Quick Commands Reference

```bash
# Setup
npm install playwright ws

# Run agent
node demo-agent.js

# Run with custom name
AGENT_NAME="My Agent" node demo-agent.js

# Install Playwright browsers (if needed)
npx playwright install

# View dashboard
open https://replication.ngrok.io/dashboard/
```

---

## 🎉 Success Checklist

After running the script, you should see:

- ✅ "Connected to stream server" in console
- ✅ "Check dashboard: https://..." message
- ✅ Browser window opens
- ✅ "Frame sent" messages every 2 seconds
- ✅ Your agent visible on dashboard
- ✅ Live video streaming on dashboard
- ✅ Test completes successfully

---

## 🚀 Next Steps

### Want More?

1. **Read Full API Docs**: See `WEBSOCKET_API_GUIDE.md`
2. **Build Custom Tests**: Modify the script for your use case
3. **Run Multiple Agents**: Test at scale
4. **Integrate CI/CD**: Automate your testing

### Production Ready?

Check out:

- `src/agent/worker.js` - Full agent implementation
- `src/utils/liveStream.js` - Production stream manager
- `AI_AGENT_GUIDE.md` - Complete guide

---

## 💡 Pro Tips

1. **Start Simple**: Get one agent working first
2. **Watch Console**: Logs show what's happening
3. **Check Dashboard**: Verify stream appears
4. **Adjust Timing**: 2 seconds is good default
5. **Test Locally**: Works with localhost sites too

---

## 🎬 Ready to Demo!

That's it! You now have a working demo agent that:

- ✅ Connects to the stream server
- ✅ Sends live video
- ✅ Appears on the public dashboard
- ✅ Performs automated testing

**Time to impress! 🌟**

Run it: `node demo-agent.js`

Watch it: https://replication.ngrok.io/dashboard/

---

**Questions?** Check the console logs - they tell you everything! 📝
