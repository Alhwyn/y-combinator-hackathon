# 🎯 Get Started in 3 Minutes

The fastest way to start AI testing.

---

## Step 1: Install (30 seconds)

```bash
npm install
```

---

## Step 2: Add API Key (30 seconds)

Edit `.env` file:

```bash
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Get key at: https://console.anthropic.com/

---

## Step 3: Start Server (10 seconds)

```bash
npm start
```

Wait for:

```
✅ Video stream server started
Spawning 5 agents...
```

---

## Step 4: Load Extension (60 seconds)

1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select `browser-extension/` folder
5. Done! 🎉

---

## Step 5: Test! (60 seconds)

1. Navigate to: https://www.nytimes.com/games/wordle/
2. Click extension icon (robot 🤖)
3. Test goal: `"Play Wordle - Close modals, type words"`
4. Click "Start Testing"
5. **Watch AI work!** 🚀

---

## ✅ You're Ready!

The AI agent is now testing your site autonomously.

### What Next?

- 📖 Read [README.md](README.md) for overview
- 🛠️ Check [SETUP.md](SETUP.md) for detailed setup
- 📚 See [AI_AGENT_GUIDE.md](AI_AGENT_GUIDE.md) for advanced usage
- ⚡ Use [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for commands

---

## 🎮 Try These Tests

### E-commerce

```
"Search for 'laptop', click first result, check price displays"
```

### Form

```
"Fill contact form with test@test.com and message, submit"
```

### Login

```
"Click login, enter invalid credentials, verify error shows"
```

### Navigation

```
"Click each menu item and verify page loads"
```

---

## 💡 Pro Tips

- **Start simple**: Test 1-2 actions first
- **Be specific**: Better results with clear goals
- **Watch costs**: Each test ~$0.10-0.50
- **Use 2 sec interval**: Good balance of speed/cost

---

## 🆘 Issues?

```bash
# Port in use?
lsof -ti:3001 | xargs kill -9

# API key not working?
node test-anthropic-key.js

# Extension not loading?
chrome://extensions/ → Reload
```

---

**That's it! Happy testing! 🤖✨**
