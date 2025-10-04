# 🚂 Railway Deployment Guide

## Question: Parallel vs Queue?

**Answer: BOTH! 🎉**

When you deploy to Railway, you get **parallel execution within each instance** based on your `CONCURRENT_AGENTS` setting.

---

## How It Works

### Architecture Overview

```
Railway Instance
├── Agent Process 1  ┐
├── Agent Process 2  │
├── Agent Process 3  ├─ CONCURRENT_AGENTS=5
├── Agent Process 4  │
└── Agent Process 5  ┘
         ↓
    Supabase Queue
    ├── Test 1 (claimed by Agent 1)
    ├── Test 2 (claimed by Agent 2)
    ├── Test 3 (claimed by Agent 3)
    ├── Test 4 (claimed by Agent 4)
    ├── Test 5 (claimed by Agent 5)
    └── Test 6 (waiting in queue)
```

### Key Points:

1. **✅ Parallel Execution**: Multiple agents run simultaneously
2. **✅ Queue System**: Tests wait if all agents are busy
3. **✅ Atomic Claiming**: No duplicate test execution
4. **✅ Auto-scaling**: Agents pick up next test automatically

---

## Deployment Options

### Option 1: Single Railway Instance (Recommended for most)

```bash
# .env on Railway
CONCURRENT_AGENTS=5        # 5 parallel agents
HEADLESS=true             # Must be true on Railway
AI_MODE=true              # Enable AI agents
ANTHROPIC_API_KEY=sk-...
```

**Result:**

- 5 tests run **in parallel**
- 6th+ tests wait in queue
- Cost: 1x Railway instance ($5-20/month)

### Option 2: Multiple Railway Instances (High Volume)

Deploy the same app 3 times to Railway, all pointing to same Supabase:

```bash
# Instance 1
CONCURRENT_AGENTS=5

# Instance 2
CONCURRENT_AGENTS=5

# Instance 3
CONCURRENT_AGENTS=5
```

**Result:**

- 15 tests run **in parallel** (5 × 3)
- 16th+ tests wait in queue
- Cost: 3x Railway instances

### Option 3: Scale Vertically

```bash
# One powerful instance
CONCURRENT_AGENTS=20
```

**Result:**

- 20 tests run **in parallel**
- Higher memory/CPU requirements
- May need Railway Pro plan

---

## Railway Setup Steps

### 1. Create Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize
railway init
```

### 2. Configure Environment Variables

In Railway dashboard, add:

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# Agent Config
CONCURRENT_AGENTS=5
HEADLESS=true
AI_MODE=true

# Browser
BROWSER_TYPE=chromium
VIEWPORT_WIDTH=1920
VIEWPORT_HEIGHT=1080

# Live Stream (optional)
ENABLE_LIVE_STREAM=true
LIVE_STREAM_FPS=2
LIVE_STREAM_PORT=3001
```

### 3. Add Buildpacks

Railway auto-detects Node.js, but you may need to add:

```bash
# railway.json
{
  "build": {
    "buildCommand": "npm install && npx playwright install chromium"
  },
  "deploy": {
    "startCommand": "npm start"
  }
}
```

### 4. Deploy

```bash
railway up
```

### 5. Configure Frontend (Optional - for browser extension)

The **dashboard is already configured** and will work automatically! 🎉

For the **browser extension**, update the default server URL:

```bash
# After deployment, copy your Railway URL
railway open  # Opens your app, copy the URL

# Edit browser-extension/popup.js line 23:
# Change from: 'http://localhost:3001'
# Change to: 'https://your-app-name.railway.app'
```

See **[FRONTEND_RAILWAY_SETUP.md](FRONTEND_RAILWAY_SETUP.md)** for detailed instructions.

---

## Performance & Costs

### Railway Costs

| Plan        | Memory | vCPU | Agents | Cost/Month |
| ----------- | ------ | ---- | ------ | ---------- |
| **Hobby**   | 512MB  | 0.5  | 1-2    | $5         |
| **Starter** | 2GB    | 1    | 3-5    | $10        |
| **Pro**     | 8GB    | 2    | 10-20  | $20+       |

### Claude API Costs (Per Test)

| Steps    | Cost       | Example            |
| -------- | ---------- | ------------------ |
| 5 steps  | $0.05-0.15 | Simple form test   |
| 10 steps | $0.10-0.30 | Login + navigation |
| 30 steps | $0.30-0.90 | Complex user flow  |
| 50 steps | $0.50-1.50 | Full e2e scenario  |

### Example: 100 Tests/Day

```
Scenario: 100 tests × 10 steps average

Railway: $10-20/month (fixed)
Claude: $10-30/day = $300-900/month (variable)

Total: ~$310-920/month
```

**💡 Tip**: Use AI for exploratory/critical tests, Playwright for regression tests to save costs.

---

## Monitoring Parallel Execution

### Check Active Agents

```bash
# API endpoint
curl https://your-app.railway.app/api/agents

# Response
{
  "agents": [
    {
      "id": "abc123",
      "name": "agent-abc123",
      "status": "busy",
      "currentTestId": "test-456"
    },
    {
      "id": "def456",
      "name": "agent-def456",
      "status": "busy",
      "currentTestId": "test-789"
    },
    ...
  ]
}
```

### Live Dashboard

```
https://your-app.railway.app/dashboard/
```

Shows:

- ✅ How many agents are running
- 🔄 Which tests are executing
- ⏳ Queue length
- 📊 Real-time stats

### Logs

```bash
railway logs
```

You'll see completion notifications:

```
✅ Agent agent-abc123 finished test test-456
⏱️  Duration: 23.45s
📸 Screenshots: 8 steps captured

🤖 AI AGENT agent-def456 FINISHED TEST
📋 Test: Login flow test
⏱️  Duration: 15.67s
🤖 AI Steps: 12/50
📊 Result: PASSED ✅
```

---

## FAQ

### Q: Will tests run in parallel on Railway?

**A: YES!** Each instance runs `CONCURRENT_AGENTS` agents in parallel.

### Q: What happens if all agents are busy?

**A: Queue!** New tests wait in Supabase queue until an agent becomes available.

### Q: Can I deploy multiple instances?

**A: YES!** All instances can share the same Supabase database. Agents will claim tests atomically.

### Q: How do I scale up?

**A: Two ways:**

1. Increase `CONCURRENT_AGENTS` (vertical scaling)
2. Deploy more Railway instances (horizontal scaling)

### Q: Will I have conflicts with multiple instances?

**A: NO!** The database uses atomic `claim_test()` RPC function to prevent race conditions.

### Q: How much does it cost?

**A: Railway:** $5-20/month per instance  
**Claude API:** ~$0.10-0.50 per AI test  
**Supabase:** Free tier covers most use cases

### Q: Can I use standard Playwright tests?

**A: YES!** Set `AI_MODE=false` to disable AI. Tests run with pre-scripted actions (free, no Claude costs).

---

## Best Practices

### 1. Start Small

```bash
CONCURRENT_AGENTS=3
```

Monitor performance, then scale up.

### 2. Use Headless Mode

```bash
HEADLESS=true
```

Railway doesn't have a display, so headless is required.

### 3. Monitor Costs

- Set up billing alerts in Anthropic console
- Track test steps to estimate costs
- Use Playwright for high-volume tests

### 4. Set Reasonable Limits

```javascript
// In test metadata
{
  "maxSteps": 30,  // Prevent runaway AI tests
  "timeout": 120000 // 2 minute timeout
}
```

### 5. Use Live Stream for Debugging

```bash
ENABLE_LIVE_STREAM=true
```

Watch agents in real-time via dashboard.

---

## Example: Load 20 Tests

```javascript
// create-test.js - Load 20 tests
import supabase from "./src/lib/supabase.js";

const tests = [];
for (let i = 1; i <= 20; i++) {
  tests.push({
    name: `Test ${i}`,
    url: "https://example.com",
    actions: [{ type: "ai_autonomous", description: `Complete task ${i}` }],
    status: "pending",
  });
}

await supabase.from("test_cases").insert(tests);
```

**With CONCURRENT_AGENTS=5:**

```
Time 0s:  Tests 1-5  → Agents 1-5 (parallel)
Time 30s: Tests 6-10 → Agents 1-5 (parallel)
Time 60s: Tests 11-15 → Agents 1-5 (parallel)
Time 90s: Tests 16-20 → Agents 1-5 (parallel)

Total: ~2 minutes for 20 tests
```

**With CONCURRENT_AGENTS=20:**

```
Time 0s: Tests 1-20 → Agents 1-20 (parallel)

Total: ~30 seconds for 20 tests
```

---

## Deploy Now!

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Initialize
railway init

# 4. Add environment variables in Railway dashboard

# 5. Deploy
railway up

# 6. Check logs
railway logs

# 7. Open dashboard
railway open
```

---

**You're ready to deploy! 🚀**

Your agents will run in **parallel** and handle tests from the **queue** automatically.

---

## Frontend Configuration

### Dashboard (Already Works! ✅)

The live dashboard is **automatically configured** - it detects whether you're on localhost or Railway and connects accordingly. No changes needed!

Just open: `https://your-app.railway.app/dashboard/`

### Browser Extension (One-line Update)

After deploying to Railway, update the extension's default server URL:

1. Copy your Railway URL: `railway open`
2. Edit `browser-extension/popup.js` line 23
3. Change from: `'http://localhost:3001'`
4. Change to: `'https://your-app-name.railway.app'`
5. Reload extension in Chrome

**See [FRONTEND_RAILWAY_SETUP.md](FRONTEND_RAILWAY_SETUP.md) for detailed instructions.**

---

## Complete Deployment Checklist

### Backend

- [ ] Install Railway CLI
- [ ] Login and initialize project
- [ ] Add all environment variables in Railway
- [ ] Deploy with `railway up`
- [ ] Verify health endpoint

### Frontend

- [ ] Dashboard: No changes needed! ✅
- [ ] Extension: Update popup.js with Railway URL
- [ ] Reload extension
- [ ] Test connection

### Verification

- [ ] Check Railway logs
- [ ] Open dashboard - should see "Connected"
- [ ] Start test from extension
- [ ] Verify agents appear in dashboard
- [ ] Check Supabase for test results

---

## Related Docs

- **[FRONTEND_RAILWAY_SETUP.md](FRONTEND_RAILWAY_SETUP.md)** - Frontend configuration details
- **[AI_AGENT_GUIDE.md](AI_AGENT_GUIDE.md)** - AI agent documentation
- **[README.md](README.md)** - Quick start guide
