# 🚀 Run Custom AI Agent Tests

Quick guide to running AI agents with custom prompts and URLs from the command line.

## Prerequisites

Make sure you have:

- ✅ `ANTHROPIC_API_KEY` set in your `.env` file
- ✅ `SUPABASE_URL` and `SUPABASE_KEY` configured
- ✅ Node.js installed

## Usage

### Option 1: Node.js Script (Recommended)

```bash
node run-custom-test.js -p "Your test prompt" -u "https://example.com" -n 3
```

### Option 2: Shell Script

```bash
./run-custom-test.sh -p "Your test prompt" -u "https://example.com" -n 3
```

## Command Line Options

| Option | Long Form  | Description                 | Required | Default  |
| ------ | ---------- | --------------------------- | -------- | -------- |
| `-p`   | `--prompt` | Test goal/prompt            | ✅ Yes   | -        |
| `-u`   | `--url`    | Demo URL to test            | ✅ Yes   | -        |
| `-n`   | `--agents` | Number of agents            | ❌ No    | 1        |
| `-s`   | `--stream` | Enable live video streaming | ❌ No    | disabled |
| `-h`   | `--help`   | Show help message           | ❌ No    | -        |

## Examples

### 1. Test a Login Form

```bash
node run-custom-test.js \
  -p "Test the login form with valid credentials" \
  -u "https://example.com/login" \
  -n 1
```

### 2. Play Wordle with Multiple Agents

```bash
node run-custom-test.js \
  -p "Play Wordle and try to win" \
  -u "https://www.nytimes.com/games/wordle" \
  -n 5
```

### 3. E-commerce Test with Live Streaming

```bash
node run-custom-test.js \
  -p "Add items to cart and proceed to checkout" \
  -u "https://example-shop.com" \
  -n 3 \
  --stream
```

### 4. UI Navigation Test

```bash
node run-custom-test.js \
  -p "Navigate through the menu and find the contact page" \
  -u "https://example.com" \
  -n 2
```

### 5. Form Validation Test

```bash
node run-custom-test.js \
  -p "Test form validation by entering invalid data" \
  -u "https://example.com/signup" \
  -n 1
```

## What Happens When You Run It?

1. **Creates Test Case**: The script automatically creates a test case in your Supabase database with:

   - Your custom prompt as the test goal
   - The URL to test
   - Metadata about the test run

2. **Spawns AI Agents**: Launches the specified number of agents that:

   - Navigate to your URL
   - Take screenshots
   - Use Claude Vision to analyze what's on screen
   - Autonomously perform actions based on your prompt
   - Report results back to Supabase

3. **Live Monitoring**: If streaming is enabled, you can watch agents in real-time at:
   - 🎬 Dashboard: `https://replication.ngrok.io/dashboard/`

## Environment Variables

You can customize agent behavior with these environment variables:

```bash
# Browser settings
export BROWSER_TYPE=chromium        # chromium, firefox, or webkit
export HEADLESS=false               # true for headless, false to see browser

# Enable live streaming
export ENABLE_LIVE_STREAM=true

# Then run your test
node run-custom-test.js -p "Test something" -u "https://example.com"
```

## Advanced: Multiple Parallel Tests

Run different tests in parallel using multiple terminals:

**Terminal 1:**

```bash
node run-custom-test.js -p "Test login flow" -u "https://app1.com" -n 2
```

**Terminal 2:**

```bash
node run-custom-test.js -p "Test checkout" -u "https://app2.com" -n 3
```

## Stopping Tests

Press `Ctrl+C` in the terminal to gracefully stop all agents.

## Viewing Results

### Live Dashboard

If streaming is enabled:

- Visit: `https://replication.ngrok.io/dashboard/`
- Watch agents work in real-time

### Supabase Database

Check your Supabase tables:

- `test_cases`: See all created tests
- `test_results`: View test outcomes
- `test_steps`: Detailed step-by-step actions

### Browser Extension

Use the browser extension to:

- Monitor running agents
- Start/stop agents
- View live logs

## Tips

1. **Start Small**: Begin with 1-2 agents to test your prompt
2. **Be Specific**: Clear, specific prompts get better results
3. **Watch Live**: Use `--stream` to see what agents are doing
4. **Iterate**: Refine your prompts based on agent behavior
5. **Scale Up**: Once working, increase agent count for parallel testing

## Troubleshooting

### "ANTHROPIC_API_KEY is not set"

```bash
# Add to your .env file
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### "Failed to create test case"

- Check your Supabase credentials in `.env`
- Ensure Supabase migrations are up to date
- Verify database tables exist

### Agents not finding the test

- The script creates an "active" test automatically
- Agents will pick it up within seconds
- Check Supabase `test_cases` table

### Need more help?

```bash
node run-custom-test.js --help
```

## Quick Reference Card

```bash
# Most common usage
node run-custom-test.js -p "Your prompt" -u "URL" -n 5

# With streaming
node run-custom-test.js -p "Your prompt" -u "URL" -n 3 -s

# Different browser
BROWSER_TYPE=firefox node run-custom-test.js -p "Test" -u "URL"

# Visible browser (not headless)
HEADLESS=false node run-custom-test.js -p "Test" -u "URL"
```

---

## 🎯 Example Use Cases

### QA Testing

```bash
node run-custom-test.js \
  -p "Test all buttons and links on the homepage" \
  -u "https://myapp.com" \
  -n 3 --stream
```

### Stress Testing

```bash
node run-custom-test.js \
  -p "Repeatedly submit the contact form" \
  -u "https://myapp.com/contact" \
  -n 10
```

### User Journey

```bash
node run-custom-test.js \
  -p "Complete the full user registration flow" \
  -u "https://myapp.com/signup" \
  -n 5 --stream
```

### Accessibility Check

```bash
node run-custom-test.js \
  -p "Test keyboard navigation through the site" \
  -u "https://myapp.com" \
  -n 1
```

---

Happy testing! 🎉
