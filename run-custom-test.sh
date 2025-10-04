#!/bin/bash

# Run Custom AI Agent Test
# Quick script to spawn agents with custom prompts and URLs

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "🤖 AI Agent Test Runner"
echo "======================================"
echo ""

# Parse command line arguments
PROMPT=""
URL=""
AGENTS=1

# Show usage
show_usage() {
    echo "Usage: ./run-custom-test.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -p, --prompt <text>     Test goal/prompt (required)"
    echo "  -u, --url <url>         Demo URL to test (required)"
    echo "  -n, --agents <number>   Number of agents to spawn (default: 1)"
    echo "  -h, --help             Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./run-custom-test.sh -p \"Test the login form\" -u \"https://example.com\" -n 3"
    echo "  ./run-custom-test.sh --prompt \"Play Wordle\" --url \"https://www.nytimes.com/games/wordle\" --agents 5"
    echo ""
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -p|--prompt)
            PROMPT="$2"
            shift 2
            ;;
        -u|--url)
            URL="$2"
            shift 2
            ;;
        -n|--agents)
            AGENTS="$2"
            shift 2
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown option: $1${NC}"
            show_usage
            exit 1
            ;;
    esac
done

# Validate inputs
if [ -z "$PROMPT" ]; then
    echo -e "${RED}❌ Error: Test prompt is required${NC}"
    echo ""
    show_usage
    exit 1
fi

if [ -z "$URL" ]; then
    echo -e "${RED}❌ Error: URL is required${NC}"
    echo ""
    show_usage
    exit 1
fi

# Validate number of agents
if ! [[ "$AGENTS" =~ ^[0-9]+$ ]] || [ "$AGENTS" -lt 1 ]; then
    echo -e "${RED}❌ Error: Number of agents must be a positive integer${NC}"
    exit 1
fi

# Check for required environment variables
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo -e "${RED}❌ Error: ANTHROPIC_API_KEY is not set${NC}"
    echo "Please set it in your .env file or export it:"
    echo "export ANTHROPIC_API_KEY=your_key_here"
    exit 1
fi

if [ -z "$SUPABASE_URL" ]; then
    echo -e "${RED}❌ Error: SUPABASE_URL is not set${NC}"
    echo "Please check your .env file"
    exit 1
fi

# Display configuration
echo -e "${GREEN}✓${NC} Configuration:"
echo "  ${BLUE}Prompt:${NC} $PROMPT"
echo "  ${BLUE}URL:${NC} $URL"
echo "  ${BLUE}Agents:${NC} $AGENTS"
echo "  ${BLUE}Browser:${NC} ${BROWSER_TYPE:-chromium}"
echo "  ${BLUE}Headless:${NC} ${HEADLESS:-false}"
echo ""

# Export test configuration
export TEST_PROMPT="$PROMPT"
export TEST_URL="$URL"
export CONCURRENT_AGENTS=$AGENTS
export AI_MODE=true

# Optional: Enable live streaming
if [ "$ENABLE_LIVE_STREAM" = "true" ]; then
    echo -e "${YELLOW}📹 Live streaming enabled${NC}"
    echo ""
fi

echo -e "${GREEN}🚀 Starting $AGENTS AI agent(s)...${NC}"
echo ""

# Create a test using Node.js
node -e "
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function createTest() {
  try {
    // Create test case
    const { data: testCase, error: testError } = await supabase
      .from('test_cases')
      .insert({
        name: process.env.TEST_PROMPT,
        description: 'Created via run-custom-test.sh',
        url: process.env.TEST_URL,
        steps: [
          {
            action: 'navigate',
            url: process.env.TEST_URL
          },
          {
            action: 'ai_analyze',
            prompt: process.env.TEST_PROMPT
          }
        ],
        status: 'active'
      })
      .select()
      .single();

    if (testError) {
      console.error('❌ Failed to create test case:', testError);
      process.exit(1);
    }

    console.log('✅ Test case created:', testCase.id);
    console.log('');
    
    // Store test ID for agents to pick up
    process.env.CUSTOM_TEST_ID = testCase.id;
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

await createTest();
" 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Could not auto-create test case. Agents will pick up pending tests.${NC}"
    echo ""
}

# Start the agents
node src/index.js

# Cleanup on exit
trap 'echo ""; echo "🛑 Stopping agents..."; exit 0' SIGINT SIGTERM

echo ""
echo "Press Ctrl+C to stop"

