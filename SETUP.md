# 🛠️ Setup Guide

Complete setup instructions for the AI QA Testing System.

---

## 📋 Prerequisites

- **Node.js** 18 or higher
- **Chrome** browser
- **Claude API key** from https://console.anthropic.com/
- **(Optional) Supabase** account for test storage

---

## 🚀 Installation Steps

### Step 1: Clone & Install

```bash
# Navigate to project
cd yc-supabase

# Install dependencies
npm install
```

This installs:

- `@anthropic-ai/sdk` - Claude API client
- `playwright` - Browser automation
- `express` - Web server
- `@supabase/supabase-js` - Database client
- Other dependencies

### Step 2: Get Claude API Key

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to "API Keys"
4. Click "Create Key"
5. Copy the key (starts with `sk-ant-`)
6. **Save it** - you can't view it again!

### Step 3: Configure Environment

Your `.env` file should contain:

```bash
# Required for AI Agent
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here

# Supabase (already configured for local)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=your-local-anon-key
SUPABASE_SERVICE_KEY=your-local-service-key

# Agent Settings (defaults are fine)
CONCURRENT_AGENTS=5
HEADLESS=true
SCREENSHOT_QUALITY=80
BROWSER_TYPE=chromium
VIEWPORT_WIDTH=1920
VIEWPORT_HEIGHT=1080
```

**Just update the `ANTHROPIC_API_KEY` line!**

### Step 4: Verify API Key

Test your Claude API key:

```bash
node test-anthropic-key.js
```

You should see:

```
✅ SUCCESS! Your API key works!
🤖 Claude says: [greeting message]
```

If you get an error:

- Check the key is correct (no extra spaces)
- Verify you have API credits at console.anthropic.com
- Check your internet connection

### Step 5: Start Server

```bash
npm start
```

You should see:

```
✅ Video stream server started
📡 Live streaming enabled
🚀 Starting agent orchestration...
Spawning 5 agents...
```

Server is now running on http://localhost:3001

### Step 6: Load Browser Extension

1. Open Chrome
2. Go to `chrome://extensions/`
3. Toggle "Developer mode" ON (top right)
4. Click "Load unpacked"
5. Navigate to and select: `/path/to/yc-supabase/browser-extension/`
6. Extension loads with robot icon 🤖

**Note about icons**: You might see "no icon" warnings. That's OK - extension works fine! See `browser-extension/ICON_SETUP.md` if you want to add icons.

---

## ✅ Verify Setup

### 1. Check Server

Open http://localhost:3001/health

Should return:

```json
{
  "status": "ok",
  "agents": 5,
  "viewers": 0,
  "timestamp": "..."
}
```

### 2. Check Dashboard

Open http://localhost:3001/dashboard/

Should show:

- Active agents count
- Live video streams
- Agent status

### 3. Test Extension

1. Click extension icon in Chrome
2. Should see popup with:
   - API Key field
   - Server URL (http://localhost:3001)
   - Test Goal field
   - Start button

---

## 🎯 Run Your First Test

### Quick Test (Recommended)

1. **Navigate** to: https://www.nytimes.com/games/wordle/
2. **Click** extension icon
3. **Enter** test goal:
   ```
   Play Wordle - Close any modals, type ABOUT, press Enter, type CRANE, press Enter
   ```
4. **Click** "Start Testing"
5. **Watch** the AI work!

You'll see in the extension popup:

- Step counter increasing
- Activity log showing:
  - 📸 Screenshots being captured
  - 🧠 AI analyzing
  - ✨ Actions being executed

### Alternative: Web UI

1. Open http://localhost:3001/ai-agent.html
2. Enter API key and test goal
3. Click "Start AI Agent"
4. Watch in the embedded iframe

---

## 🗂️ Database Setup (Optional)

If you want to store tests in Supabase:

### Option 1: Local Supabase

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Start local Supabase
supabase start

# Run migrations
supabase db reset
```

Your `.env` is already configured for local Supabase!

### Option 2: Cloud Supabase

1. Go to https://supabase.com/
2. Create new project
3. Copy project URL and keys
4. Update `.env`:
   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_KEY=your-service-key
   ```
5. Run migrations in Supabase dashboard

---

## 🎨 Customization

### Change Number of Agents

```bash
# In .env
CONCURRENT_AGENTS=10  # Run 10 agents in parallel
```

### Change Screenshot Quality

```bash
# Higher quality = better AI decisions, but slower
SCREENSHOT_QUALITY=90  # Default: 80
```

### Change Capture Interval

In extension popup:

- 1 second = Very responsive, higher cost
- 2 seconds = Balanced (recommended)
- 5 seconds = Slower, cheaper

### Use Different Browser

```bash
# In .env
BROWSER_TYPE=firefox  # chromium, firefox, or webkit
```

---

## 🔧 Advanced Configuration

### Custom Port

```bash
# In .env or command line
PORT=3002 npm start
```

### Production Mode

```bash
# In .env
NODE_ENV=production
HEADLESS=true
```

### Enable Video Recording

```bash
# In .env
ENABLE_VIDEO_RECORDING=true
ENABLE_LIVE_STREAM=true
LIVE_STREAM_FPS=2
```

---

## 📊 Monitoring & Logs

### View Logs

```bash
# Real-time logs
npm run test:watch

# Or tail logs directly
tail -f logs/combined.log
```

### Check Agent Status

```bash
curl http://localhost:3001/api/agents
```

### Monitor Costs

Each test logs token usage. Example:

```
Tokens used: 21 input, 37 output
Cost: ~$0.0006
```

---

## 🐛 Common Issues

### Port Already in Use

```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Then restart
npm start
```

### Extension Not Loading

1. Go to `chrome://extensions/`
2. Click reload icon
3. Check for errors in "Errors" button
4. Inspect popup: Right-click extension → "Inspect popup"

### API Key Not Working

```bash
# Test key
node test-anthropic-key.js

# Common issues:
- Extra spaces in .env file
- Wrong key (check console.anthropic.com)
- No API credits remaining
```

### Database Connection Failed

```bash
# If using local Supabase, ensure it's running:
supabase status

# If stopped, start it:
supabase start
```

---

## 🔄 Updating

```bash
# Pull latest changes
git pull

# Install any new dependencies
npm install

# Restart server
npm start

# Reload extension in Chrome
chrome://extensions/ → Click reload
```

---

## 🛑 Stopping

### Stop Server

Press `Ctrl+C` in the terminal running `npm start`

### Stop Agent

Click "Stop Agent" in extension popup

### Stop All

```bash
# Kill all node processes (careful!)
pkill -f node

# Or just kill the specific port
lsof -ti:3001 | xargs kill -9
```

---

## 📚 Next Steps

1. ✅ Read [README.md](README.md) for overview
2. 📖 Read [AI_AGENT_GUIDE.md](AI_AGENT_GUIDE.md) for detailed docs
3. 🧪 Try different test goals
4. 🎨 Customize for your workflow
5. 🚀 Integrate into your CI/CD

---

## 🆘 Getting Help

### Check Logs

```bash
# Extension logs
chrome://extensions/ → "Inspect views: service worker"

# Server logs
tail -f logs/combined.log

# Or in terminal running npm start
```

### Debug Mode

```bash
# Run in non-headless mode to see browser
HEADLESS=false npm run agent
```

### Common Commands

```bash
# Test single agent
npm run test:single

# Run in test mode
npm run test:agent

# Load sample tests
node examples/loadSampleTests.js

# Create AI test
node test-ai-agent.js
```

---

**Setup complete! 🎉**

Now run: `npm start` and start testing with AI! 🤖✨
