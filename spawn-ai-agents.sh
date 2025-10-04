#!/bin/bash

# Spawn AI Agents Script
# This script spawns agents in AI autonomous mode where they use Claude vision
# to analyze screenshots and perform intelligent testing

echo "🤖 Starting AI Agent Spawner"
echo "======================================"
echo ""
echo "This will spawn agents that:"
echo "  ✓ Take screenshots of web pages"
echo "  ✓ Use Claude vision AI to analyze what's on screen"
echo "  ✓ Autonomously decide what actions to take"
echo "  ✓ Run tests in parallel"
echo ""

# Check for required environment variables
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "❌ Error: ANTHROPIC_API_KEY is not set"
    echo "Please set it in your .env file or export it:"
    echo "export ANTHROPIC_API_KEY=your_key_here"
    exit 1
fi

if [ -z "$SUPABASE_URL" ]; then
    echo "❌ Error: SUPABASE_URL is not set"
    echo "Please check your .env file"
    exit 1
fi

# Set default number of agents if not specified
AGENTS="${CONCURRENT_AGENTS:-5}"

echo "Configuration:"
echo "  Agents: $AGENTS"
echo "  Browser: ${BROWSER_TYPE:-chromium}"
echo "  Headless: ${HEADLESS:-false}"
echo ""

# Enable AI mode and spawn agents
export AI_MODE=true
export CONCURRENT_AGENTS=$AGENTS

echo "🚀 Spawning $AGENTS AI agents..."
echo ""

# Start the spawner with monitor
node src/index.js

# The script will keep running until Ctrl+C

