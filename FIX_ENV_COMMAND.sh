#!/bin/bash

# One-line command to fix .env file
# Copy and paste this into your terminal:

sed -i '' 's|LIVE_STREAM_WS_URL="wss://multi-agent-testing-production.up.railway.app/agent"|LIVE_STREAM_WS_URL="ws://localhost:3001/agent"|g' .env

echo "✅ .env file updated!"
echo "Now restart backend: pkill -f startWithStream && node src/startWithStream.js"

