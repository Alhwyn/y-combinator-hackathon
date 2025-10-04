#!/bin/bash

# Test Railway Agents with Live Video
# This script loads tests into your Railway deployment

echo "🎬 Testing Railway Agents with Live Video Streaming..."
echo ""
echo "📊 Dashboard: https://multi-agent-testing-production.up.railway.app/dashboard"
echo ""
echo "Make sure:"
echo "  ✅ Dashboard is open in your browser"
echo "  ✅ You see 5 agents online"
echo ""
echo "Loading sample tests..."
echo ""

# Load sample tests
npm run load:samples

echo ""
echo "✅ Tests loaded!"
echo ""
echo "👀 Watch the dashboard - agents should:"
echo "  1. Pick up tests (Test ID appears)"
echo "  2. Show live video feed (2 FPS)"
echo "  3. Complete and go back to 'Idle'"
echo ""
echo "If video doesn't appear, check Railway environment variables:"
echo "  ENABLE_LIVE_STREAM=true"
echo "  LIVE_STREAM_PORT=3001"
echo "  LIVE_STREAM_FPS=2"
echo "  LIVE_STREAM_QUALITY=60"
echo ""

