#!/bin/bash

echo "🎬 Starting AI QA System with Live Video..."
echo ""

# Kill old server
echo "1️⃣ Stopping old server..."
lsof -ti:3001 | xargs kill -9 2>/dev/null
sleep 2

# Start with live streaming
echo "2️⃣ Starting server with LIVE STREAMING enabled..."
echo ""
npm start &

# Wait for server to start
sleep 5

echo ""
echo "3️⃣ Creating Wordle test..."
node test-wordle.js

echo ""
echo "✅ DONE! Watch the test execution:"
echo ""
echo "   📺 Dashboard: http://localhost:3001/dashboard/"
echo "   🎥 You should see live video of the agent playing Wordle!"
echo ""
echo "   Press Ctrl+C to stop the server when done."
echo ""
