# Railway Deployment Checklist ✅

## Pre-Deployment (5 minutes)

### 1. Get Your Supabase Credentials Ready

Go to your Supabase project:

- [ ] Copy **Project URL** (Settings → API)
- [ ] Copy **anon/public key** (Settings → API)
- [ ] Copy **service_role key** (Settings → API) ⚠️ Keep secret!

### 2. Make Sure Your Code is Committed

```bash
git add .
git commit -m "Ready for Railway deployment"
git push origin main
```

---

## Deploy to Railway (3 minutes)

### Step 1: Sign Up

- [ ] Go to [railway.app](https://railway.app)
- [ ] Click "Login with GitHub"
- [ ] Authorize Railway

### Step 2: Create Project

- [ ] Click "New Project"
- [ ] Select "Deploy from GitHub repo"
- [ ] Choose your `yc-supabase` repository
- [ ] Wait for Railway to detect Node.js ✅

### Step 3: Add Environment Variables

Click on your service → "Variables" tab → Add these:

**Supabase (Required):**

- [ ] `SUPABASE_URL` = `https://your-project.supabase.co`
- [ ] `SUPABASE_ANON_KEY` = `eyJhbG...` (your anon key)
- [ ] `SUPABASE_SERVICE_KEY` = `eyJhbG...` (your service key)

**Agent Config (Required):**

- [ ] `CONCURRENT_AGENTS` = `5`
- [ ] `HEADLESS` = `true`
- [ ] `BROWSER_TYPE` = `chromium`
- [ ] `SCREENSHOT_QUALITY` = `80`

**Browser Settings (Optional but recommended):**

- [ ] `VIEWPORT_WIDTH` = `1920`
- [ ] `VIEWPORT_HEIGHT` = `1080`

**Logging:**

- [ ] `LOG_LEVEL` = `info`

### Step 4: Deploy

- [ ] Railway automatically deploys after adding variables
- [ ] Watch the deployment logs

---

## Verify Deployment (2 minutes)

### Check Railway Logs

- [ ] Go to Railway → Your Service → "View Logs"
- [ ] Look for: `✅ All 5 agents spawned successfully`
- [ ] Look for: `✅ System started successfully`

### Check Supabase Database

- [ ] Go to Supabase → Table Editor → `agents` table
- [ ] You should see 5 agents with `status = 'idle'`
- [ ] Agent names like: `agent-a1b2c3d4`, `agent-e5f6g7h8`, etc.

### Load Test Cases

From your local machine:

```bash
npm run load:samples
```

- [ ] Check Railway logs - agents should start executing tests
- [ ] Check Supabase → `test_results` table - results should appear
- [ ] Check Supabase Storage → `test-screenshots` - screenshots should appear

---

## 🎉 Success Criteria

You're done when you see:

- ✅ Railway shows "Deployed successfully"
- ✅ 5 agents registered in Supabase `agents` table
- ✅ Tests completing in `test_results` table
- ✅ Screenshots appearing in Supabase Storage
- ✅ No errors in Railway logs

---

## 🚨 Troubleshooting

### Railway shows "Deploy Failed"

- Check all environment variables are set correctly
- Make sure `SUPABASE_SERVICE_KEY` is the service key, not anon key
- Review Railway build logs for specific errors

### Agents not appearing in database

- Verify `SUPABASE_URL` is correct (should include https://)
- Check `SUPABASE_SERVICE_KEY` has correct permissions
- Look for connection errors in Railway logs

### Tests not running

- Make sure test cases exist: `SELECT * FROM test_cases WHERE status='pending'`
- Load samples if none exist: `npm run load:samples`
- Check agents are idle: `SELECT * FROM agents WHERE status='idle'`

---

## 📞 Need Help?

1. **Railway Issues**: Check [RAILWAY_DEPLOY.md](RAILWAY_DEPLOY.md)
2. **Backend Issues**: Check [HOW_TO_TEST.md](HOW_TO_TEST.md)
3. **Database Issues**: Check [SETUP_GUIDE.md](SETUP_GUIDE.md)

---

## Next Steps After Deployment

- [ ] Set up live video streaming (see [LIVE_VIDEO_PREVIEW.md](LIVE_VIDEO_PREVIEW.md))
- [ ] Build frontend dashboard
- [ ] Add your own test cases
- [ ] Show to users/investors! 🚀

---

**Estimated Total Time: 10 minutes** ⏱️

**Cost: $5/month** (free $5 credit to start) 💰
