#!/bin/bash

# Test 2 AI Agents with NGROK Streaming
# This ensures agents connect to the same ngrok endpoint as the dashboard

echo "🎮 Starting 2 AI Agents to Play Wordle (with ngrok streaming)"
echo "=============================================================="
echo ""

# Set the ngrok WebSocket URL for agents to connect to
export LIVE_STREAM_WS_URL="wss://replication.ngrok.io/agent"
export ENABLE_LIVE_STREAM=true
export AI_MODE=true
export CONCURRENT_AGENTS=2
export HEADLESS=true

echo "✅ Configuration:"
echo "   Agents: 2"
echo "   Stream Server: wss://replication.ngrok.io"
echo "   Dashboard: https://replication.ngrok.io/dashboard/"
echo ""

node run-custom-test.js \
  -p "Play Wordle and try to win the game by guessing the correct 5-letter word" \
  -u "https://www.nytimes.com/games/wordle" \
  -n 2 \
  --stream


