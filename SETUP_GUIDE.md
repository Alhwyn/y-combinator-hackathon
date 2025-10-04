# Setup Guide - Multi-Agent Browser Testing System

This guide will walk you through setting up the system from scratch.

## Step 1: Prerequisites

Ensure you have the following installed:

- Node.js 18+ ([Download](https://nodejs.org/))
- Git ([Download](https://git-scm.com/))
- A Supabase account ([Sign up](https://supabase.com/))

## Step 2: Create Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Fill in project details:
   - Name: `multi-agent-testing`
   - Database Password: (generate a strong password)
   - Region: Choose closest to you
4. Wait for project to be provisioned (~2 minutes)

## Step 3: Get Supabase Credentials

1. In your Supabase project dashboard, go to Settings → API
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (under Project API keys)
   - **service_role key** (under Project API keys - keep this secret!)

## Step 4: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd yc-supabase

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium
```

## Step 5: Configure Environment

Create a `.env` file in the project root:

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your favorite editor
nano .env
```

Update the following values:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here

CONCURRENT_AGENTS=5
HEADLESS=true
SCREENSHOT_QUALITY=80
```

## Step 6: Set Up Database

### Option A: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"
4. Copy and paste the contents of `supabase/schema.sql`
5. Click "Run" (bottom right)
6. Wait for the query to complete (green checkmark)
7. Create another new query
8. Copy and paste the contents of `supabase/storage.sql`
9. Click "Run"

### Option B: Using Supabase CLI

If you have Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-id

# Push the schema
supabase db push
```

## Step 7: Verify Database Setup

Run the verification script:

```bash
npm run setup:db
```

You should see: `✅ Database setup verified!`

If you see errors, go back to Step 6 and ensure all SQL was executed.

## Step 8: Load Sample Tests

Load the example test cases:

```bash
node examples/loadSampleTests.js
```

You should see:

```
✅ Loaded: Google Search Test
✅ Loaded: Example.com Navigation Test
✅ Loaded: GitHub Homepage Test
✅ Loaded: HTTP Bin Form Test
Successfully loaded 4 sample tests
```

## Step 9: Verify Storage Bucket

1. Go to Supabase Dashboard → Storage
2. You should see a bucket named `test-screenshots`
3. If not, create it manually:
   - Click "New bucket"
   - Name: `test-screenshots`
   - Public: Yes
   - Click "Create bucket"

## Step 10: Start the System

Start all agents with monitoring:

```bash
npm start
```

You should see output like:

```
Starting Multi-Agent Browser Testing System...
Configuration: 5 agents, chromium browser
Spawning 5 agents...
Agent 1 spawned (PID: 12345)
Agent 2 spawned (PID: 12346)
Agent 3 spawned (PID: 12347)
Agent 4 spawned (PID: 12348)
Agent 5 spawned (PID: 12349)
All 5 agents spawned successfully
Starting agent monitor...
```

## Step 11: Monitor Execution

### View in Terminal

Watch the logs as tests execute:

```bash
tail -f logs/combined.log
```

### View in Supabase Dashboard

1. Go to Table Editor → `test_results`
2. You'll see test executions appearing in real-time
3. Check `test_steps` for detailed step-by-step logs
4. Go to Storage → `test-screenshots` to view screenshots

### Query with SQL

```sql
-- View active agents
SELECT name, status, total_tests_run, successful_tests, failed_tests
FROM agents;

-- View test results
SELECT
  tc.name as test_name,
  tr.status,
  tr.duration_ms,
  a.name as agent_name,
  tr.completed_at
FROM test_results tr
JOIN test_cases tc ON tr.test_case_id = tc.id
JOIN agents a ON tr.agent_id = a.id
ORDER BY tr.created_at DESC
LIMIT 10;

-- View pending tests
SELECT name, status, priority
FROM test_cases
WHERE status = 'pending'
ORDER BY priority DESC;
```

## Step 12: Stop the System

Press `Ctrl+C` in the terminal where the system is running.

You should see:

```
Received SIGINT, initiating graceful shutdown...
Stopping all agents...
All agents stopped
Shutdown complete
```

## Troubleshooting

### Issue: "Failed to register agent"

**Solution:** Check that `schema.sql` was executed correctly in Supabase.

### Issue: "Failed to upload screenshot"

**Solution:**

1. Verify `storage.sql` was executed
2. Check that the `test-screenshots` bucket exists
3. Ensure storage policies are applied

### Issue: "Tests not running"

**Solution:**

1. Verify tests exist: `SELECT * FROM test_cases`
2. Check agent status: `SELECT * FROM agents`
3. Look at logs: `cat logs/error.log`

### Issue: Playwright browser not found

**Solution:**

```bash
npx playwright install chromium
```

## Next Steps

1. **Create Your Own Tests** - See `examples/sampleTests.js` for templates
2. **Build a Dashboard** - Implement a frontend in the `frontend/` folder
3. **Integrate with CI/CD** - Run tests on every deployment
4. **Scale Up** - Increase `CONCURRENT_AGENTS` for more parallelism

## Support

If you encounter issues:

1. Check `logs/error.log` for detailed errors
2. Verify all SQL migrations ran successfully
3. Ensure environment variables are set correctly
4. Check Supabase project status in the dashboard

---

**Congratulations! 🎉 Your Multi-Agent Browser Testing System is now running!**
