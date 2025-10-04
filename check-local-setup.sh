#!/bin/bash

echo "🔍 Checking Local Setup..."
echo ""

# Check if stream server is running
echo "1️⃣ Stream Server:"
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo "   ✅ Running on http://localhost:3001"
    curl -s http://localhost:3001/health | jq .
else
    echo "   ❌ NOT running"
    echo "   Run: node src/server/videoStream.js"
fi

echo ""

# Check if agents are running
echo "2️⃣ Agents Running:"
AGENT_COUNT=$(ps aux | grep -E "node.*worker.js" | grep -v grep | wc -l | xargs)
if [ "$AGENT_COUNT" -gt 0 ]; then
    echo "   ✅ $AGENT_COUNT agent(s) running"
else
    echo "   ❌ No agents running"
    echo "   Run: ENABLE_LIVE_STREAM=true HEADLESS=false node src/agent/worker.js"
fi

echo ""

# Check Supabase connection
echo "3️⃣ Supabase Connection:"
if [ -z "$SUPABASE_URL" ]; then
    echo "   ⚠️  SUPABASE_URL not set (checking .env)"
else
    echo "   ✅ SUPABASE_URL: ${SUPABASE_URL}"
fi

echo ""
echo "📊 Dashboard: http://localhost:3001/dashboard"
echo "🏥 Health: http://localhost:3001/health"
echo ""

