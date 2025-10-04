#!/bin/bash

# Test Live Stream Setup
# This script starts 1 agent with live streaming enabled for testing

echo "🚀 Starting test agent with live streaming..."
echo "📊 Dashboard: http://localhost:3001/dashboard/"
echo ""

# Set environment variables for live streaming
export ENABLE_LIVE_STREAM=true
export LIVE_STREAM_WS_URL=ws://localhost:3001/agent
export HEADLESS=false

# Start a single agent
node src/agent/worker.js

