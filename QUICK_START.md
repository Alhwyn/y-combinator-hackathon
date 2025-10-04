# Quick Start Guide - Local Development

Your Multi-Agent Browser Testing System is now fully configured and ready to use! 🚀

## ✅ What's Been Set Up

1. **Supabase CLI** - Initialized with project name "replication"
2. **Local Supabase Instance** - Running on Docker
3. **Database Schema** - All tables, functions, and policies applied
4. **Storage Bucket** - test-screenshots bucket configured
5. **Sample Tests** - 4 example test cases loaded
6. **Environment** - `.env` file created with local credentials
7. **Dependencies** - All npm packages installed
8. **Playwright** - Chromium browser installed

## 🌐 Local Supabase URLs

Your local Supabase instance is running at:

- **API URL**: http://127.0.0.1:54321
- **Database URL**: postgresql://postgres:postgres@127.0.0.1:54322/postgres
- **Studio URL**: http://127.0.0.1:54323 (Visual Dashboard)
- **Mailpit URL**: http://127.0.0.1:54324 (Email Testing)

## 🔑 Credentials (Already in .env)

```
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
SUPABASE_SERVICE_KEY=sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz
```

## 🎯 How to Run the System

### Start Everything at Once

```bash
npm start
```

This will:

- Spawn 5 parallel agents
- Start health monitoring
- Begin processing test queue

### Or Start Components Individually

Terminal 1 - Agent Spawner:

```bash
npm run spawn
```

Terminal 2 - Single Agent:

```bash
npm run agent
```

Terminal 3 - Monitor:

```bash
node src/orchestration/monitor.js
```

## 📊 View Your Data

### Supabase Studio (Recommended)

Open your browser: **http://127.0.0.1:54323**

Navigate to:

- **Table Editor** → View agents, test_cases, test_results, test_steps
- **Storage** → View test-screenshots bucket
- **SQL Editor** → Run custom queries
- **Database** → Real-time subscriptions

### Via Terminal (Quick Check)

```bash
# View test cases
supabase db query "SELECT * FROM test_cases;"

# View agents (will show when system is running)
supabase db query "SELECT * FROM agents;"

# View test results
supabase db query "SELECT * FROM test_results ORDER BY created_at DESC LIMIT 10;"
```

## 🧪 Sample Tests Loaded

4 test cases are ready to run:

1. **Google Search Test** - Tests basic search functionality
2. **Example.com Navigation Test** - Simple navigation test
3. **GitHub Homepage Test** - Tests scrolling and screenshots
4. **HTTP Bin Form Test** - Tests form filling

## 📝 Watch Logs in Real-Time

```bash
# Watch combined logs
tail -f logs/combined.log

# Watch errors only
tail -f logs/error.log

# Watch in separate terminal while system runs
npm start & tail -f logs/combined.log
```

## 🎬 Complete Workflow Example

```bash
# 1. Ensure Supabase is running (should already be started)
supabase status

# 2. Start the testing system
npm start

# 3. In another terminal, watch the logs
tail -f logs/combined.log

# 4. Open Supabase Studio to see real-time updates
# http://127.0.0.1:54323

# 5. To stop: Press Ctrl+C in the terminal running npm start
```

## 🔧 Common Commands

```bash
# Check Supabase status
supabase status

# Stop Supabase
supabase stop

# Start Supabase again
supabase start

# Reset database (clears all data, reapplies migrations)
supabase db reset

# Load sample tests again
node examples/loadSampleTests.js

# View database migrations
ls -la supabase/migrations/

# Create a new migration
supabase migration new your_migration_name
```

## 📸 Screenshots Location

Screenshots are stored in Supabase Storage:

- **Bucket**: test-screenshots
- **View in Studio**: http://127.0.0.1:54323 → Storage → test-screenshots
- **Access via URL**: http://127.0.0.1:54321/storage/v1/object/public/test-screenshots/{path}

## 🐛 Debugging

### Run Agent Without Headless Mode

```bash
HEADLESS=false npm run agent
```

This will show the browser window during test execution.

### Enable Debug Logging

Edit `.env`:

```env
LOG_LEVEL=debug
```

### Check Database Connection

```bash
supabase db query "SELECT version();"
```

## 🎨 Next Steps

### 1. Build the Frontend Dashboard

The `frontend/` folder is ready for your implementation:

```bash
cd frontend
npm create vite@latest . -- --template react
npm install @supabase/supabase-js
npm run dev
```

See `frontend/README.md` for detailed instructions.

### 2. Create Your Own Tests

```javascript
import { createTestCase } from "./src/utils/testHelpers.js";

await createTestCase({
  name: "My Custom Test",
  description: "Description here",
  url: "https://myapp.com",
  actions: [
    { type: "navigate", target: "https://myapp.com" },
    { type: "click", selector: "#login-button" },
    // ... more actions
  ],
  priority: 10,
  tags: ["custom", "smoke"],
});
```

### 3. Deploy to Production

When ready to deploy:

1. Create a production Supabase project at https://supabase.com
2. Link your project: `supabase link --project-ref your-project-ref`
3. Push migrations: `supabase db push`
4. Update `.env` with production credentials
5. Deploy agents to your server/cloud

## 📚 Documentation

- **Main README**: `README.md` - Full documentation
- **Setup Guide**: `SETUP_GUIDE.md` - Detailed setup instructions
- **This Guide**: `QUICK_START.md` - Quick reference

## 🆘 Getting Help

If something isn't working:

1. Check if Supabase is running: `supabase status`
2. Check logs: `cat logs/error.log`
3. Verify tables exist: Open http://127.0.0.1:54323 → Table Editor
4. Check environment: `cat .env`

---

**Ready to Test!** 🎉

Run `npm start` to begin processing your test queue!
