# 🤖 AI QA Agent - Browser Extension

An autonomous AI-powered QA testing agent that uses Claude's vision capabilities to intelligently test websites by analyzing screenshots and deciding what actions to take.

## Features

- 🧠 **AI-Powered**: Uses Claude 3.5 Sonnet with vision to analyze screenshots
- 📸 **Screenshot Capture**: Captures visible tab every N seconds
- 🎯 **Autonomous**: AI decides what to do based on test goal
- ⚡ **Real-time Execution**: Executes clicks, typing, keyboard actions in real-time
- 📊 **Live Logging**: See what the AI is thinking and doing

## Installation

### 1. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `browser-extension` folder

### 2. Setup Backend Server

The extension needs your backend server running to communicate with Claude API:

```bash
# From project root
npm install @anthropic-ai/sdk
npm start
```

Your server should be running on `http://localhost:3001`

### 3. Get Claude API Key

1. Go to https://console.anthropic.com/
2. Create an account or log in
3. Generate an API key
4. Copy the key (starts with `sk-ant-`)

## Usage

### Quick Start

1. **Navigate** to the website you want to test (e.g., open Wordle)
2. **Click** the extension icon in your browser toolbar
3. **Enter**:
   - Your Claude API key
   - Test goal (what you want the AI to test)
   - Screenshot interval (default: 2 seconds)
4. **Click** "Start Testing"
5. **Watch** the AI autonomously test your site!

### Example Test Goals

```
Play Wordle - Close any modals, type word guesses, and try to solve the puzzle
```

```
Test login flow - Find login button, fill email and password, submit form
```

```
Add item to cart - Search for "laptop", click first result, add to cart
```

### Stopping the Agent

Click "Stop Agent" button in the extension popup at any time.

## How It Works

1. **Capture**: Extension captures screenshot of visible tab every N seconds
2. **Analyze**: Screenshot is sent to your backend → Claude API with vision
3. **Decide**: Claude analyzes the screenshot and decides next action (click, type, wait, etc.)
4. **Execute**: Extension executes the action in the browser
5. **Repeat**: Loop continues until test goal is achieved or max steps reached

## Available Actions

The AI can perform these actions:

- **click**: Click on elements using CSS selector
- **type**: Type text into input fields
- **keyboard**: Press keyboard keys (Enter, Tab, etc.)
- **wait**: Wait for specified time
- **scroll**: Scroll up or down
- **complete**: Mark test as complete (success or failure)

## Architecture

```
Browser Extension
    ↓ (screenshot)
Backend Server (/api/ai-agent/*)
    ↓ (image + context)
Claude API (Vision)
    ↓ (next action)
Backend Server
    ↓ (action JSON)
Browser Extension
    ↓ (execute action)
Website
```

## Configuration

### Server URL

Default: `http://localhost:3001`

If your backend is hosted elsewhere, update the server URL in the extension popup.

### Capture Interval

- **Fast**: 1 second (more responsive, higher API costs)
- **Normal**: 2 seconds (balanced)
- **Slow**: 5+ seconds (cheaper, slower reactions)

### Max Steps

The agent will automatically stop after 50 steps to prevent infinite loops.

## Troubleshooting

### "Failed to start session"

- Check backend server is running (`npm start`)
- Verify API key is correct
- Check console for errors (F12 → Console tab)

### "Element not found"

- AI might be using wrong selector
- Page might not be fully loaded
- Try increasing screenshot interval

### High API Costs

- Increase screenshot interval (less frequent captures)
- Use more specific test goals
- Set lower max steps

## API Costs

Claude 3.5 Sonnet pricing (as of 2024):
- Input: $3 per million tokens
- Output: $15 per million tokens

Approximate cost per test:
- ~10 steps: $0.10-0.30
- ~30 steps: $0.30-0.90

Each screenshot is ~1500 tokens.

## Development

### File Structure

```
browser-extension/
├── manifest.json       # Extension configuration
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic
├── background.js      # Service worker (main logic)
├── content.js         # Content script (page interaction)
└── README.md          # This file
```

### Testing Locally

1. Make changes to extension files
2. Go to `chrome://extensions/`
3. Click reload icon on your extension card
4. Open extension popup and test

## Security Notes

- API key is stored in Chrome's local storage (encrypted)
- Screenshots are sent to your backend only
- No data is persisted without your permission
- Extension requires explicit permissions for each site

## Limitations

- Works only on visible tab content
- Cannot interact with browser dialogs
- Limited to actions defined in system prompt
- Requires Claude API key (costs money)
- Max 50 steps per test session

## Future Enhancements

- [ ] Multi-tab support
- [ ] Screenshot history viewer
- [ ] Cost tracking dashboard
- [ ] Custom action definitions
- [ ] Test recording and replay
- [ ] Integration with CI/CD

## Support

For issues or questions, check:
- Extension console: Right-click extension icon → "Inspect popup"
- Background service worker: chrome://extensions/ → "Inspect views: service worker"
- Backend logs: Check your terminal running `npm start`

## License

MIT

