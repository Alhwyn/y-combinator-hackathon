# 🎬 AI Agent Live Dashboard - User Guide

## What is This?

This is a **real-time monitoring dashboard** where you can watch AI agents perform automated QA testing on websites. Think of it as a "mission control" where you see multiple AI bots testing different websites simultaneously.

**Live Dashboard URL**: https://replication.ngrok.io/dashboard/

---

## 🌟 What You'll See

When you open the dashboard, you'll see:

### 1. **Connection Status Bar**

- 🟢 **Green**: Connected to the live stream server
- 🔴 **Red**: Disconnected (will auto-reconnect)

### 2. **Live Statistics Cards**

Three main stats displayed prominently:

- **Active Agents**: Number of AI bots currently running
- **Running Tests**: How many tests are actively executing
- **Stream FPS**: Frames per second (video quality indicator)

### 3. **Agent Cards Grid**

Each AI agent gets its own card showing:

- **Agent Name**: Unique identifier for each bot
- **Status Indicator**:
  - Green pulsing dot = Online and active
  - Red dot = Offline
- **Live Video Feed**: Real-time stream of what the agent is doing
- **Current Test ID**: The test the agent is running (or "Idle")

---

## 📖 Step-by-Step Usage Guide

### Step 1: Open the Dashboard

1. Open your web browser (Chrome, Firefox, Safari, or Edge)
2. Navigate to: **https://replication.ngrok.io/dashboard/**
3. Wait for the connection status to turn green (✅ Connected)

**Expected result**: You should see the dashboard header "🎬 Agent Live Dashboard" and connection status at the top.

### Step 2: Wait for Agents to Appear

When agents start running tests, they'll automatically appear on the dashboard.

**What you'll see:**

```
Initial state: "Waiting for agents..." with a loading spinner
After agents start: Individual cards for each agent appear
```

**If no agents appear:**

- Agents might not be running yet
- Wait 10-30 seconds for them to initialize
- Check that the backend server is running

### Step 3: Watch Live Testing

Once agents appear, you can:

1. **Watch the Video Streams**

   - Each agent card shows live video of the browser it's controlling
   - You'll see the AI navigating websites, clicking buttons, typing text
   - Videos update in real-time (typically 1-5 FPS)

2. **Monitor Test Progress**

   - Look at the "Test ID" field under each video
   - Shows which test is currently running
   - Changes to "Idle" when test completes

3. **Check Overall Stats**
   - Active Agents: Total bots online
   - Running Tests: How many are actively working
   - Stream FPS: Combined frame rate from all streams

### Step 4: Understanding Agent Behavior

**What the AI agents do:**

- Open websites automatically
- Analyze what they see using AI vision
- Click buttons, fill forms, navigate pages
- Take screenshots and verify results
- Complete tests automatically

**Example test you might see:**

```
Agent "agent-1"
→ Opens Wordle website
→ Closes popup modals
→ Types word guesses
→ Verifies game state
→ Completes test
```

### Step 5: Identifying Issues

**Green pulsing dot**: Agent is healthy and working
**Video streaming**: Everything is working correctly
**"Idle" status**: Agent finished its test and waiting for next one

**Troubleshooting indicators:**

- **Red/Offline status**: Agent disconnected (will restart automatically)
- **"Waiting for stream..."**: Agent connected but not sending video yet
- **No video but agent online**: Agent might be loading the page

---

## 💡 What Am I Actually Seeing?

### The Video Feeds Show:

1. **Browser Automation in Real-Time**

   - Actual websites being tested
   - Mouse clicks (you'll see elements being clicked)
   - Text being typed into forms
   - Page navigation and scrolling

2. **AI Decision Making**

   - Every 2-5 seconds, the AI takes a screenshot
   - Analyzes what it sees
   - Decides what action to take next
   - Executes that action

3. **Test Execution**
   - Opening websites (Wordle, e-commerce sites, forms, etc.)
   - Interacting with elements
   - Verifying expected behavior
   - Moving to next test

### Example Test Flow You'll See:

```
📸 Screenshot 1: Agent sees Wordle homepage with modal
🤖 AI Decision: "Close the modal popup"
⚡ Action: Clicks the X button

📸 Screenshot 2: Agent sees game board
🤖 AI Decision: "Type first word guess"
⚡ Action: Types "CRANE" and presses Enter

📸 Screenshot 3: Agent sees results
🤖 AI Decision: "Type second word based on results"
⚡ Action: Types "ABOUT" and presses Enter

... and so on until test completes
```

---

## 🎯 Common Scenarios

### Scenario 1: "I see agents but no video"

**What's happening**: Agent is connected but hasn't started streaming yet

**What to do**:

- Wait 10-20 seconds
- Agent might be loading the website
- If it persists, the agent might have crashed (it will restart automatically)

### Scenario 2: "Connection keeps dropping"

**What's happening**: Network issue or server restart

**What to do**:

- Dashboard will auto-reconnect (you'll see "reconnecting..." message)
- Wait 10-30 seconds
- If it doesn't reconnect after a few attempts, refresh the page

### Scenario 3: "All agents show as offline"

**What's happening**: Backend server might be down or restarting

**What to do**:

- Wait 1-2 minutes
- Backend might be deploying updates
- Check back in 5 minutes

### Scenario 4: "Stats show 0 agents"

**What's happening**: No agents are currently running

**What to do**:

- This is normal if no tests are scheduled
- Agents start automatically when tests are created
- Check with your team if agents should be running

---

## 🚀 Advanced Usage

### Monitoring Multiple Agents

The dashboard supports monitoring many agents simultaneously:

- Each gets its own card in a grid layout
- Cards auto-arrange based on screen size
- On mobile: Stacks vertically
- On desktop: Shows 2-3 per row

### Understanding the FPS Counter

**Stream FPS** shows video quality:

- **0-1 FPS**: Normal (screenshots are captured every 2-5 seconds)
- **2-5 FPS**: Good (high activity, multiple agents)
- **10+ FPS**: Excellent (many agents streaming simultaneously)

**Note**: This isn't like watching a video game. Testing happens in "steps" every few seconds, so low FPS is completely normal and expected.

### Reading Test IDs

Test IDs look like: `550e8400-e29b-41d4-a716-446655440000`

- This is a unique identifier for each test
- Shortened to first 8 characters in the UI (e.g., `550e8400...`)
- Use this to track which specific test an agent is running

---

## 📱 Mobile vs Desktop Experience

### Desktop (Recommended)

- ✅ Shows multiple agents side-by-side
- ✅ Larger video streams
- ✅ Better for monitoring many agents
- ✅ Full statistics visible

### Mobile

- ✅ Agents stack vertically
- ✅ Scroll to see all agents
- ✅ Touch-friendly interface
- ⚠️ Smaller video streams

**Best viewed on**: Laptop or desktop with screen width 1280px+

---

## 🔒 Privacy & Security

### What Data is Sent?

- Only video frames of browser automation
- Test status updates
- Agent connection status

### What Data is NOT Sent?

- Your personal browsing data
- Any data from websites you visit personally
- API keys or credentials

### Is This Secure?

- ✅ Connection uses WSS (secure WebSocket)
- ✅ Only shows pre-defined test automation
- ✅ No recording or storage of video (live stream only)
- ✅ Hosted on secure ngrok tunnel with HTTPS

---

## 🆘 Troubleshooting

### Problem: "Page won't load"

**Solutions:**

1. Check your internet connection
2. Try refreshing the page (F5 or Cmd+R)
3. Clear browser cache and try again
4. Try a different browser

### Problem: "Everything shows as disconnected"

**Solutions:**

1. Wait 30 seconds for auto-reconnect
2. Refresh the page
3. Check if the URL is correct: https://replication.ngrok.io/dashboard/
4. Contact your team lead if issue persists

### Problem: "Videos are frozen"

**Solutions:**

1. This is normal between test steps (AI takes screenshot every 2-5 seconds)
2. If frozen for more than 30 seconds, agent might be idle
3. Check if Test ID shows "Idle" (means agent is waiting for work)

### Problem: "I see errors in the video"

**What you're seeing:**

- This is the AI agent actually testing error scenarios
- Seeing errors is often part of the test (testing error handling)
- Red error messages in the video = test might be verifying error states

---

## 🎓 Tips for Best Experience

1. **Use a large screen**: Easier to monitor multiple agents
2. **Keep the tab open**: Dashboard only streams when the tab is active
3. **Don't refresh too often**: Let the connection stabilize
4. **Watch the stats**: Quick way to see if everything is working
5. **Check FPS**: If it's 0 for more than 1 minute, something might be wrong

---

## 🌐 Browser Compatibility

### Fully Supported:

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Edge 90+
- ✅ Safari 14+

### Requirements:

- JavaScript enabled
- WebSocket support
- Modern CSS support

---

## 📊 What This Dashboard is Used For

### QA Teams

- Monitor automated tests in real-time
- Verify agents are working correctly
- Debug test failures by watching what happens

### Project Managers

- See testing progress
- Verify tests are running
- Check system health

### Developers

- Debug test automation issues
- Verify new features work across different scenarios
- Monitor CI/CD test execution

---

## ❓ Frequently Asked Questions

### Q: How often do the videos update?

**A:** Every 2-5 seconds (when agents take new screenshots)

### Q: Can I control the agents from the dashboard?

**A:** No, this is view-only. Agents run autonomously based on their test goals.

### Q: Why do agents sometimes stop?

**A:** Tests complete, or they're waiting for the next test to be assigned.

### Q: How many agents can I see at once?

**A:** The system supports up to 100 agents, but typically you'll see 5-20.

### Q: Can I download the videos?

**A:** No, this is a live stream only (not recorded).

### Q: What if I see something wrong in a test?

**A:** Note the Test ID and agent name, and report it to your team.

### Q: Does this use my computer resources?

**A:** Minimal - just displays video streams. All testing happens on the backend servers.

---

## 🎉 You're Ready!

That's everything you need to know to use the AI Agent Live Dashboard!

### Quick Summary:

1. **Open**: https://replication.ngrok.io/dashboard/
2. **Wait**: For agents to appear and connect
3. **Watch**: Live streams of AI testing websites
4. **Monitor**: Stats show system health

**Enjoy watching the AI agents work! 🤖✨**

---

## 📞 Need Help?

If you encounter issues:

1. Try the troubleshooting section above
2. Refresh the page and wait 30 seconds
3. Contact your team lead or project administrator
4. Check system status with your DevOps team

---

_Last Updated: October 2025_
