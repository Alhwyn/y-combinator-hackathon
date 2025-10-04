# 🚀 Quick Reference

Essential commands and workflows.

---

## ⚡ Quick Start

```bash
# 1. Install
npm install

# 2. Add API key to .env
ANTHROPIC_API_KEY=sk-ant-...

# 3. Start server
npm start

# 4. Load extension
chrome://extensions/ → Load unpacked → select browser-extension/

# 5. Test!
Navigate to website → Click extension → Start testing
```

---

## 📝 Common Commands

```bash
# Start system
npm start

# Test API key
node test-anthropic-key.js

# Create test
node create-test.js

# Kill server
lsof -ti:3001 | xargs kill -9

# View logs
tail -f logs/combined.log
```

---

## 🎯 Test Goal Examples

```javascript
// Wordle
"Play Wordle - Close modals, type ABOUT, CRANE, LIGHT";

// Form
"Fill contact form with test@test.com, submit";

// Shopping
"Search for 'laptop', click first result, verify price";

// Login
"Click login, enter invalid credentials, check error";

// Navigation
"Click all menu items, take screenshots";
```

---

## 🔧 Configuration Quick Guide

```bash
# .env essentials
ANTHROPIC_API_KEY=sk-ant-...        # Required!
CONCURRENT_AGENTS=5                  # Number of agents
HEADLESS=true                        # Hide browser
SCREENSHOT_QUALITY=80                # 1-100
BROWSER_TYPE=chromium                # chromium|firefox|webkit
```

---

## 🌐 URLs

```bash
http://localhost:3001              # Main server
http://localhost:3001/health       # Health check
http://localhost:3001/dashboard    # Live dashboard
http://localhost:3001/ai-agent.html # AI agent web UI
```

---

## 💰 Cost Reference

| Steps | Cost       |
| ----- | ---------- |
| 5     | $0.05-0.15 |
| 10    | $0.10-0.30 |
| 30    | $0.30-0.90 |
| 50    | $0.50-1.50 |

---

## 🐛 Quick Fixes

```bash
# Port in use
lsof -ti:3001 | xargs kill -9

# Extension not working
chrome://extensions/ → Reload

# API key invalid
node test-anthropic-key.js

# Database issue
supabase start
```

---

## 📁 Important Files

```
.env                        # Your config (API keys)
browser-extension/          # Chrome extension
src/agent/worker.js         # Standard agent
src/server/aiAgentServer.js # AI API
README.md                   # Main docs
SETUP.md                    # Setup guide
AI_AGENT_GUIDE.md          # AI agent docs
```

---

## 🎨 Extension Settings

```
API Key:     sk-ant-...
Server URL:  http://localhost:3001
Test Goal:   Describe what to test
Interval:    2 seconds (recommended)
```

---

## 🔍 Debugging

```bash
# Extension console
Right-click extension → "Inspect popup"

# Background worker
chrome://extensions/ → "Inspect views: service worker"

# Server logs
Terminal running npm start

# Database
supabase status
```

---

## 📊 Monitoring

```bash
# API health
curl http://localhost:3001/health

# Agent list
curl http://localhost:3001/api/agents

# Real-time dashboard
open http://localhost:3001/dashboard/
```

---

That's it! Bookmark this for quick reference. 📌
