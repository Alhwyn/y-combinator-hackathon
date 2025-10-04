# 🔌 API Usage Guide - Frontend Integration

Complete guide for using the QA Testing API in your frontend applications.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [API Endpoints](#api-endpoints)
3. [Frontend Examples](#frontend-examples)
4. [WebSocket Live Stream](#websocket-live-stream)
5. [Browser Extension](#browser-extension)
6. [Error Handling](#error-handling)

---

## 🚀 Quick Start

### Base URL

**Local Development:**

```
http://localhost:3001
```

**Railway Production:**

```
https://multi-agent-testing-production.up.railway.app
```

### Quick Test

```bash
# Check if API is running
curl https://multi-agent-testing-production.up.railway.app/health

# Expected response:
# {"status":"ok","agents":5,"viewers":0,"timestamp":"...","uptime":123}
```

---

## 📡 API Endpoints

### 1. Health Check

**GET** `/health`

Check if the server is running and get system stats.

```javascript
fetch('https://multi-agent-testing-production.up.railway.app/health')
  .then(res => res.json())
  .then(data => console.log(data));

// Response:
{
  "status": "ok",
  "agents": 5,
  "viewers": 0,
  "timestamp": "2025-10-04T15:00:00.000Z",
  "uptime": 123.456
}
```

### 2. List Agents

**GET** `/api/agents`

Get all active agents and their status.

```javascript
fetch('https://multi-agent-testing-production.up.railway.app/api/agents')
  .then(res => res.json())
  .then(data => console.log(data));

// Response:
{
  "agents": [
    {
      "id": "agent-abc123",
      "name": "agent-abc123",
      "status": "idle",
      "testId": null
    }
  ]
}
```

### 3. Create Test

**POST** `/api/tests`

Create a new test case for agents to execute.

```javascript
// Standard Playwright Test
const testCase = {
  name: "Login Test",
  url: "https://example.com",
  actions: [
    { type: "fill", selector: "#email", value: "test@test.com" },
    { type: "fill", selector: "#password", value: "password123" },
    { type: "click", selector: "button[type='submit']" },
    { type: "wait", selector: ".welcome-message" },
  ],
};

fetch("https://multi-agent-testing-production.up.railway.app/api/tests", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(testCase),
})
  .then((res) => res.json())
  .then((data) => console.log("Test created:", data));
```

```javascript
// AI Autonomous Test
const aiTest = {
  name: "AI Agent: Play Wordle",
  url: "https://www.nytimes.com/games/wordle/",
  actions: [
    {
      type: "ai_autonomous",
      description:
        "Play Wordle - Close any modals, try intelligent word guesses, solve the puzzle",
    },
  ],
  metadata: {
    mode: "ai_autonomous",
    maxSteps: 50,
  },
};

fetch("https://multi-agent-testing-production.up.railway.app/api/tests", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(aiTest),
})
  .then((res) => res.json())
  .then((data) => console.log("AI test created:", data));
```

### 4. Get Test Results

**GET** `/api/tests/:testId/results`

Get results for a specific test.

```javascript
const testId = 'test-uuid-here';

fetch(`https://multi-agent-testing-production.up.railway.app/api/tests/${testId}/results`)
  .then(res => res.json())
  .then(data => console.log(data));

// Response:
{
  "testId": "test-uuid",
  "status": "completed",
  "duration": 5432,
  "steps": [
    {
      "stepNumber": 1,
      "actionType": "fill",
      "status": "passed",
      "screenshotBefore": "url...",
      "screenshotAfter": "url..."
    }
  ]
}
```

---

## 🎨 Frontend Examples

### React Example

```jsx
import React, { useState, useEffect } from "react";

const API_BASE = "https://multi-agent-testing-production.up.railway.app";

function TestRunner() {
  const [agents, setAgents] = useState([]);
  const [testResults, setTestResults] = useState(null);

  // Fetch active agents
  useEffect(() => {
    const fetchAgents = async () => {
      const res = await fetch(`${API_BASE}/api/agents`);
      const data = await res.json();
      setAgents(data.agents);
    };

    fetchAgents();
    const interval = setInterval(fetchAgents, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  // Create a test
  const runTest = async () => {
    const testCase = {
      name: "Login Test",
      url: "https://example.com",
      actions: [
        { type: "fill", selector: "#email", value: "test@test.com" },
        { type: "click", selector: "button[type='submit']" },
      ],
    };

    const res = await fetch(`${API_BASE}/api/tests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testCase),
    });

    const data = await res.json();
    console.log("Test created:", data);

    // Poll for results
    pollResults(data.testId);
  };

  // Poll for test results
  const pollResults = async (testId) => {
    const interval = setInterval(async () => {
      const res = await fetch(`${API_BASE}/api/tests/${testId}/results`);
      const data = await res.json();

      if (data.status === "completed" || data.status === "failed") {
        setTestResults(data);
        clearInterval(interval);
      }
    }, 2000);
  };

  return (
    <div>
      <h1>QA Test Runner</h1>

      <div>
        <h2>Active Agents: {agents.length}</h2>
        <ul>
          {agents.map((agent) => (
            <li key={agent.id}>
              {agent.name} - {agent.status}
              {agent.testId && ` (Running test: ${agent.testId})`}
            </li>
          ))}
        </ul>
      </div>

      <button onClick={runTest}>Run Test</button>

      {testResults && (
        <div>
          <h2>Test Results</h2>
          <p>Status: {testResults.status}</p>
          <p>Duration: {testResults.duration}ms</p>
        </div>
      )}
    </div>
  );
}

export default TestRunner;
```

### Vanilla JavaScript Example

```html
<!DOCTYPE html>
<html>
  <head>
    <title>QA Test Runner</title>
  </head>
  <body>
    <h1>QA Test Runner</h1>
    <button onclick="runTest()">Run Wordle Test</button>
    <div id="status"></div>
    <div id="agents"></div>

    <script>
      const API_BASE = "https://multi-agent-testing-production.up.railway.app";

      // Check health
      async function checkHealth() {
        const res = await fetch(`${API_BASE}/health`);
        const data = await res.json();
        document.getElementById(
          "status"
        ).innerHTML = `Status: ${data.status} | Agents: ${data.agents}`;
      }

      // Run AI test
      async function runTest() {
        const aiTest = {
          name: "AI Agent: Play Wordle",
          url: "https://www.nytimes.com/games/wordle/",
          actions: [
            {
              type: "ai_autonomous",
              description: "Play Wordle intelligently",
            },
          ],
          metadata: { mode: "ai_autonomous", maxSteps: 50 },
        };

        const res = await fetch(`${API_BASE}/api/tests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(aiTest),
        });

        const data = await res.json();
        alert(`Test created: ${data.testId}`);

        // Open dashboard to watch
        window.open(`${API_BASE}/dashboard/`, "_blank");
      }

      // Fetch agents every 5 seconds
      setInterval(async () => {
        const res = await fetch(`${API_BASE}/api/agents`);
        const data = await res.json();

        const agentsList = data.agents
          .map((a) => `<li>${a.name} - ${a.status}</li>`)
          .join("");

        document.getElementById("agents").innerHTML = `<ul>${agentsList}</ul>`;
      }, 5000);

      // Initial health check
      checkHealth();
    </script>
  </body>
</html>
```

---

## 🔴 WebSocket Live Stream

Connect to live agent streams to watch tests in real-time.

### WebSocket URL

**Local:**

```
ws://localhost:3001/viewer
```

**Railway:**

```
wss://multi-agent-testing-production.up.railway.app/viewer
```

### Example

```javascript
const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const wsUrl = `${wsProtocol}//multi-agent-testing-production.up.railway.app/viewer`;

const ws = new WebSocket(wsUrl);

ws.onopen = () => {
  console.log("✅ Connected to live stream");
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);

  switch (message.type) {
    case "agent_list":
      console.log("Agents:", message.agents);
      break;

    case "agent_connected":
      console.log("New agent:", message.agentName);
      break;

    case "frame":
      // Display screenshot
      const img = document.getElementById(`agent-${message.agentId}`);
      img.src = `data:image/jpeg;base64,${message.frame}`;
      break;

    case "test_started":
      console.log("Test started:", message.testId);
      break;

    case "test_completed":
      console.log("Test completed:", message.testId, message.status);
      break;
  }
};

ws.onerror = (error) => {
  console.error("WebSocket error:", error);
};

ws.onclose = () => {
  console.log("Disconnected from live stream");
};
```

---

## 🧩 Browser Extension Integration

Use the Chrome extension for interactive testing.

### Setup

1. Load extension from `browser-extension/` folder
2. Configure server URL in extension popup
3. Click "Start Testing" on any webpage

### Extension API

The extension communicates with your backend:

```javascript
// Extension background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_AGENT") {
    // Start AI agent
    fetch(`${SERVER_URL}/api/ai-agent/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: message.url,
        goal: message.testGoal,
        apiKey: message.apiKey,
      }),
    })
      .then((res) => res.json())
      .then((data) => sendResponse(data));

    return true; // Keep channel open
  }
});
```

---

## ⚠️ Error Handling

### Common Errors

**502 Bad Gateway**

```javascript
// Server not running or wrong port
// Solution: Check Railway logs, verify PORT env var
```

**429 Rate Limit (Claude API)**

```javascript
{
  "error": {
    "type": "rate_limit_error",
    "message": "Rate limit exceeded"
  }
}

// Solution: Slow down AI tests, add delays between API calls
```

**Connection Refused**

```javascript
// App listening on wrong port
// Solution: Use process.env.PORT on Railway
```

### Error Handling Example

```javascript
async function safeApiCall(url, options = {}) {
  try {
    const res = await fetch(url, options);

    if (!res.ok) {
      if (res.status === 502) {
        throw new Error("Server unavailable. Please try again later.");
      }
      if (res.status === 429) {
        throw new Error("Rate limit exceeded. Please slow down requests.");
      }
      throw new Error(`API error: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("API call failed:", error);

    // Retry logic
    if (error.message.includes("unavailable")) {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return safeApiCall(url, options); // Retry
    }

    throw error;
  }
}

// Usage
try {
  const data = await safeApiCall(`${API_BASE}/api/agents`);
  console.log(data);
} catch (error) {
  alert(`Error: ${error.message}`);
}
```

---

## 📊 Complete Dashboard Example

```html
<!DOCTYPE html>
<html>
  <head>
    <title>QA Testing Dashboard</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        padding: 20px;
      }
      .agent {
        border: 1px solid #ccc;
        padding: 10px;
        margin: 10px 0;
      }
      .idle {
        background: #f0f0f0;
      }
      .busy {
        background: #ffe6e6;
      }
      button {
        padding: 10px 20px;
        margin: 5px;
      }
    </style>
  </head>
  <body>
    <h1>QA Testing Dashboard</h1>

    <div>
      <button onclick="createWordleTest()">🎮 Run Wordle Test</button>
      <button onclick="createLoginTest()">🔐 Run Login Test</button>
      <button onclick="openLiveDashboard()">📺 Open Live Stream</button>
    </div>

    <h2>Active Agents</h2>
    <div id="agents"></div>

    <h2>Recent Tests</h2>
    <div id="tests"></div>

    <script>
      const API_BASE = "https://multi-agent-testing-production.up.railway.app";

      // Create Wordle test
      async function createWordleTest() {
        const test = {
          name: "AI Agent: Play Wordle",
          url: "https://www.nytimes.com/games/wordle/",
          actions: [
            {
              type: "ai_autonomous",
              description:
                "Play Wordle - close modals, make intelligent guesses, solve puzzle",
            },
          ],
          metadata: { mode: "ai_autonomous", maxSteps: 50 },
        };

        const res = await fetch(`${API_BASE}/api/tests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(test),
        });

        const data = await res.json();
        alert(`✅ Wordle test created! Test ID: ${data.testId}`);
        fetchTests();
      }

      // Create login test
      async function createLoginTest() {
        const test = {
          name: "Login Test",
          url: "https://example.com/login",
          actions: [
            { type: "fill", selector: "#email", value: "test@test.com" },
            { type: "fill", selector: "#password", value: "password123" },
            { type: "click", selector: "button[type='submit']" },
            { type: "wait", selector: ".dashboard" },
          ],
        };

        const res = await fetch(`${API_BASE}/api/tests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(test),
        });

        const data = await res.json();
        alert(`✅ Login test created! Test ID: ${data.testId}`);
        fetchTests();
      }

      // Open live dashboard
      function openLiveDashboard() {
        window.open(`${API_BASE}/dashboard/`, "_blank");
      }

      // Fetch agents
      async function fetchAgents() {
        const res = await fetch(`${API_BASE}/api/agents`);
        const data = await res.json();

        const html = data.agents
          .map(
            (agent) => `
        <div class="agent ${agent.status}">
          <strong>${agent.name}</strong>
          <br>Status: ${agent.status}
          ${agent.testId ? `<br>Running: ${agent.testId}` : ""}
        </div>
      `
          )
          .join("");

        document.getElementById("agents").innerHTML =
          html || "<p>No agents running</p>";
      }

      // Fetch tests
      async function fetchTests() {
        // Implementation depends on your API
        // This is a placeholder
        document.getElementById("tests").innerHTML =
          "<p>Check Supabase for test results</p>";
      }

      // Auto-refresh agents every 3 seconds
      setInterval(fetchAgents, 3000);

      // Initial load
      fetchAgents();
    </script>
  </body>
</html>
```

---

## 🎯 Quick Reference

| Endpoint                 | Method    | Purpose             |
| ------------------------ | --------- | ------------------- |
| `/health`                | GET       | Check server status |
| `/api/agents`            | GET       | List all agents     |
| `/api/tests`             | POST      | Create new test     |
| `/api/tests/:id/results` | GET       | Get test results    |
| `/dashboard/`            | GET       | Open live dashboard |
| `/viewer`                | WebSocket | Live agent stream   |

---

## 🚀 Next Steps

1. **Try the API**: Use the examples above
2. **Open Dashboard**: Visit `/dashboard/` to watch live
3. **Create Tests**: Post test cases to `/api/tests`
4. **Monitor Results**: Check Supabase or poll `/api/tests/:id/results`

---

**Need help?** Check [RAILWAY_TROUBLESHOOTING.md](RAILWAY_TROUBLESHOOTING.md) for common issues!
