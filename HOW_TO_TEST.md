# How to Test the Backend - Quick Guide

## 🚀 Quick Test (30 seconds)

Run the automated test suite:

```bash
npm run test:backend
```

This checks:

- ✅ Supabase is running
- ✅ Database connection
- ✅ All tables exist
- ✅ Sample tests loaded
- ✅ Storage bucket configured

## 🧪 Manual Testing Steps

### Step 1: Test Single Agent (Watch the Browser)

```bash
npm run test:single
```

**What you'll see:**

- Browser window opens
- Agent navigates to test URLs
- Actions execute visually
- Screenshots captured
- Test completes

**Expected:** One test completes successfully in 10-30 seconds.

---

### Step 2: Test Multiple Agents

```bash
npm run spawn
```

**What you'll see:**

- 5 agents start in parallel
- Each agent claims a different test
- Tests run simultaneously
- All complete in ~15-40 seconds

**Expected:** All 4 sample tests complete.

---

### Step 3: Test Full System with Monitoring

```bash
npm start
```

**What you'll see:**

```
Starting Multi-Agent Browser Testing System...
Configuration: 5 agents, chromium browser
Spawning 5 agents...
All 5 agents spawned successfully
Starting agent monitor...
Agent Statistics { total: 5, idle: 2, busy: 3, ... }
Test Queue Statistics { pending: 1, running: 3, completed: 2 }
```

**Expected:** Real-time statistics every 10 seconds.

---

### Step 4: View Results in Supabase Studio

Open: **http://127.0.0.1:54323**

Navigate to **Table Editor**:

1. **`agents`** - See agent status (idle/busy)
2. **`test_cases`** - See test queue
3. **`test_results`** - See completed tests
4. **`test_steps`** - See individual steps
5. **Storage → test-screenshots** - View screenshots

---

### Step 5: Watch Logs in Real-Time

```bash
npm run test:watch
```

Or manually:

```bash
tail -f logs/combined.log
```

---

## 🎯 What to Look For

### ✅ Success Indicators

1. **Agent Registration**

   ```
   [info]: Initializing agent: agent-16291c06
   [info]: Browser launched: chromium
   [info]: Agent registered successfully
   ```

2. **Test Execution**

   ```
   [info]: Executing test: 16291c06-82d4-4e72-919c-a19a01bd4322
   [info]: Test case: Google Search Test
   [info]: Step 1 passed: navigate
   [info]: Step 2 passed: wait
   [info]: Test completed successfully
   ```

3. **Screenshot Capture**

   ```
   [info]: Screenshot captured: step-0-before.jpg
   [info]: Screenshot uploaded successfully
   ```

4. **Results Recorded**
   - Check `test_results` table
   - Status should be 'completed'
   - Duration_ms should be > 0
   - Screenshots array should have entries

---

## 📊 Verify Results

### Check Database

```bash
# View test results
echo "SELECT tc.name, tr.status, tr.duration_ms FROM test_results tr JOIN test_cases tc ON tr.test_case_id = tc.id;" | psql postgresql://postgres:postgres@127.0.0.1:54322/postgres

# View agent stats
echo "SELECT name, status, total_tests_run, successful_tests FROM agents;" | psql postgresql://postgres:postgres@127.0.0.1:54322/postgres

# View pending tests
echo "SELECT name, status FROM test_cases WHERE status='pending';" | psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Check Screenshots

1. Go to http://127.0.0.1:54323
2. Navigate to **Storage → test-screenshots**
3. You should see folders like:
   - `{test-result-uuid}/step-0-before.jpg`
   - `{test-result-uuid}/step-0-after.jpg`
   - etc.

---

## 🔍 Test Scenarios

### Scenario 1: Happy Path (All Tests Pass)

```bash
# 1. Start system
npm start

# 2. Wait 30-60 seconds

# 3. Check results
echo "SELECT status, COUNT(*) FROM test_cases GROUP BY status;" | psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

**Expected:**

```
 status    | count
-----------+-------
 completed |     4
```

---

### Scenario 2: Test Failure & Retry

Create a failing test:

```javascript
node -e "
import('./src/utils/testHelpers.js').then(({ createTestCase }) => {
  createTestCase({
    name: 'Failing Test',
    url: 'https://example.com',
    actions: [
      { type: 'navigate', target: 'https://example.com' },
      { type: 'click', selector: '#does-not-exist' }
    ],
    max_retries: 2,
    priority: 10
  });
});
"
```

Run an agent:

```bash
npm run agent
```

**Expected:**

- Test fails on invalid selector
- Automatically retries (2 times)
- After retries, marked as 'failed'
- Error message captured in `test_results`

---

### Scenario 3: Agent Health Monitoring

```bash
# Terminal 1: Start monitor
npm run monitor

# Terminal 2: Start an agent
npm run agent

# Terminal 3: Kill the agent forcefully
ps aux | grep "agent/worker.js"
kill -9 <PID>

# Back to Terminal 1: Monitor should detect it
```

**Expected:**

```
[warn]: Marked 1 stale agents as offline
```

---

### Scenario 4: Parallel Execution

```bash
# Load 20 tests
for i in {1..20}; do
  node -e "
  import('./src/utils/testHelpers.js').then(({ createTestCase }) => {
    createTestCase({
      name: 'Load Test $i',
      url: 'https://example.com',
      actions: [
        { type: 'navigate', target: 'https://example.com' },
        { type: 'wait', selector: 'h1', timeout: 5000 }
      ],
      priority: Math.floor(Math.random() * 10)
    });
  });
  "
done

# Start system with 5 agents
npm start

# Watch progress
watch -n 2 "echo 'SELECT status, COUNT(*) FROM test_cases GROUP BY status;' | psql postgresql://postgres:postgres@127.0.0.1:54322/postgres"
```

**Expected:**

- Tests distributed across 5 agents
- ~5 tests running simultaneously
- All complete in ~1-2 minutes

---

## 🐛 Troubleshooting Tests

### Issue: Agent won't start

**Check:**

```bash
# Playwright installed?
npx playwright install chromium

# Supabase running?
supabase status

# Logs?
cat logs/error.log
```

### Issue: Tests stuck in "running"

**Fix:**

```bash
# Reset stuck tests
echo "UPDATE test_cases SET status='pending', assigned_agent_id=NULL WHERE status='running';" | psql postgresql://postgres:postgres@127.0.0.1:54322/postgres
```

### Issue: Screenshots not saving

**Check:**

```bash
# Storage bucket exists?
echo "SELECT * FROM storage.buckets WHERE id='test-screenshots';" | psql postgresql://postgres:postgres@127.0.0.1:54322/postgres

# Policies applied?
supabase db reset
```

### Issue: Database connection failed

**Fix:**

```bash
# Restart Supabase
supabase stop
supabase start

# Update .env with new credentials
```

---

## 📈 Performance Testing

### Test High Concurrency

Edit `.env`:

```env
CONCURRENT_AGENTS=10
```

Then:

```bash
npm start
```

**Monitor:**

- CPU usage (should stay reasonable)
- Memory (each agent ~100-200MB)
- Database connections
- Test throughput

---

## ✅ Success Criteria

After testing, you should have:

- [x] ✅ All 4 sample tests completed
- [x] ✅ Agents registered and went idle
- [x] ✅ Test results recorded with durations
- [x] ✅ Screenshots captured and stored
- [x] ✅ Test steps logged for each test
- [x] ✅ No errors in logs
- [x] ✅ Monitoring reports accurate stats

---

## 🎓 Learn More

- **Full Testing Guide**: `TESTING_GUIDE.md` - Comprehensive testing documentation
- **Quick Start**: `QUICK_START.md` - Get started quickly
- **Setup Guide**: `SETUP_GUIDE.md` - Detailed setup instructions
- **Supabase CLI**: `SUPABASE_CLI_SETUP.md` - CLI reference

---

## 🚀 Next Steps After Testing

1. ✅ **Backend working** → Build frontend dashboard
2. ✅ **Tests passing** → Create your own test cases
3. ✅ **System stable** → Deploy to production
4. ✅ **Monitoring good** → Set up alerts

---

## 📞 Quick Commands Reference

```bash
# Test backend
npm run test:backend

# Single agent (watch browser)
npm run test:single

# Multiple agents
npm run spawn

# Full system
npm start

# Monitor only
npm run monitor

# Load samples
npm run load:samples

# Watch logs
npm run test:watch

# Reset database
supabase db reset

# View in Supabase Studio
open http://127.0.0.1:54323
```

---

**Happy Testing! 🎉**

Your backend is production-ready!
