# Deploy to Railway - Step by Step

## 🚀 Deploy Your Backend in 5 Minutes

### Prerequisites

- GitHub account
- Railway account (free to create)
- Your Supabase credentials ready

---

## Step 1: Push to GitHub (if not already)

```bash
# Make sure all files are committed
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

---

## Step 2: Sign Up for Railway

1. Go to **[railway.app](https://railway.app)**
2. Click **"Login"** in the top right
3. Click **"Login with GitHub"**
4. Authorize Railway to access your GitHub repos

---

## Step 3: Create New Project

1. Click **"New Project"** button
2. Select **"Deploy from GitHub repo"**
3. Find and select **`yc-supabase`** (or your repo name)
4. Railway will detect your Node.js app automatically ✅

---

## Step 4: Add Environment Variables

In the Railway dashboard:

1. Click on your deployed service
2. Go to **"Variables"** tab
3. Click **"+ New Variable"** for each:

### Required Variables:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Agent Configuration:

```env
CONCURRENT_AGENTS=5
HEADLESS=true
BROWSER_TYPE=chromium
SCREENSHOT_QUALITY=80
```

### Browser Settings:

```env
VIEWPORT_WIDTH=1920
VIEWPORT_HEIGHT=1080
```

### Retry & Timeouts:

```env
MAX_RETRIES=3
RETRY_DELAY_MS=1000
AGENT_HEARTBEAT_INTERVAL_MS=5000
AGENT_TIMEOUT_MS=300000
```

### Logging:

```env
LOG_LEVEL=info
```

4. Click **"Add"** or **"Save"** after entering all variables

---

## Step 5: Deploy!

Railway will automatically:

- ✅ Detect Node.js project
- ✅ Run `npm install`
- ✅ Install Playwright browsers
- ✅ Start your agents with `node src/index.js`

**Watch the deployment logs** in Railway dashboard to see:

```
Installing dependencies...
✓ Installed playwright
✓ Starting Multi-Agent Browser Testing System...
✓ Configuration: 5 agents, chromium browser
✓ Spawning 5 agents...
✓ All 5 agents spawned successfully
✓ System started successfully
```

---

## Step 6: Verify Deployment

### Check Railway Logs

1. In Railway dashboard, click **"Deployments"**
2. Click on the latest deployment
3. View **"Deploy Logs"** to see if agents started

You should see:

```
[info]: Starting Multi-Agent Browser Testing System...
[info]: Configuration: 5 agents, chromium browser
[info]: Spawning 5 agents...
[info]: Agent 1 spawned (PID: 123)
[info]: Agent 2 spawned (PID: 456)
...
[info]: All 5 agents spawned successfully
```

### Check Supabase Database

1. Go to your Supabase project dashboard
2. Click **"Table Editor"** → **`agents`** table
3. You should see 5 agents registered with status **`idle`** ✅

Example:

```
id                                   | name           | status | browser_type
-------------------------------------|----------------|--------|-------------
a1b2c3d4-...                        | agent-a1b2c3d4 | idle   | chromium
e5f6g7h8-...                        | agent-e5f6g7h8 | idle   | chromium
```

### Load Sample Tests

From your local machine:

```bash
npm run load:samples
```

Watch in Railway logs as agents start picking up and executing tests!

---

## Step 7: Monitor Your Agents

### View Real-time Logs in Railway

Click **"View Logs"** in Railway dashboard to see:

```
[info]: Agent agent-a1b2c3d4 started, polling for tests...
[info]: Executing test: 16291c06-82d4-4e72-919c-a19a01bd4322
[info]: Test case: Google Search Test
[info]: Step 1 passed: navigate
[info]: Step 2 passed: wait
[info]: Test completed successfully
```

### View Results in Supabase

Go to Supabase → **Table Editor** → **`test_results`**

You'll see completed tests with:

- Status: `completed`
- Duration in milliseconds
- Screenshots array
- Agent that executed it

---

## 🎯 Your Backend is Live!

You now have:

- ✅ **5 agents running** on Railway
- ✅ **Processing tests** from your queue
- ✅ **Saving results** to Supabase
- ✅ **Uploading screenshots** to Supabase Storage
- ✅ **24/7 uptime** (Railway keeps it running)

---

## 📊 Railway Dashboard Features

### Metrics Tab

- CPU usage
- Memory usage
- Network traffic

### Deployments Tab

- View all deployments
- Rollback to previous versions
- See deployment duration

### Settings Tab

- Change instance size (if needed)
- Set up custom domains
- Configure restart policies

---

## 🔧 Common Adjustments

### Scale Up Agents

If you need more agents:

1. Go to **Variables** tab in Railway
2. Change `CONCURRENT_AGENTS` from `5` to `10`
3. Railway will automatically redeploy

### Reduce Memory Usage

If hitting memory limits:

1. Reduce agents: `CONCURRENT_AGENTS=3`
2. Lower screenshot quality: `SCREENSHOT_QUALITY=60`
3. Or upgrade Railway plan for more RAM

### View Individual Agent Logs

Railway shows combined logs from all agents. To filter:

```
# In Railway logs search bar, type:
[agent-a1b2c3d4]
```

---

## 💰 Railway Pricing

### Free Trial

- $5 in free credits
- Enough for ~1 month of testing

### Hobby Plan ($5/month)

- Suitable for 5 agents
- ~2GB RAM
- Perfect for MVP/demos

### Pro Plan ($20/month)

- More resources
- Better for 10+ agents
- Priority support

---

## 🚨 Troubleshooting

### Issue: "Deployment failed"

**Check:**

1. Verify all environment variables are set
2. Check Railway build logs for errors
3. Make sure `package.json` has all dependencies

**Fix:**

```bash
# Locally test that everything works
npm install
npm start
```

### Issue: "Out of memory"

**Fix:**

1. Reduce `CONCURRENT_AGENTS` from 5 to 3
2. Or upgrade Railway instance size
3. Enable `HEADLESS=true` (saves memory)

### Issue: "Agents not registering"

**Check:**

1. Verify `SUPABASE_URL` is correct
2. Verify `SUPABASE_SERVICE_KEY` (not anon key!)
3. Check Railway logs for connection errors

**Fix:**

```bash
# Test connection locally first
node -e "
import('./src/lib/supabase.js').then(async ({default: supabase}) => {
  const {data, error} = await supabase.from('agents').select('count');
  console.log(error ? 'Connection failed' : 'Connection works!');
});
"
```

### Issue: "Tests not running"

**Check:**

1. Make sure tests exist in Supabase `test_cases` table
2. Verify tests have `status='pending'`
3. Check agents are showing as `idle` in database

**Fix:**

```bash
# Load sample tests
npm run load:samples

# Check in Supabase Studio
SELECT * FROM test_cases WHERE status='pending';
```

---

## 🎬 Next Steps

1. ✅ **Backend deployed** → Set up live video (see LIVE_VIDEO_PREVIEW.md)
2. ✅ **Agents running** → Build frontend dashboard
3. ✅ **Tests executing** → Add your own test cases
4. ✅ **Everything works** → Show to users/investors!

---

## 📞 Quick Reference

### Redeploy

```bash
git push origin main
# Railway automatically redeploys
```

### View Logs

Railway Dashboard → Your Service → View Logs

### Restart Service

Railway Dashboard → Your Service → Settings → Restart

### Change Environment Variables

Railway Dashboard → Your Service → Variables → Edit

### Check Database

Supabase Dashboard → Table Editor → agents, test_cases, test_results

---

## 🎉 Success!

Your backend is now running on Railway 24/7!

**Test it:**

1. Load tests: `npm run load:samples`
2. Watch Railway logs
3. Check Supabase for results
4. View screenshots in Supabase Storage

**Share your Railway URL in YC Slack!** 🚀
