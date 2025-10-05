#!/bin/bash

# Simple script to spawn 2 AI agents with a custom prompt
# Usage: ./spawn-2-agents.sh "Your test prompt here" "https://url-to-test.com"

PROMPT="${1:-Play Wordle and try to win the game}"
URL="${2:-https://www.nytimes.com/games/wordle}"

echo "🤖 Spawning 2 AI Agents"
echo "======================="
echo "Prompt: $PROMPT"
echo "URL: $URL"
echo ""

# Set environment for AI mode with streaming
export AI_MODE=true
export ENABLE_LIVE_STREAM=true
export CONCURRENT_AGENTS=2
export HEADLESS=true
# Use localhost for agent streaming (avoids 502 errors through ngrok)
export LIVE_STREAM_WS_URL="ws://localhost:3001/agent"

# Create test case and spawn agents
node run-custom-test.js \
  -p "$PROMPT" \
  -u "$URL" \
  -n 2 \
  --stream


