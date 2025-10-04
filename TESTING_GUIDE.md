# Testing Guide - Multi-Agent Browser Testing System

Complete guide to testing your backend system.

## 🧪 Testing Checklist

- [ ] Database connection working
- [ ] Migrations applied correctly
- [ ] Sample tests loaded
- [ ] Single agent can run
- [ ] Multiple agents can run in parallel
- [ ] Screenshots are captured and uploaded
- [ ] Test results are recorded
- [ ] Agent health monitoring works
- [ ] Failed tests retry correctly
- [ ] Real-time updates working

## 1. Test Database Connection

### Verify Tables Exist

```bash
# Check all tables are created
echo "SELECT table_name FROM information_schema.tables WHERE table_schema='public';" | psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

Expected output:

```
 table_name
--------------
 agents
 test_cases
 test_results
 test_steps
```

### Verify Sample Tests

```bash
# Check test cases are loaded
echo "SELECT id, name, status, priority FROM test_cases ORDER BY priority DESC;" | psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

Expected output:

```
                  id                  |             name             | status  | priority
--------------------------------------+------------------------------+---------+----------
 16291c06-82d4-4e72-919c-a19a01bd4322 | Google Search Test           | pending |       10
 9b3609ac-e3de-473e-80eb-fa2f78676314 | HTTP Bin Form Test           | pending |        8
 c9903ebe-4fc8-43f2-92c0-53fa0f4db512 | GitHub Homepage Test         | pending |        7
 96081130-2721-4017-8a95-93b14c785575 | Example.com Navigation Test  | pending |        5
```

## 2. Test Single Agent

### Run One Agent

Open a terminal and run:

```bash
npm run agent
```

**What to Watch For:**

```
✅ Agent initialization
✅ Browser launched
✅ Test claimed from queue
✅ Actions executed one by one
✅ Screenshots captured
✅ Results recorded
✅ Agent goes idle and claims next test
```

**Expected Log Output:**

```
[info]: Initializing agent: agent-16291c06
[info]: Browser launched: chromium
[info]: Agent agent-16291c06 initialized successfully
[info]: Agent agent-16291c06 started, polling for tests...
[info]: Executing test: 16291c06-82d4-4e72-919c-a19a01bd4322
[info]: Test case: Google Search Test {"url":"https://www.google.com"}
[info]: Executing action: navigate
[info]: Step 1 passed: navigate
[info]: Executing action: wait
[info]: Step 2 passed: wait
...
[info]: Test completed successfully: 16291c06-82d4-4e72-919c-a19a01bd4322
```

### Verify Agent Registration

In another terminal:

```bash
# Check agent is registered and idle
echo "SELECT name, status, total_tests_run, successful_tests, failed_tests FROM agents;" | psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Verify Test Execution

```bash
# Check test results
echo "SELECT tr.status, tc.name, tr.duration_ms, a.name as agent_name FROM test_results tr JOIN test_cases tc ON tr.test_case_id = tc.id JOIN agents a ON tr.agent_id = a.id ORDER BY tr.created_at DESC LIMIT 5;" | psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Check Test Steps

```bash
# View detailed steps for latest test
echo "SELECT ts.step_number, ts.action_type, ts.status, ts.duration_ms FROM test_steps ts JOIN test_results tr ON ts.test_result_id = tr.id ORDER BY tr.created_at DESC, ts.step_number ASC LIMIT 10;" | psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Stop the Agent

Press `Ctrl+C` in the terminal running the agent.

**Expected:**

```
[info]: Received SIGINT, shutting down...
[info]: Agent stopped: agent-16291c06
```

## 3. Test Multiple Agents (Parallel Execution)

### Start Agent Spawner

```bash
npm run spawn
```

**What Should Happen:**

```
✅ 5 agents spawn (or your CONCURRENT_AGENTS setting)
✅ Each agent gets a unique ID
✅ Agents claim different tests
✅ Tests run in parallel
✅ All agents complete their tests
```

**Expected Output:**

```
[info]: Spawning 5 agents...
[info]: Agent 1 spawned (PID: 12345)
[info]: Agent 2 spawned (PID: 12346)
[info]: Agent 3 spawned (PID: 12347)
[info]: Agent 4 spawned (PID: 12348)
[info]: Agent 5 spawned (PID: 12349)
[info]: All 5 agents spawned successfully
```

### Monitor Agents in Real-Time

In another terminal:

```bash
# Watch agents table
watch -n 1 "echo 'SELECT name, status, current_test_id, total_tests_run, successful_tests, failed_tests FROM agents;' | psql postgresql://postgres:postgres@127.0.0.1:54322/postgres"
```

You should see:

- Agents switching from `idle` → `busy` → `idle`
- `current_test_id` changing as they work
- `total_tests_run` incrementing

### Stop All Agents

Press `Ctrl+C` in the spawner terminal.

## 4. Test Full System with Monitor

### Start Everything

```bash
npm start
```

This starts:

- Agent spawner (5 agents)
- Health monitor

**What to Check:**

1. **Agents Start Successfully**

   ```
   [info]: Starting Multi-Agent Browser Testing System...
   [info]: Configuration: 5 agents, chromium browser
   [info]: Spawning 5 agents...
   [info]: All 5 agents spawned successfully
   [info]: Starting agent monitor...
   ```

2. **Monitor Reports Statistics**

   ```
   [info]: Agent Statistics {
     total: 5,
     idle: 3,
     busy: 2,
     unhealthy: 0,
     offline: 0,
     totalTestsRun: 12,
     successfulTests: 10,
     failedTests: 2
   }
   ```

3. **Test Queue Statistics**
   ```
   [info]: Test Queue Statistics {
     pending: 2,
     running: 2,
     completed: 8,
     failed: 2
   }
   ```

### Watch Logs in Real-Time

Open another terminal:

```bash
tail -f logs/combined.log
```

Or for errors only:

```bash
tail -f logs/error.log
```

### Monitor in Supabase Studio

Open: http://127.0.0.1:54323

Navigate to **Table Editor** and open these tables in separate tabs:

- `agents` - Watch status changes
- `test_cases` - See tests being claimed
- `test_results` - See completed tests
- `test_steps` - See individual step execution

Enable **Realtime** to see live updates!

## 5. Test Screenshot Capture

### Verify Screenshots are Created

```bash
# Check storage via Supabase Studio
# Open: http://127.0.0.1:54323
# Go to: Storage → test-screenshots
```

You should see folders for each test result with screenshots:

```
test-screenshots/
├── {test-result-id}/
│   ├── step-0-before.jpg
│   ├── step-0-after.jpg
│   ├── step-1-before.jpg
│   ├── step-1-after.jpg
│   └── ...
```

### View Screenshots

Click on any screenshot in Supabase Studio to preview it.

Or get the public URL:

```bash
# Get screenshot URLs from database
echo "SELECT screenshot_before, screenshot_after FROM test_steps WHERE screenshot_before IS NOT NULL LIMIT 5;" | psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

## 6. Test Error Handling & Retries

### Create a Failing Test

Create a test with an invalid selector:

```bash
node -e "
import('./src/utils/testHelpers.js').then(({ createTestCase }) => {
  createTestCase({
    name: 'Intentional Failure Test',
    description: 'This test should fail and retry',
    url: 'https://example.com',
    actions: [
      { type: 'navigate', target: 'https://example.com' },
      { type: 'click', selector: '#non-existent-element' }
    ],
    priority: 10,
    max_retries: 2,
    tags: ['test', 'failure']
  });
});
"
```

### Watch It Retry

Start an agent:

```bash
npm run agent
```

**Expected Behavior:**

1. Agent claims the test
2. Test fails on the invalid selector
3. Agent marks it for retry
4. Test status goes back to `pending`
5. Agent claims it again (retry #1)
6. Fails again
7. Retries one more time (retry #2)
8. After max retries, marks as `failed`

### Verify Retry Count

```bash
echo "SELECT name, status, retry_count, max_retries FROM test_cases WHERE name LIKE '%Failure%';" | psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

## 7. Test Agent Health Monitoring

### Start Monitor

```bash
node src/orchestration/monitor.js
```

**What It Does:**

- Checks for stale agents every 10 seconds
- Logs statistics every 10 seconds
- Marks inactive agents as `offline`

### Simulate Agent Crash

1. Start an agent:

   ```bash
   npm run agent
   ```

2. Note its PID and kill it forcefully:

   ```bash
   kill -9 <PID>
   ```

3. Watch the monitor detect it:

   ```
   [warn]: Marked 1 stale agents as offline
   ```

4. Check agent status:
   ```bash
   echo "SELECT name, status, last_heartbeat FROM agents;" | psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
   ```

The killed agent should show `offline` status.

### Verify Test Release

If an agent was working on a test when it crashed:

```bash
echo "SELECT name, status, assigned_agent_id FROM test_cases WHERE status = 'pending' AND assigned_agent_id IS NULL;" | psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

The test should be released and available for another agent.

## 8. Test Headless vs Non-Headless Mode

### Run with Visible Browser

```bash
HEADLESS=false npm run agent
```

**What You'll See:**

- Chrome browser window opens
- You can watch the test execute in real-time
- Browser navigates, clicks, fills forms
- Great for debugging!

### Run Headless (Production Mode)

```bash
HEADLESS=true npm run agent
```

No browser window appears, but tests run faster.

## 9. Test Different Browser Types

### Test with Firefox

```bash
# Install Firefox for Playwright
npx playwright install firefox

# Run with Firefox
BROWSER_TYPE=firefox npm run agent
```

### Test with WebKit (Safari)

```bash
# Install WebKit
npx playwright install webkit

# Run with WebKit
BROWSER_TYPE=webkit npm run agent
```

## 10. Performance Testing

### Test High Concurrency

Edit `.env`:

```env
CONCURRENT_AGENTS=10
```

Then start:

```bash
npm start
```

**Monitor:**

- CPU usage
- Memory usage
- Database connections
- Test throughput

### Measure Test Duration

```bash
echo "SELECT tc.name, AVG(tr.duration_ms) as avg_duration, MIN(tr.duration_ms) as min_duration, MAX(tr.duration_ms) as max_duration, COUNT(*) as executions FROM test_results tr JOIN test_cases tc ON tr.test_case_id = tc.id WHERE tr.status = 'completed' GROUP BY tc.name;" | psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

## 11. Integration Testing

### Create a Custom Test Suite

```javascript
// test-suite.js
import { createTestCase } from "./src/utils/testHelpers.js";

const tests = [
  {
    name: "Login Test",
    url: "https://example.com/login",
    actions: [
      { type: "navigate", target: "https://example.com/login" },
      { type: "fill", selector: "#username", value: "testuser" },
      { type: "fill", selector: "#password", value: "password123" },
      { type: "click", selector: "#login-button" },
      { type: "wait", selector: ".dashboard", timeout: 5000 },
      {
        type: "assert",
        selector: ".user-name",
        assertType: "text",
        expected: "testuser",
      },
    ],
    priority: 10,
    tags: ["auth", "smoke"],
  },
  {
    name: "Logout Test",
    url: "https://example.com/dashboard",
    actions: [
      { type: "navigate", target: "https://example.com/dashboard" },
      { type: "click", selector: "#logout-button" },
      { type: "wait", selector: "#login-form", timeout: 5000 },
    ],
    priority: 5,
    tags: ["auth"],
  },
];

for (const test of tests) {
  await createTestCase(test);
  console.log(`✅ Created: ${test.name}`);
}
```

Run it:

```bash
node test-suite.js
```

## 12. Debugging Failed Tests

### Check Error Messages

```bash
echo "SELECT tc.name, tr.error_message, tr.error_stack FROM test_results tr JOIN test_cases tc ON tr.test_case_id = tc.id WHERE tr.status = 'failed' ORDER BY tr.created_at DESC LIMIT 5;" | psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Check Failed Steps

```bash
echo "SELECT ts.step_number, ts.action_type, ts.error_message FROM test_steps ts WHERE ts.status = 'failed' ORDER BY ts.created_at DESC LIMIT 10;" | psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### View Screenshots of Failure

1. Go to Supabase Studio: http://127.0.0.1:54323
2. Navigate to Storage → test-screenshots
3. Find the test result ID
4. View the last screenshot before failure

## 13. Load Testing

### Add Many Tests

```bash
node -e "
import('./src/utils/testHelpers.js').then(async ({ createTestCase }) => {
  for (let i = 0; i < 20; i++) {
    await createTestCase({
      name: \`Load Test \${i + 1}\`,
      url: 'https://example.com',
      actions: [
        { type: 'navigate', target: 'https://example.com' },
        { type: 'wait', selector: 'h1', timeout: 5000 }
      ],
      priority: Math.floor(Math.random() * 10),
      tags: ['load-test']
    });
  }
  console.log('✅ Created 20 test cases');
});
"
```

### Run and Monitor

```bash
# Start system
npm start

# In another terminal, watch progress
watch -n 2 "echo 'SELECT status, COUNT(*) FROM test_cases GROUP BY status;' | psql postgresql://postgres:postgres@127.0.0.1:54322/postgres"
```

## 14. Cleanup

### Reset Local Database

```bash
supabase db reset
```

This will:

- Drop all data
- Reapply migrations
- Give you a fresh start

### Remove All Test Cases

```bash
echo "DELETE FROM test_cases;" | psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Remove All Agents

```bash
echo "DELETE FROM agents;" | psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Clear Storage

In Supabase Studio:

1. Go to Storage → test-screenshots
2. Select all files
3. Delete

## 🎯 Testing Checklist Results

After completing all tests, you should verify:

- [x] ✅ Database connection working
- [x] ✅ Migrations applied correctly
- [x] ✅ Sample tests loaded
- [x] ✅ Single agent can run
- [x] ✅ Multiple agents can run in parallel
- [x] ✅ Screenshots are captured and uploaded
- [x] ✅ Test results are recorded
- [x] ✅ Agent health monitoring works
- [x] ✅ Failed tests retry correctly
- [x] ✅ Real-time updates working

## 📊 Expected Metrics

After running all sample tests:

```
Total Agents: 5
Total Tests Run: 4
Successful Tests: 4
Failed Tests: 0
Average Test Duration: 5-15 seconds per test
Screenshots Captured: 12-20 per test (depending on actions)
```

## 🐛 Common Issues

### Issue: Agent stuck in "busy" status

**Solution:**

```bash
# Mark stuck agents as idle
echo "UPDATE agents SET status = 'idle', current_test_id = NULL WHERE status = 'busy';" | psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Issue: Tests stuck in "running" status

**Solution:**

```bash
# Reset stuck tests
echo "UPDATE test_cases SET status = 'pending', assigned_agent_id = NULL WHERE status = 'running';" | psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Issue: Playwright browser not found

**Solution:**

```bash
npx playwright install chromium
```

### Issue: Can't connect to database

**Solution:**

```bash
# Check if Supabase is running
supabase status

# If not running, start it
supabase start
```

---

## 🚀 Ready for Production!

Once all tests pass, your backend is ready for production deployment!

Next steps:

1. Deploy agents to production servers
2. Update environment variables with production Supabase credentials
3. Set up monitoring and alerts
4. Build the frontend dashboard

**Happy Testing! 🧪**
