# 🤖 AI QA Testing System

> Autonomous AI-powered browser testing using Claude's vision capabilities

## What is This?

An intelligent testing system where **Claude AI analyzes screenshots** and autonomously tests your websites by:

- 📸 Taking screenshots every 2 seconds
- 🧠 Using vision AI to understand the page
- 💡 Deciding what actions to take
- ⚡ Executing clicks, typing, navigation in real-time

**No brittle selectors. No manual test scripts. Just describe what to test!**

---

## 🚀 Quick Start (5 Minutes)

### Prerequisites

- Node.js 18+
- Chrome browser
- Claude API key ([get one here](https://console.anthropic.com/))

### 1. Install

```bash
npm install
```

### 2. Configure

Add your Claude API key to `.env`:

```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### 3. Start Server

```bash
npm start
```

Server runs on http://localhost:3001

### 4. Load Browser Extension

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the `browser-extension/` folder

### 5. Run Your First Test!

1. Navigate to any website (try: https://www.nytimes.com/games/wordle/)
2. Click the extension icon
3. Enter test goal: `"Play Wordle - Close modals, type words, solve puzzle"`
4. Click "Start Testing"
5. Watch AI test your site! 🎉

---

## 📖 How It Works

```
1. Extension captures screenshot
2. Sends to your backend server
3. Server calls Claude API with image
4. Claude analyzes and decides next action
5. Extension executes the action
6. Repeat until goal achieved
```

**Example:**

```
Goal: "Test login with invalid credentials"

AI Actions:
1. Click "Login" button
2. Type "test@test.com" in email
3. Type "wrong" in password
4. Click "Submit"
5. Verify error message appears
6. Complete: Test passed ✅
```

---

## 🎯 Two Testing Modes

### 1. AI Agent Mode (New! 🤖)

- **Setup**: Natural language description
- **Execution**: AI figures it out
- **Best for**: Exploratory testing, dynamic UIs, quick tests
- **Cost**: ~$0.10-0.50 per test

### 2. Standard Playwright Mode

- **Setup**: Write JavaScript test code
- **Execution**: Pre-scripted actions
- **Best for**: Regression tests, CI/CD, high-volume
- **Cost**: Free

---

## 📁 Project Structure

```
yc-supabase/
├── browser-extension/       # Chrome extension for AI testing
│   ├── manifest.json
│   ├── popup.html
│   ├── background.js       # Main agent logic
│   └── README.md
│
├── src/
│   ├── agent/
│   │   ├── worker.js       # Standard Playwright agent
│   │   ├── aiWorker.js     # AI-powered agent
│   │   └── actions.js      # Action handlers
│   │
│   ├── server/
│   │   ├── videoStream.js  # Main server + dashboard
│   │   └── aiAgentServer.js # AI API routes
│   │
│   └── lib/
│       ├── supabase.js     # Database client
│       └── logger.js       # Logging
│
├── frontend/public/
│   ├── dashboard/          # Live agent dashboard
│   └── ai-agent.html       # Web-based AI UI
│
├── supabase/               # Database schema
│   └── migrations/
│
├── .env                    # Your configuration
├── package.json
└── README.md              # This file
```

---

## 🛠️ Configuration

Edit `.env` file:

```bash
# Required for AI Agent
ANTHROPIC_API_KEY=sk-ant-...

# Supabase (for test storage)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=your-key
SUPABASE_SERVICE_KEY=your-key

# Agent Settings
CONCURRENT_AGENTS=5          # Number of parallel agents
HEADLESS=true               # Run browsers in headless mode
SCREENSHOT_QUALITY=80       # Screenshot quality (1-100)

# Browser
BROWSER_TYPE=chromium       # chromium, firefox, or webkit
VIEWPORT_WIDTH=1920
VIEWPORT_HEIGHT=1080
```

---

## 🎮 Usage Examples

### Example 1: Wordle

```javascript
Goal: "Play Wordle - Close any popups, type ABOUT, press Enter, type CRANE, press Enter"

Expected behavior:
1. AI closes welcome modal
2. Types first word
3. Submits
4. Types second word
5. Submits
6. Takes final screenshot
```

### Example 2: Form Testing

```javascript
Goal: "Fill contact form with test@test.com, message 'Hello', submit, verify success"

Expected behavior:
1. AI finds email field
2. Types email
3. Finds message field
4. Types message
5. Clicks submit
6. Verifies success message
```

### Example 3: Shopping Flow

```javascript
Goal: "Search for 'laptop', click first result, check price is displayed"

Expected behavior:
1. AI finds search box
2. Types "laptop"
3. Submits search
4. Clicks first product
5. Verifies price exists
6. Completes test
```

---

## 💰 Costs

Claude 3.5 Sonnet pricing per test:

- **5 steps**: ~$0.05-0.15
- **10 steps**: ~$0.10-0.30
- **30 steps**: ~$0.30-0.90
- **50 steps**: ~$0.50-1.50

**Tips to reduce costs:**

- Increase screenshot interval (3-5 seconds)
- Use specific test goals
- Stop tests early when goal achieved

---

## 🚀 Running Tests

### Method 1: Browser Extension (Recommended)

```bash
# 1. Start server
npm start

# 2. Open Chrome with extension loaded
# 3. Navigate to website
# 4. Click extension → Configure → Start
```

### Method 2: Standard Playwright Tests

```bash
# Create test
node examples/loadSampleTests.js

# Run agents
npm start

# Or run single test
npm run test:single
```

### Method 3: Programmatic

```javascript
import { AIAgent } from "./src/agent/aiWorker.js";

const agent = new AIAgent(apiKey, testCaseId);
await agent.start();
```

---

## 📊 Monitoring

### Live Dashboard

View running agents in real-time:

```
http://localhost:3001/dashboard/
```

Shows:

- Active agents
- Running tests
- Live video streams
- Real-time stats

### API Endpoints

```bash
# Health check
curl http://localhost:3001/health

# Agent list
curl http://localhost:3001/api/agents

# AI Agent status
curl -X POST http://localhost:3001/api/ai-agent/start
```

---

## 🐛 Troubleshooting

### "Port 3001 already in use"

```bash
# Kill existing process
lsof -ti:3001 | xargs kill -9

# Or use different port
PORT=3002 npm start
```

### "API key invalid"

```bash
# Test your key
node test-anthropic-key.js

# Get new key at:
# https://console.anthropic.com/
```

### "Extension not working"

```bash
# Reload extension
chrome://extensions/ → Click reload icon

# Check logs
Right-click extension → "Inspect popup"
```

### "Element not found"

- Page might still be loading
- AI will retry on next screenshot
- Try increasing capture interval to 3-5 seconds

---

## 📚 Documentation

- **[AI_AGENT_GUIDE.md](AI_AGENT_GUIDE.md)** - Complete AI agent documentation
- **[browser-extension/README.md](browser-extension/README.md)** - Extension setup & usage

---

## 🔐 Security

- ✅ API keys stored in `.env` (never commit!)
- ✅ Screenshots only sent to your backend + Claude
- ✅ No data stored unless configured
- ✅ Extension uses scoped permissions

**Never commit `.env` file to git!**

---

## 🛣️ Roadmap

- [ ] Multi-tab support
- [ ] Test recording/replay
- [ ] Cost tracking dashboard
- [ ] Screenshot diff comparison
- [ ] GPT-4V and Gemini support
- [ ] Team collaboration
- [ ] CI/CD integration
- [ ] Test analytics

---

## 📄 License

MIT

---

## 🙏 Built With

- [Claude 3.5 Sonnet](https://anthropic.com/) - AI vision & reasoning
- [Playwright](https://playwright.dev/) - Browser automation
- [Supabase](https://supabase.com/) - Database & storage
- [Express.js](https://expressjs.com/) - Backend server
- [Chrome Extension API](https://developer.chrome.com/docs/extensions/) - Browser integration

---

## 🤝 Contributing

Contributions welcome! Open an issue or PR.

---

**Ready to let AI test your apps? 🚀**

Start here: `npm install && npm start`

Then load the browser extension and start testing!
