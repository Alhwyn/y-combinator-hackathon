# 🤖 AI Agent Mode - Complete Guide

## Overview

The AI Agent Mode allows Claude (Anthropic's AI) to autonomously test your websites by:

1. 📸 Taking screenshots every 2 seconds (configurable)
2. 🧠 Analyzing what's on screen using vision
3. 💡 Deciding what action to take next
4. ⚡ Executing that action in real-time
5. 🔄 Repeating until the test goal is achieved

**This is like having an AI QA tester that can see and interact with your website!**

---

## 🎯 Use Cases

- **Exploratory Testing**: Let AI discover bugs by freely exploring your app
- **Regression Testing**: Describe a user flow, AI figures out how to do it
- **Accessibility Testing**: AI can identify issues humans might miss
- **Cross-browser Testing**: Run same test with different browsers
- **Dynamic UIs**: No need for brittle selectors, AI adapts to changes

---

## 🚀 Spawning Multiple AI Agents in Parallel

### Option 1: Using the Spawn Script (Easiest)

```bash
# Make sure your .env has ANTHROPIC_API_KEY set
./spawn-ai-agents.sh
```

This will spawn 5 AI agents by default that:

- ✅ Take screenshots of web pages
- ✅ Use Claude vision to analyze what's on screen
- ✅ Autonomously decide what actions to take
- ✅ Run tests in parallel

### Option 2: Using Environment Variables

```bash
# Enable AI mode
export AI_MODE=true

# Set number of parallel agents (default: 5)
export CONCURRENT_AGENTS=10

# Start the system
npm start
```

### Option 3: Direct Node Execution

```bash
AI_MODE=true CONCURRENT_AGENTS=5 node src/index.js
```

### Configuration Options

```bash
# AI Mode (required for autonomous testing)
AI_MODE=true

# Number of agents to spawn (default: 5)
CONCURRENT_AGENTS=10

# Anthropic API Key (required for AI mode)
ANTHROPIC_API_KEY=your_key_here

# Browser settings
BROWSER_TYPE=chromium  # or firefox, webkit
HEADLESS=false         # Set to true for headless mode

# Live streaming (optional - see test execution in real-time)
ENABLE_LIVE_STREAM=true
LIVE_STREAM_FPS=2
```

---

## 🚀 Quick Start (Browser Extension Method)

### 1. Install Dependencies

```bash
npm install
```

This will install `@anthropic-ai/sdk` and other dependencies.

### 2. Start Backend Server

```bash
npm start
```

Server runs on `http://localhost:3001`

### 3. Load Browser Extension

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `browser-extension/` folder

### 4. Get Claude API Key

1. Visit https://console.anthropic.com/
2. Sign up / Log in
3. Generate API key (starts with `sk-ant-`)
4. Copy the key

### 5. Run Your First AI Test

1. Navigate to website you want to test (e.g., https://www.nytimes.com/games/wordle/)
2. Click extension icon
3. Enter:
   - API key
   - Test goal: "Play Wordle - Close modals, type words, try to solve"
   - Interval: 2 seconds
4. Click "Start Testing"
5. Watch the magic happen! 🎉

---

## 📖 How It Works

### Architecture

```
┌─────────────────────┐
│ Browser Extension   │ Takes screenshot every 2s
│  (Chrome/Firefox)   │
└──────────┬──────────┘
           │ Screenshot (base64)
           ↓
┌─────────────────────┐
│  Backend Server     │ Forwards to Claude API
│  (Express.js)       │
└──────────┬──────────┘
           │ Image + Context
           ↓
┌─────────────────────┐
│   Claude 3.5        │ Analyzes screenshot
│   (Vision API)      │ Decides next action
└──────────┬──────────┘
           │ Action JSON
           ↓
┌─────────────────────┐
│ Browser Extension   │ Executes action
└──────────┬──────────┘
           │ Click, type, etc.
           ↓
┌─────────────────────┐
│   Your Website      │ State changes
└─────────────────────┘
```

### Example Conversation Flow

**Step 1:**

- Screenshot: Wordle homepage with modal
- AI: `{"type": "click", "selector": ".Modal-module_closeIcon__TcEKb", "description": "Close welcome modal"}`
- Executes: Click on modal close button

**Step 2:**

- Screenshot: Empty Wordle grid
- AI: `{"type": "keyboard", "key": "A", "description": "Start typing first word"}`
- Executes: Press 'A' key

**Step 3:**

- Screenshot: Letter 'A' in first box
- AI: `{"type": "keyboard", "key": "B", "description": "Continue word"}`
- Executes: Press 'B' key

... continues until test goal achieved ...

**Final Step:**

- Screenshot: Solved puzzle
- AI: `{"type": "complete", "reason": "Successfully solved Wordle", "success": true}`
- Test ends with success

---

## 🛠️ Configuration

### Backend Environment Variables

Add to `.env`:

```bash
# Required for AI Agent
ANTHROPIC_API_KEY=sk-ant-...  # Your Claude API key

# Optional
LIVE_STREAM_PORT=3001          # Backend server port
NODE_ENV=development           # development or production
```

### Extension Settings

- **API Key**: Your Anthropic API key (stored securely in Chrome)
- **Server URL**: Backend server address (default: http://localhost:3001)
- **Test Goal**: Natural language description of what to test
- **Capture Interval**: How often to take screenshots (1-10 seconds)

### Test Goal Examples

Good test goals are specific but flexible:

```
✅ "Close any popups, search for 'laptop', click first result, add to cart"
✅ "Navigate to login page, fill invalid credentials, verify error message"
✅ "Play through the tutorial, complete first level, check score"

❌ "Test the website" (too vague)
❌ "Click button with ID #submit-btn-2023" (too specific)
```

---

## 📊 Available Actions

The AI can perform these actions:

### click

```json
{
  "type": "click",
  "selector": "button.submit",
  "description": "Click submit button"
}
```

### type

```json
{
  "type": "type",
  "selector": "input#email",
  "value": "test@example.com",
  "description": "Enter email address"
}
```

### keyboard

```json
{
  "type": "keyboard",
  "key": "Enter",
  "description": "Press Enter to submit"
}
```

### wait

```json
{
  "type": "wait",
  "ms": 2000,
  "description": "Wait for page to load"
}
```

### scroll

```json
{
  "type": "scroll",
  "direction": "down",
  "description": "Scroll to see more content"
}
```

### complete

```json
{
  "type": "complete",
  "reason": "Test goal achieved - user logged in successfully",
  "success": true
}
```

---

## 💰 Cost Estimation

Claude 3.5 Sonnet pricing:

- **Input**: $3 per million tokens (~$0.003 per 1K tokens)
- **Output**: $15 per million tokens (~$0.015 per 1K tokens)

### Cost per Test

Each screenshot ≈ 1,500 tokens

| Steps | Screenshots | Approx Cost |
| ----- | ----------- | ----------- |
| 5     | 5           | $0.05-0.15  |
| 10    | 10          | $0.10-0.30  |
| 30    | 30          | $0.30-0.90  |
| 50    | 50          | $0.50-1.50  |

**Tips to reduce costs:**

- Increase screenshot interval (less frequent = fewer API calls)
- Use specific test goals (AI finishes faster)
- Stop tests early if goal achieved
- Use cheaper intervals during development (5+ seconds)

---

## 🔒 Security & Privacy

### Data Handling

- Screenshots sent to: Your backend → Claude API
- API key stored: Chrome local storage (encrypted)
- No data persisted: Screenshots not saved (unless you choose to)
- Scoped permissions: Extension only accesses pages you visit

### Best Practices

- ✅ Use test accounts (don't use real credentials)
- ✅ Test on staging/dev environments
- ✅ Review AI actions before production use
- ✅ Rotate API keys regularly
- ❌ Don't test pages with sensitive data
- ❌ Don't commit API keys to git

---

## 🐛 Troubleshooting

### "Failed to start session"

**Symptoms**: Extension shows error when starting

**Solutions**:

- Check backend is running (`npm start`)
- Verify API key is correct
- Check browser console (F12) for errors
- Ensure port 3001 is not blocked

### "Element not found"

**Symptoms**: AI tries to click but fails

**Solutions**:

- Page might not be loaded yet → AI should use `wait` action
- AI using wrong selector → May self-correct on next iteration
- Dynamic content → Increase screenshot interval
- Check extension console for exact error

### High Costs / Too Many Steps

**Symptoms**: Test uses 50+ steps or costs too much

**Solutions**:

- Make test goal more specific
- Increase capture interval (3-5 seconds)
- Set lower max steps in code
- Review AI's reasoning in logs

### Extension Not Working

**Symptoms**: No response when clicking "Start"

**Solutions**:

- Check extension loaded: `chrome://extensions/`
- Inspect popup: Right-click extension → "Inspect popup"
- Check background worker: Extensions page → "Inspect views"
- Reload extension after code changes

---

## 🧪 Testing Examples

### Example 1: Wordle

```javascript
// Navigate to Wordle
Goal: "Play Wordle - Close any modals, type strategic words like ABOUT, CRANE, LIGHT, try to solve the puzzle"

Expected behavior:
1. Close welcome modal
2. Type first word (e.g., ABOUT)
3. Press Enter
4. Analyze feedback
5. Type next word based on clues
6. Continue until solved or max steps
```

### Example 2: Login Form

```javascript
Goal: "Test login - Find login button, fill email 'test@test.com' and password '12345', submit, verify error message appears"

Expected behavior:
1. Locate "Login" button and click
2. Find email input and type
3. Find password input and type
4. Click submit button
5. Wait for response
6. Look for error message
7. Complete with success if error shown
```

### Example 3: Shopping Cart

```javascript
Goal: "Add product to cart - Search for 'laptop', click first result, select quantity 2, add to cart, verify cart shows 2 items"

Expected behavior:
1. Find search box
2. Type "laptop"
3. Submit search
4. Click first product
5. Change quantity to 2
6. Click "Add to Cart"
7. Verify cart badge shows "2"
8. Complete with success
```

---

## 📁 File Structure

```
yc-supabase/
├── browser-extension/           # Chrome Extension
│   ├── manifest.json           # Extension config
│   ├── popup.html              # UI popup
│   ├── popup.js                # Popup logic
│   ├── background.js           # Service worker (main agent logic)
│   ├── content.js              # Page interaction
│   └── README.md               # Extension docs
│
├── src/
│   ├── agent/
│   │   ├── aiWorker.js         # AI agent for server-side use
│   │   ├── worker.js           # Standard Playwright agent
│   │   └── actions.js          # Action handlers
│   │
│   └── server/
│       ├── videoStream.js      # Main server + dashboard
│       └── aiAgentServer.js    # AI agent API routes
│
├── frontend/public/
│   ├── dashboard/              # Live agent dashboard
│   └── ai-agent.html           # Web-based AI agent UI
│
├── test-ai-agent.js            # Create AI test in database
└── AI_AGENT_GUIDE.md          # This file
```

---

## 🔄 Standard vs AI Agent

| Feature         | Standard Agent         | AI Agent              |
| --------------- | ---------------------- | --------------------- |
| **Actions**     | Pre-scripted           | AI-decided            |
| **Flexibility** | Fixed sequence         | Adaptive              |
| **Selectors**   | Must be exact          | AI figures out        |
| **Setup**       | Write test code        | Natural language      |
| **Cost**        | Free (Playwright)      | Pay per API call      |
| **Speed**       | Fast                   | Slower (API latency)  |
| **Reliability** | High (deterministic)   | Medium (AI reasoning) |
| **Maintenance** | Update when UI changes | Self-adapting         |

### When to Use Each

**Use Standard Agent when:**

- ✅ Test steps are well-defined
- ✅ UI is stable
- ✅ Need high speed/reliability
- ✅ Running thousands of tests
- ✅ CI/CD integration

**Use AI Agent when:**

- ✅ Exploring new features
- ✅ UI changes frequently
- ✅ Complex user flows
- ✅ Manual test automation
- ✅ Rapid prototyping

---

## 🚢 Deployment

### Local Development

```bash
# Terminal 1: Start backend
npm start

# Terminal 2: Load extension in Chrome
# (chrome://extensions → Load unpacked)

# Ready to test!
```

### Production Deployment

#### Backend (Railway/Heroku/Fly.io)

```bash
# Add environment variable
ANTHROPIC_API_KEY=sk-ant-...

# Deploy
git push railway main
# or
flyctl deploy
```

#### Extension Distribution

1. **Chrome Web Store**: Package and submit extension
2. **Internal**: Share extension folder with team
3. **Firefox**: Convert manifest v3 to v2

---

## 📈 Advanced Usage

### Custom System Prompt

Edit `background.js` to customize AI behavior:

```javascript
function buildSystemPrompt(goal, url) {
  return `You are a QA agent specialized in ${yourDomain}.
  
  Additional rules:
  - Always check for accessibility issues
  - Report any console errors
  - Take screenshots before important actions
  
  Goal: ${goal}
  URL: ${url}`;
}
```

### Multi-Step Workflows

Chain multiple test goals:

```javascript
const tests = [
  { goal: "Register new account", url: "/signup" },
  { goal: "Complete onboarding", url: "/onboarding" },
  { goal: "Create first project", url: "/dashboard" },
];

// Run sequentially with AI agent
```

### Integration with CI/CD

```yaml
# .github/workflows/ai-test.yml
name: AI QA Tests
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: npm install
      - run: npm start &
      - uses: browser-actions/setup-chrome@latest
      - run: node run-ai-tests.js
```

---

## 🤝 Contributing

Ideas for improvements:

- [ ] Support for multiple tabs
- [ ] Test recording/replay
- [ ] Cost tracking dashboard
- [ ] Screenshot diff comparison
- [ ] Integration with test frameworks (Jest, Playwright)
- [ ] Support for other AI models (GPT-4V, Gemini Vision)
- [ ] Team collaboration features
- [ ] Test result analytics

---

## 📚 Resources

- [Claude API Documentation](https://docs.anthropic.com/)
- [Chrome Extension Dev Guide](https://developer.chrome.com/docs/extensions/)
- [Playwright Documentation](https://playwright.dev/)
- [Supabase Documentation](https://supabase.com/docs)

---

## ❓ FAQ

**Q: Can AI agent test any website?**
A: Yes, but works best on public-facing sites. May struggle with complex SPAs or sites with heavy bot protection.

**Q: How accurate is the AI?**
A: Very good for standard UI patterns. May need guidance for custom/unusual interfaces.

**Q: Can I use GPT-4 instead of Claude?**
A: Yes! Modify `aiAgentServer.js` to call OpenAI API instead. GPT-4V also supports vision.

**Q: Does this work offline?**
A: No, requires internet for Claude API calls.

**Q: Can I run multiple agents simultaneously?**
A: Yes! Each agent is independent. Launch multiple browser instances.

**Q: Is my data safe?**
A: Screenshots go to Anthropic servers (Claude API). Don't test pages with sensitive data. Read [Anthropic's Privacy Policy](https://www.anthropic.com/privacy).

**Q: Can this replace human testers?**
A: No, it's a tool to augment human testing. Great for repetitive tasks, but humans still needed for complex scenarios and edge cases.

---

## 🎉 Next Steps

1. ✅ Install extension
2. ✅ Run first test
3. 📖 Read browser extension README
4. 🧪 Try different test goals
5. 🚀 Integrate into your workflow
6. 💡 Share feedback and improvements!

**Happy testing! 🤖✨**
