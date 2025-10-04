#!/usr/bin/env node

/**
 * Run Custom AI Agent Test
 * Quick script to spawn agents with custom prompts and URLs
 */

import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config();

// Parse command line arguments
const args = process.argv.slice(2);
let prompt = '';
let url = '';
let agents = 1;

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function showUsage() {
  console.log('');
  log('🤖 AI Agent Test Runner', 'cyan');
  console.log('======================================');
  console.log('');
  console.log('Usage: node run-custom-test.js [OPTIONS]');
  console.log('');
  console.log('Options:');
  console.log('  -p, --prompt <text>     Test goal/prompt (required)');
  console.log('  -u, --url <url>         Demo URL to test (required)');
  console.log('  -n, --agents <number>   Number of agents to spawn (default: 1)');
  console.log('  -s, --stream            Enable live video streaming');
  console.log('  -h, --help             Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node run-custom-test.js -p "Test the login form" -u "https://example.com" -n 3');
  console.log('  node run-custom-test.js --prompt "Play Wordle" --url "https://www.nytimes.com/games/wordle" --agents 5 --stream');
  console.log('');
}

// Parse arguments
let enableStream = false;

for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '-p':
    case '--prompt':
      prompt = args[++i];
      break;
    case '-u':
    case '--url':
      url = args[++i];
      break;
    case '-n':
    case '--agents':
      agents = parseInt(args[++i]);
      break;
    case '-s':
    case '--stream':
      enableStream = true;
      break;
    case '-h':
    case '--help':
      showUsage();
      process.exit(0);
      break;
    default:
      log(`❌ Unknown option: ${args[i]}`, 'red');
      showUsage();
      process.exit(1);
  }
}

// Validate inputs
if (!prompt) {
  log('❌ Error: Test prompt is required', 'red');
  showUsage();
  process.exit(1);
}

if (!url) {
  log('❌ Error: URL is required', 'red');
  showUsage();
  process.exit(1);
}

if (isNaN(agents) || agents < 1) {
  log('❌ Error: Number of agents must be a positive integer', 'red');
  process.exit(1);
}

// Check for required environment variables
if (!process.env.ANTHROPIC_API_KEY) {
  log('❌ Error: ANTHROPIC_API_KEY is not set', 'red');
  console.log('Please set it in your .env file or export it:');
  console.log('export ANTHROPIC_API_KEY=your_key_here');
  process.exit(1);
}

if (!process.env.SUPABASE_URL || (!process.env.SUPABASE_ANON_KEY && !process.env.SUPABASE_SERVICE_KEY)) {
  log('❌ Error: SUPABASE_URL or SUPABASE_ANON_KEY/SUPABASE_SERVICE_KEY is not set', 'red');
  console.log('Please check your .env file');
  process.exit(1);
}

// Display configuration
console.log('');
log('🤖 AI Agent Test Runner (Autonomous Mode)', 'cyan');
console.log('======================================');
log('  🧠 AI Mode: ENABLED (Claude will control Playwright)', 'yellow');
console.log('======================================');
console.log('');
log('✓ Configuration:', 'green');
log(`  Prompt: ${prompt}`, 'blue');
log(`  URL: ${url}`, 'blue');
log(`  Agents: ${agents}`, 'blue');
log(`  Browser: ${process.env.BROWSER_TYPE || 'chromium'}`, 'blue');
log(`  Headless: ${process.env.HEADLESS || 'false'}`, 'blue');
if (enableStream) {
  log('  Live Stream: enabled 📹', 'yellow');
}
console.log('');

// Create test case in Supabase
async function createTestCase() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
    );

    log('Creating test case...', 'cyan');

    const { data: testCase, error: testError } = await supabase
      .from('test_cases')
      .insert({
        name: prompt,
        description: `AI-powered test: ${prompt}`,
        url: url,
        actions: [
          {
            type: 'ai_autonomous',
            description: prompt
          }
        ],
        status: 'pending',
        metadata: {
          created_by: 'run-custom-test.js',
          agent_count: agents,
          mode: 'ai_autonomous',
          maxSteps: 50
        }
      })
      .select()
      .single();

    if (testError) {
      log(`❌ Failed to create test case: ${testError.message}`, 'red');
      throw testError;
    }

    log(`✅ Test case created: ${testCase.id}`, 'green');
    console.log('');
    
    return testCase.id;
  } catch (error) {
    log(`❌ Error creating test case: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Spawn agents
async function spawnAgents() {
  try {
    // Create test case first
    const testCaseId = await createTestCase();

    // Set environment variables for spawned agents
    // AI_MODE is ALWAYS true for this script - Claude will autonomously control Playwright
    const env = {
      ...process.env,
      AI_MODE: 'true',  // Claude will use vision to analyze screenshots and decide actions
      CONCURRENT_AGENTS: agents.toString(),
      CUSTOM_TEST_ID: testCaseId
    };

    if (enableStream) {
      env.ENABLE_LIVE_STREAM = 'true';
    }

    log(`🚀 Starting ${agents} AI agent(s)...`, 'green');
    console.log('');
    log('🤖 Agents will:', 'cyan');
    log('   1. Take screenshots every few seconds', 'blue');
    log('   2. Send screenshots to Claude for analysis', 'blue');
    log('   3. Receive and execute actions from Claude', 'blue');
    log('   4. Repeat until goal is achieved', 'blue');
    console.log('');
    
    if (enableStream) {
      log('📹 Live stream available at:', 'yellow');
      log('   http://localhost:3001/dashboard/', 'cyan');
      console.log('');
    }

    log('Press Ctrl+C to stop', 'yellow');
    console.log('');

    // Spawn the main process
    // If streaming is enabled, use startWithStream.js which starts both the stream server and agents
    // Otherwise, just start the agents with index.js
    const scriptToRun = enableStream ? 'src/startWithStream.js' : 'src/index.js';
    
    const agentProcess = spawn('node', [scriptToRun], {
      stdio: 'inherit',
      env: env,
      cwd: __dirname
    });

    // Handle graceful shutdown
    function cleanup() {
      log('\n🛑 Stopping agents...', 'yellow');
      agentProcess.kill('SIGTERM');
      setTimeout(() => {
        agentProcess.kill('SIGKILL');
        process.exit(0);
      }, 5000);
    }

    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);

    agentProcess.on('exit', (code, signal) => {
      if (code !== 0) {
        log(`\n⚠️  Agent process exited with code ${code}`, 'yellow');
      }
      process.exit(code || 0);
    });

    agentProcess.on('error', (error) => {
      log(`❌ Failed to start agents: ${error.message}`, 'red');
      process.exit(1);
    });

  } catch (error) {
    log(`❌ Error: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

// Run the script
spawnAgents();
