# Local Development Guide

Complete guide to run the AI Agent Testing System locally on your machine.

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)

   ```bash
   node --version  # Should be v18+
   ```

2. **npm** (v9 or higher)

   ```bash
   npm --version
   ```

3. **Supabase CLI** (optional, for local Supabase)
   ```bash
   npm install -g supabase
   ```

### Required API Keys

1. **Anthropic API Key**

   - Sign up at https://console.anthropic.com
   - Create an API key
   - Keep it ready for setup

2. **Supabase Credentials**

   - Project URL
   - Service Role Key (or Anon Key)
   - Get from https://supabase.com/dashboard/project/_/settings/api

3. **GitHub OAuth App** (for frontend GitHub integration)
   - Create at https://github.com/settings/applications/new
   - Set callback URL to `http://localhost:5173/auth/callback`

## Step 1: Clone and Install Dependencies

### Backend Setup

```bash
# Navigate to project root
cd /Users/alhwyngeonzon/Programming/yc-supabase

# Install backend dependencies
npm install
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install frontend dependencies
npm install

# Go back to root
cd ..
```

## Step 2: Configure Environment Variables

### Backend Environment (.env file)

Create a `.env` file in the project root:

```bash
# Create .env file
touch .env
```

Add the following configuration:

```env
# Anthropic API
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
# Or use anon key if service key is not available
SUPABASE_ANON_KEY=your_anon_key_here

# Server Configuration
PORT=3001
NODE_ENV=development

# Live Stream Configuration (optional, defaults to 3001)
LIVE_STREAM_PORT=3001
```

### Frontend Configuration

The frontend `config.js` already detects localhost automatically. No changes needed!

```javascript
// frontend/config.js automatically uses these for localhost:
const API_BASE_URL = "http://localhost:3001";
const WS_BASE_URL = "ws://localhost:3001";
```

### GitHub OAuth Configuration (Frontend)

Update your Supabase dashboard with GitHub OAuth:

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable GitHub provider
3. Add your GitHub OAuth credentials:
   - **Client ID**: Your GitHub OAuth App ID
   - **Client Secret**: Your GitHub OAuth App Secret
   - **Redirect URL**: `http://localhost:5173/auth/callback`

## Step 3: Setup Database

### Option A: Use Existing Supabase Project

If you already have a Supabase project with tables set up, skip to Step 4.

### Option B: Run Migrations

```bash
# Apply database migrations
npm run migrate

# Or if using Supabase CLI
supabase db push
```

### Required Tables

Your Supabase database needs these tables:

1. **test_cases** - Stores test configurations
2. **test_results** - Stores test execution results
3. **agent_logs** - Stores agent activity logs
4. **Storage bucket** - For screenshots and videos

Check `supabase/migrations/` for migration files.

## Step 4: Start Backend Server

### Start the Video Stream Server (with AI Agent support)

```bash
# From project root
npm run start:stream

# Or use the node command directly
node src/startWithStream.js
```

You should see:

```
✅ Video stream server LISTENING on localhost:3001
📊 Dashboard: http://localhost:3001/dashboard
🔗 Health check: http://localhost:3001/health
🚀 Server is ready to accept HTTP connections
```

### Test Backend is Running

```bash
# In a new terminal, test the health endpoint
curl http://localhost:3001/health

# Expected response:
# {
#   "status": "ok",
#   "agents": 0,
#   "viewers": 0,
#   "timestamp": "2025-10-04T...",
#   "uptime": 1.234
# }
```

## Step 5: Start Frontend Development Server

### In a NEW terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Start Vite dev server
npm run dev
```

You should see:

```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

## Step 6: Access the Application

### Open in Browser

1. Navigate to **http://localhost:5173**
2. You should see the Replication landing page

### Connect GitHub (First Time)

1. Click "Connect GitHub" button
2. Authorize the GitHub OAuth app
3. You'll be redirected back with your repositories loaded

## Step 7: Test the Full Flow

### Create a Test Run

1. **Select a Repository**
   - Choose from your GitHub repositories dropdown
2. **Enter a Prompt**

   ```
   Test the login functionality and check for accessibility issues
   ```

3. **Click Send** (↑ button)

4. **Navigate to Results Page**

   - Timeline should show "Initializing Agent" → Running
   - Check browser console for WebSocket connection logs:
     ```
     🔌 Connecting to video stream: ws://localhost:3001/viewer
     ✅ WebSocket connected
     ```

5. **Watch the Agent Work**
   - Video stream will show agent's browser (once agent starts)
   - Timeline updates as agent progresses
   - Chat shows agent's thought process

### Test Chat Interaction

1. Type a message in the Chat component:

   ```
   Also test the password reset functionality
   ```

2. Press Enter or click Send (↑)

3. Agent should receive and respond to your instruction

## Step 8: Debugging Local Setup

### Backend Not Starting

**Issue**: Port 3001 already in use

```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3002 node src/startWithStream.js
```

**Issue**: Missing environment variables

```bash
# Check if .env file exists
cat .env

# Verify required variables are set
echo $ANTHROPIC_API_KEY
echo $SUPABASE_URL
```

### Frontend Not Starting

**Issue**: Port 5173 already in use

```bash
# Frontend will auto-increment to 5174, 5175, etc.
# Or specify a different port in vite.config.ts
```

**Issue**: Module not found errors

```bash
# Reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### WebSocket Not Connecting

**Check 1**: Backend is running

```bash
curl http://localhost:3001/health
```

**Check 2**: Browser console logs

```javascript
// Should see:
🔌 Connecting to video stream: ws://localhost:3001/viewer
✅ WebSocket connected

// If you see errors, check:
// 1. Backend server is running
// 2. No firewall blocking WebSocket
// 3. config.js has correct localhost URL
```

**Check 3**: CORS configuration

```javascript
// In src/server/videoStream.js, verify CORS is allowing localhost:
res.header("Access-Control-Allow-Origin", "*");
```

### Agent Not Starting

**Issue**: Anthropic API key invalid

```bash
# Test API key
node test-anthropic-key.js

# Check .env file
cat .env | grep ANTHROPIC_API_KEY
```

**Issue**: Supabase connection failed

```bash
# Test Supabase connection
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
supabase.from('test_cases').select('count').then(console.log);
"
```

### Video Not Showing

**Issue**: No agent connected

- Video only shows when an agent is actively running
- Check backend logs for agent registration:
  ```
  🤖 Agent registered for streaming
  ```

**Issue**: Canvas not rendering

- Open browser DevTools → Console
- Check for canvas rendering errors
- Verify frame data is base64 encoded image

### GitHub OAuth Not Working

**Issue**: Redirect URI mismatch

1. Go to https://github.com/settings/applications
2. Verify redirect URL is `http://localhost:5173/auth/callback`
3. Update Supabase dashboard with same URL

**Issue**: Supabase GitHub provider not configured

1. Supabase Dashboard → Authentication → Providers
2. Enable GitHub
3. Add Client ID and Secret from GitHub OAuth App

## Development Workflow

### Making Changes to Backend

```bash
# Backend uses nodemon for auto-restart (if configured)
# Or manually restart:
Ctrl+C  # Stop server
npm run start:stream  # Restart
```

### Making Changes to Frontend

```bash
# Vite has hot module replacement (HMR)
# Changes automatically reload in browser
# No restart needed!
```

### Viewing Logs

**Backend Logs:**

```bash
# Console output shows all logs
# Or check log files:
tail -f logs/combined.log
tail -f logs/error.log
```

**Frontend Logs:**

- Open browser DevTools → Console
- Network tab for API calls
- WebSocket frames in Network → WS tab

## Testing Endpoints Locally

### Test Backend API

```bash
# Health check
curl http://localhost:3001/health

# Get agents list
curl http://localhost:3001/api/agents

# Start an agent (requires Anthropic API)
curl -X POST http://localhost:3001/api/ai-agent/start \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Test the homepage",
    "url": "https://example.com",
    "maxSteps": 10
  }'
```

### Test WebSocket Connection

```javascript
// In browser console (F12)
const ws = new WebSocket("ws://localhost:3001/viewer");

ws.onopen = () => console.log("✅ Connected");
ws.onmessage = (e) => console.log("📨 Message:", JSON.parse(e.data));
ws.onerror = (e) => console.error("❌ Error:", e);

// You should see:
// ✅ Connected
// 📨 Message: { type: 'agent_list', agents: [...] }
```

## Useful Scripts

### Check Local Setup

```bash
# Run the setup checker
./check-local-setup.sh

# This verifies:
# - Node.js version
# - Environment variables
# - Dependencies installed
# - Supabase connection
# - Anthropic API key
```

### Quick Start (All Services)

Create a start script:

```bash
# File: start-local.sh
#!/bin/bash

# Start backend in background
cd /Users/alhwyngeonzon/Programming/yc-supabase
npm run start:stream &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
cd frontend
npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID" EXIT
```

Make it executable:

```bash
chmod +x start-local.sh
./start-local.sh
```

## Quick Reference

### Local URLs

| Service         | URL                             |
| --------------- | ------------------------------- |
| Frontend        | http://localhost:5173           |
| Backend API     | http://localhost:3001           |
| Backend Health  | http://localhost:3001/health    |
| WebSocket       | ws://localhost:3001/viewer      |
| Dashboard (old) | http://localhost:3001/dashboard |

### Default Ports

- **Frontend**: 5173 (Vite default)
- **Backend**: 3001 (configurable via PORT env var)
- **Supabase Local**: 54321 (if using local Supabase)

### Environment Files

| File         | Location     | Purpose                      |
| ------------ | ------------ | ---------------------------- |
| `.env`       | Project root | Backend configuration        |
| `config.js`  | frontend/    | Frontend API URLs            |
| `.env.local` | frontend/    | Frontend env vars (optional) |

## Next Steps

Once you have everything running locally:

1. **Explore the Codebase**

   - Backend: `src/agent/`, `src/server/`
   - Frontend: `frontend/src/components/`, `frontend/src/pages/`

2. **Read the Guides**

   - `FRONTEND_INTEGRATION_GUIDE.md` - Architecture details
   - `API_USAGE_GUIDE.md` - API documentation
   - `AI_AGENT_GUIDE.md` - Agent behavior

3. **Make Changes**

   - Components auto-reload in frontend
   - Restart backend after changes
   - Test thoroughly before deploying

4. **Deploy**
   - Backend: Railway/Fly.io/Render
   - Frontend: Vercel/Netlify/Cloudflare Pages
   - Update `config.js` with production URLs

## Troubleshooting Commands

```bash
# Check if ports are in use
lsof -i :3001
lsof -i :5173

# Check Node version
node --version

# Check npm version
npm --version

# View backend logs
tail -f logs/combined.log

# Test Anthropic API
node test-anthropic-key.js

# Test Supabase connection
node -e "require('./src/lib/supabase.js').testConnection()"

# Clear npm cache (if weird errors)
npm cache clean --force

# Reinstall all dependencies
rm -rf node_modules frontend/node_modules
npm install
cd frontend && npm install
```

## Common Issues & Solutions

### "Cannot find module" errors

```bash
# Solution: Reinstall dependencies
npm install
```

### WebSocket closes immediately

```bash
# Solution: Check backend is running and accessible
curl http://localhost:3001/health
```

### Agent doesn't respond

```bash
# Solution: Check Anthropic API key
echo $ANTHROPIC_API_KEY
node test-anthropic-key.js
```

### Database errors

```bash
# Solution: Check Supabase credentials and connection
# Test in browser: https://your-project.supabase.co
```

### GitHub auth fails

```bash
# Solution: Check OAuth app settings
# 1. GitHub OAuth app redirect URI
# 2. Supabase GitHub provider config
# 3. Both should use http://localhost:5173/auth/callback
```

## Support

If you encounter issues:

1. **Check the logs** (browser console + backend terminal)
2. **Run health checks** (`curl http://localhost:3001/health`)
3. **Verify environment variables** (`cat .env`)
4. **Test API keys** (use test scripts)
5. **Check the guides** (all .md files in project root)

---

**Happy Coding! 🚀**

Last Updated: October 4, 2025
