#!/bin/bash

# Setup Environment Variables Script
# This helps you create your .env file

echo "🔧 Environment Setup Helper"
echo "======================================"
echo ""

# Check if .env already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
    echo "Backing up existing .env to .env.backup..."
    cp .env .env.backup
fi

echo "Creating .env file..."
echo ""

# Create .env file
cat > .env << 'EOF'
# 🔑 Environment Variables Configuration

# ========================================
# Claude AI API Key (REQUIRED)
# ========================================
# Get your key from: https://console.anthropic.com/
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here

# ========================================
# Supabase Configuration (REQUIRED)
# ========================================
# Local Supabase (run with: supabase start)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# OR use hosted Supabase (uncomment these lines)
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_KEY=your-service-key

# ========================================
# Agent Configuration (Optional)
# ========================================
CONCURRENT_AGENTS=5
HEADLESS=false
SCREENSHOT_QUALITY=80
BROWSER_TYPE=chromium
VIEWPORT_WIDTH=1920
VIEWPORT_HEIGHT=1080

# ========================================
# Live Streaming (Optional)
# ========================================
ENABLE_LIVE_STREAM=true
LIVE_STREAM_FPS=2
LIVE_STREAM_QUALITY=60
LIVE_STREAM_PORT=3001

# ========================================
# AI Mode (Optional)
# ========================================
AI_MODE=true

# ========================================
# Logging (Optional)
# ========================================
LOG_LEVEL=info
EOF

echo "✅ .env file created!"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Edit .env and add your ANTHROPIC_API_KEY"
echo "   Get it from: https://console.anthropic.com/"
echo ""
echo "2. If using local Supabase, run:"
echo "   supabase start"
echo ""
echo "3. If using hosted Supabase, update SUPABASE_URL and keys"
echo ""
echo "4. Test your setup:"
echo "   node test-anthropic-key.js"
echo ""
echo "5. Run the Wordle test:"
echo "   ./test-wordle-2-agents.sh"
echo ""

