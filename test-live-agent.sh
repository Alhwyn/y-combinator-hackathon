#!/bin/bash

# Test Live Agent Setup
# This script tests a single agent with live streaming

echo "🎬 Testing Live Agent with Streaming..."
echo ""
echo "✅ Stream server should be running on http://localhost:3001"
echo "✅ Dashboard should be open at http://localhost:3001/dashboard"
echo ""
echo "Starting agent with live streaming..."
echo ""

# Start agent with live streaming enabled
ENABLE_LIVE_STREAM=true HEADLESS=true npm run agent

