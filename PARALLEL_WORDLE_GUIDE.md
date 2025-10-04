# 🎮 Parallel Wordle Testing Guide

How to run multiple agents testing Wordle simultaneously.

---

## 🎯 Goal

Run 5 (or more) agents all playing Wordle at the same time in parallel.

---

## 🚀 Quick Start

### Option 1: Using the Test Script (Easiest)

```bash
# Create 5 Wordle tests at once
node create-parallel-wordle-tests.js
```

This creates 5 identical Wordle tests. All 5 idle agents will pick them up and run in parallel!

### Option 2: Using API (Programmatic)

```bash
# Run the parallel test script
node examples/parallel-wordle.js
```

### Option 3: Manual (via API)

```bash
# Create 5 tests manually
for i in {1..5}; do
  curl -X POST https://multi-agent-testing-production.up.railway.app/api/tests \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Parallel Wordle Test '$i'",
      "url": "https://www.nytimes.com/games/wordle/",
      "actions": [{
        "type": "ai_autonomous",
        "description": "Play Wordle - close modals, make intelligent guesses"
      }],
      "metadata": {"mode": "ai_autonomous", "maxSteps": 50}
    }'
done
```

---

## 📝 Step-by-Step Guide

### Step 1: Create the Test Script

Create `create-parallel-wordle-tests.js`:

```javascript
import supabase from "./src/lib/supabase.js";

async function createParallelWordleTests(count = 5) {
  console.log(`🎮 Creating ${count} parallel Wordle tests...`);

  const tests = [];

  for (let i = 1; i <= count; i++) {
    tests.push({
      name: `Parallel Wordle Test ${i}`,
      url: "https://www.nytimes.com/games/wordle/",
      description: `AI agent plays Wordle (parallel test ${i})`,
      actions: [
        {
          type: "ai_autonomous",
          description:
            "Play Wordle - Close any modals, type intelligent word guesses, try to solve the puzzle",
        },
      ],
      status: "pending",
      max_retries: 1,
      retry_count: 0,
      metadata: {
        mode: "ai_autonomous",
        maxSteps: 50,
        parallelGroup: "wordle-batch-1",
      },
    });
  }

  const { data, error } = await supabase
    .from("test_cases")
    .insert(tests)
    .select();

  if (error) {
    console.error("❌ Error creating tests:", error);
    process.exit(1);
  }

  console.log(`✅ Created ${data.length} Wordle tests!`);
  console.log(
    "Test IDs:",
    data.map((t) => t.id)
  );
  console.log("\n🎬 Open dashboard to watch: http://localhost:3001/dashboard/");
  console.log(
    "Or Railway: https://multi-agent-testing-production.up.railway.app/dashboard/"
  );

  return data;
}

// Run it
createParallelWordleTests(5)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

### Step 2: Run the Script

```bash
node create-parallel-wordle-tests.js
```

### Step 3: Watch Live

Open the dashboard:

```
http://localhost:3001/dashboard/
```

Or on Railway:

```
https://multi-agent-testing-production.up.railway.app/dashboard/
```

You'll see **all 5 agents** running Wordle simultaneously! 🎉

---

## 🎬 What You'll See

### In the Dashboard

```
Agent 1: Playing Wordle... (Step 5/50)
Agent 2: Playing Wordle... (Step 8/50)
Agent 3: Playing Wordle... (Step 3/50)
Agent 4: Playing Wordle... (Step 12/50)
Agent 5: Playing Wordle... (Step 6/50)
```

Each agent:

- Opens Wordle independently
- Closes modals
- Makes word guesses
- All running **at the same time**!

### In the Logs

```
[info]: Agent agent-abc123 started test test-wordle-1
[info]: Agent agent-def456 started test test-wordle-2
[info]: Agent agent-ghi789 started test test-wordle-3
[info]: Agent agent-jkl012 started test test-wordle-4
[info]: Agent agent-mno345 started test test-wordle-5

[info]: 🧠 AI Step 1/50: Analyzing page... (agent-abc123)
[info]: 🧠 AI Step 1/50: Analyzing page... (agent-def456)
[info]: 🧠 AI Step 1/50: Analyzing page... (agent-ghi789)
```

---

## ⚙️ Configuration

### Adjust Number of Parallel Tests

```javascript
// Create 10 tests instead of 5
createParallelWordleTests(10);
```

**Note:** With `CONCURRENT_AGENTS=5`, tests 6-10 will wait in queue until agents finish tests 1-5.

### Increase Concurrent Agents

In Railway or `.env`:

```bash
CONCURRENT_AGENTS=10  # Run 10 agents in parallel
```

Now all 10 Wordle tests run simultaneously!

### Adjust Max Steps

```javascript
metadata: {
  mode: 'ai_autonomous',
  maxSteps: 30,  // Shorter tests (default: 50)
}
```

---

## 📊 Example: Full Parallel Test Suite

Create `examples/parallel-wordle.js`:

```javascript
import supabase from "../src/lib/supabase.js";

async function runParallelWordleTests() {
  console.log("🎮 Starting Parallel Wordle Test Suite...\n");

  // Create 5 Wordle tests
  const tests = Array.from({ length: 5 }, (_, i) => ({
    name: `Parallel Wordle ${i + 1}`,
    url: "https://www.nytimes.com/games/wordle/",
    actions: [
      {
        type: "ai_autonomous",
        description:
          "Play Wordle intelligently - close modals, make smart guesses",
      },
    ],
    status: "pending",
    max_retries: 1,
    retry_count: 0,
    metadata: {
      mode: "ai_autonomous",
      maxSteps: 50,
      batchId: `wordle-${Date.now()}`,
    },
  }));

  console.log(`📝 Creating ${tests.length} tests...`);

  const { data, error } = await supabase
    .from("test_cases")
    .insert(tests)
    .select();

  if (error) throw error;

  console.log(`✅ ${data.length} tests created!\n`);

  // Monitor progress
  console.log("📊 Monitoring test progress...\n");

  const testIds = data.map((t) => t.id);
  let completed = 0;

  const checkInterval = setInterval(async () => {
    const { data: results } = await supabase
      .from("test_results")
      .select("*")
      .in("test_case_id", testIds)
      .in("status", ["completed", "failed"]);

    if (results && results.length > completed) {
      completed = results.length;
      console.log(`✅ Progress: ${completed}/${testIds.length} tests finished`);

      if (completed === testIds.length) {
        clearInterval(checkInterval);

        // Show summary
        const passed = results.filter((r) => r.status === "completed").length;
        const failed = results.filter((r) => r.status === "failed").length;

        console.log("\n🎯 Final Results:");
        console.log(`   Passed: ${passed}`);
        console.log(`   Failed: ${failed}`);
        console.log(`   Total:  ${completed}`);

        process.exit(0);
      }
    }
  }, 5000); // Check every 5 seconds
}

runParallelWordleTests().catch(console.error);
```

Run it:

```bash
node examples/parallel-wordle.js
```

Output:

```
🎮 Starting Parallel Wordle Test Suite...

📝 Creating 5 tests...
✅ 5 tests created!

📊 Monitoring test progress...

✅ Progress: 1/5 tests finished
✅ Progress: 2/5 tests finished
✅ Progress: 3/5 tests finished
✅ Progress: 4/5 tests finished
✅ Progress: 5/5 tests finished

🎯 Final Results:
   Passed: 4
   Failed: 1
   Total:  5
```

---

## 🔍 Verifying Parallel Execution

### Check Agent Status

```bash
curl https://multi-agent-testing-production.up.railway.app/api/agents
```

You should see:

```json
{
  "agents": [
    { "id": "agent-1", "status": "busy", "testId": "test-wordle-1" },
    { "id": "agent-2", "status": "busy", "testId": "test-wordle-2" },
    { "id": "agent-3", "status": "busy", "testId": "test-wordle-3" },
    { "id": "agent-4", "status": "busy", "testId": "test-wordle-4" },
    { "id": "agent-5", "status": "busy", "testId": "test-wordle-5" }
  ]
}
```

All 5 agents are **busy** with different test IDs = **parallel execution**! ✅

### Check Logs

```bash
railway logs
```

Or locally:

```bash
tail -f logs/combined.log
```

Look for:

```
[info]: Agent agent-1 executing test test-wordle-1
[info]: Agent agent-2 executing test test-wordle-2
[info]: Agent agent-3 executing test test-wordle-3
[info]: Agent agent-4 executing test test-wordle-4
[info]: Agent agent-5 executing test test-wordle-5
```

All running at the **same time** (same timestamp)!

---

## 📈 Scaling Up

### Run 20 Tests in Parallel

```javascript
// Create 20 tests
createParallelWordleTests(20);

// But only have 5 agents:
// Tests 1-5:  Run immediately (parallel)
// Tests 6-10: Start when agents finish (parallel)
// Tests 11-15: Start when agents finish (parallel)
// Tests 16-20: Start when agents finish (parallel)
```

**Total time:** ~4 batches of 5 = 4x single test time

### Increase Agents for True Parallel

```bash
# In Railway, set:
CONCURRENT_AGENTS=20

# Now all 20 tests run simultaneously!
```

---

## 💰 Cost Considerations

Running AI tests in parallel increases Claude API costs:

```
1 AI Wordle test ≈ $0.20-0.50
5 parallel tests  ≈ $1.00-2.50
20 parallel tests ≈ $4.00-10.00
```

**Tips to reduce costs:**

1. **Limit max steps:**

   ```javascript
   metadata: {
     maxSteps: 20;
   } // Instead of 50
   ```

2. **Use standard Playwright for high-volume:**

   ```javascript
   // Pre-scripted actions (free, no AI)
   actions: [
     { type: "click", selector: "button.close" },
     { type: "keyboard", key: "A" },
     { type: "keyboard", key: "B" },
     // ...
   ];
   ```

3. **Mix AI and standard tests:**
   - AI for exploratory/critical tests
   - Playwright for regression/volume tests

---

## 🎯 Real-World Example

### Test 10 Different Websites in Parallel

```javascript
const websites = [
  {
    name: "Wordle",
    url: "https://www.nytimes.com/games/wordle/",
    goal: "Play Wordle",
  },
  {
    name: "Google",
    url: "https://google.com",
    goal: 'Search for "AI testing"',
  },
  {
    name: "GitHub",
    url: "https://github.com",
    goal: "Navigate to trending repos",
  },
  { name: "Twitter", url: "https://twitter.com", goal: "Browse homepage" },
  { name: "Reddit", url: "https://reddit.com", goal: "Click top post" },
  { name: "Amazon", url: "https://amazon.com", goal: "Search for laptops" },
  { name: "YouTube", url: "https://youtube.com", goal: "Search for videos" },
  { name: "LinkedIn", url: "https://linkedin.com", goal: "View jobs page" },
  { name: "Netflix", url: "https://netflix.com", goal: "Check homepage" },
  { name: "Spotify", url: "https://spotify.com", goal: "Browse music" },
];

const tests = websites.map((site) => ({
  name: `AI Test: ${site.name}`,
  url: site.url,
  actions: [
    {
      type: "ai_autonomous",
      description: site.goal,
    },
  ],
  status: "pending",
  metadata: { mode: "ai_autonomous", maxSteps: 30 },
}));

await supabase.from("test_cases").insert(tests);
```

With `CONCURRENT_AGENTS=10`, all 10 websites get tested **simultaneously**! 🚀

---

## 🎬 Summary

**To run parallel Wordle tests:**

1. **Create multiple tests** (same URL, same actions)
2. **Agents pick them up automatically** (from queue)
3. **All run in parallel** (up to `CONCURRENT_AGENTS` limit)
4. **Watch in dashboard** (see all agents working)

**Key Points:**

- ✅ Tests run in parallel automatically
- ✅ No special configuration needed
- ✅ Queue handles overflow (if tests > agents)
- ✅ Each agent runs independently
- ✅ Live dashboard shows all agents

---

**Ready to test?** Run:

```bash
node create-parallel-wordle-tests.js
```

Then open: http://localhost:3001/dashboard/ 🎉
