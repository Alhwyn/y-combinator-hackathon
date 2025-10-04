# Multi-Agent Browser Testing System

An AI-powered QA testing system that runs multiple Playwright browser automation agents in parallel using Supabase for orchestration and real-time monitoring.

## 🌟 Features

- **Parallel Test Execution** - Run multiple browser agents concurrently
- **Real-time Monitoring** - Live updates via Supabase Realtime
- **Smart Test Queue** - Priority-based test distribution
- **Screenshot Capture** - Before/after screenshots for every action
- **Automatic Retries** - Failed tests are automatically retried
- **Health Monitoring** - Agent heartbeat and automatic failover
- **Flexible Actions** - Support for navigate, click, fill, assert, and more

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Supabase Backend                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Postgres │  │ Realtime │  │ Storage  │  │   Auth   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    Orchestration Layer                       │
│  ┌──────────────┐         ┌──────────────┐                 │
│  │   Spawner    │────────▶│   Monitor    │                 │
│  └──────────────┘         └──────────────┘                 │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    Playwright Agents                         │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐         │
│  │Agent1│  │Agent2│  │Agent3│  │Agent4│  │Agent5│         │
│  └──────┘  └──────┘  └──────┘  └──────┘  └──────┘         │
└─────────────────────────────────────────────────────────────┘
```

## 📋 Prerequisites

- Node.js >= 18.0.0
- A Supabase account and project
- Playwright browsers installed

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd yc-supabase
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the root directory:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key

# Agent Configuration
CONCURRENT_AGENTS=5
HEADLESS=true
SCREENSHOT_QUALITY=80

# Browser Configuration
BROWSER_TYPE=chromium
VIEWPORT_WIDTH=1920
VIEWPORT_HEIGHT=1080

# Retry Configuration
MAX_RETRIES=3
RETRY_DELAY_MS=1000

# Health Check
AGENT_HEARTBEAT_INTERVAL_MS=5000
AGENT_TIMEOUT_MS=300000

# Logging
LOG_LEVEL=info
```

### 3. Set Up Database

Run the SQL migrations in your Supabase SQL Editor:

1. Go to your Supabase Dashboard → SQL Editor
2. Execute `supabase/schema.sql`
3. Execute `supabase/storage.sql`

Or use the helper script to verify:

```bash
npm run setup:db
```

### 4. Install Playwright Browsers

```bash
npx playwright install chromium
```

### 5. Load Sample Tests (Optional)

```bash
node examples/loadSampleTests.js
```

### 6. Start the System

#### Option A: Start Everything

```bash
npm start
```

This will:

- Spawn 5 parallel agents (configurable via `.env`)
- Start the monitoring system
- Begin processing tests from the queue

#### Option B: Start Components Separately

```bash
# Terminal 1: Start agent spawner
npm run spawn

# Terminal 2: Start a single agent
npm run agent

# Terminal 3: Monitor
node src/orchestration/monitor.js
```

## 📖 Usage

### Creating Test Cases

You can create test cases programmatically:

```javascript
import { createTestCase } from "./src/utils/testHelpers.js";

await createTestCase({
  name: "Login Flow Test",
  description: "Test user login functionality",
  url: "https://example.com/login",
  actions: [
    {
      type: "navigate",
      target: "https://example.com/login",
    },
    {
      type: "fill",
      selector: "#email",
      value: "test@example.com",
    },
    {
      type: "fill",
      selector: "#password",
      value: "password123",
    },
    {
      type: "click",
      selector: "button[type='submit']",
    },
    {
      type: "wait",
      selector: ".dashboard",
      timeout: 5000,
    },
    {
      type: "assert",
      selector: ".user-name",
      assertType: "text",
      expected: "Test User",
    },
  ],
  priority: 10,
  tags: ["authentication", "smoke"],
});
```

### Supported Actions

| Action       | Description              | Example                                                                       |
| ------------ | ------------------------ | ----------------------------------------------------------------------------- |
| `navigate`   | Navigate to URL          | `{ type: "navigate", target: "https://example.com" }`                         |
| `click`      | Click element            | `{ type: "click", selector: "#button" }`                                      |
| `fill`       | Fill input field         | `{ type: "fill", selector: "#email", value: "test@example.com" }`             |
| `select`     | Select dropdown option   | `{ type: "select", selector: "#dropdown", values: ["option1"] }`              |
| `wait`       | Wait for element/timeout | `{ type: "wait", selector: ".loading", timeout: 5000 }`                       |
| `scroll`     | Scroll to element        | `{ type: "scroll", selector: "#footer" }`                                     |
| `hover`      | Hover over element       | `{ type: "hover", selector: ".menu-item" }`                                   |
| `press`      | Press keyboard key       | `{ type: "press", key: "Enter" }`                                             |
| `assert`     | Verify element/text      | `{ type: "assert", selector: "h1", assertType: "text", expected: "Welcome" }` |
| `screenshot` | Capture screenshot       | `{ type: "screenshot", fullPage: true }`                                      |

### Viewing Results

Query test results via Supabase client:

```javascript
import supabase from "./src/lib/supabase.js";

// Get all test results
const { data: results } = await supabase
  .from("test_results")
  .select(
    `
    *,
    agent:agents(name),
    test_case:test_cases(name)
  `
  )
  .order("created_at", { ascending: false });

// Get test steps for a specific result
const { data: steps } = await supabase
  .from("test_steps")
  .select("*")
  .eq("test_result_id", resultId)
  .order("step_number");
```

## 📊 Database Schema

### Tables

- **`agents`** - Tracks active browser agents and their status
- **`test_cases`** - Stores test scenarios with actions and expected results
- **`test_results`** - Records test execution outcomes
- **`test_steps`** - Detailed step-by-step execution logs

### Key Functions

- **`claim_test(agent_uuid)`** - Atomically assigns a pending test to an agent
- **`release_test(agent_uuid, test_uuid, status)`** - Releases a test and updates agent stats
- **`mark_stale_agents()`** - Marks inactive agents as offline

## 🎨 Frontend Dashboard

The `frontend/` directory is empty and ready for your dashboard implementation.

See [frontend/README.md](frontend/README.md) for setup instructions and suggestions.

### Recommended Features:

- Real-time agent status monitoring
- Test results viewer with screenshots
- Test case management UI
- Analytics and metrics dashboard

## 🛠️ Development

### Project Structure

```
yc-supabase/
├── src/
│   ├── agent/
│   │   ├── worker.js          # Main agent worker
│   │   └── actions.js         # Action handlers
│   ├── orchestration/
│   │   ├── spawner.js         # Agent spawner
│   │   └── monitor.js         # Health monitor
│   ├── utils/
│   │   ├── storage.js         # Screenshot storage
│   │   └── testHelpers.js     # Test management utilities
│   ├── lib/
│   │   ├── supabase.js        # Supabase client
│   │   └── logger.js          # Winston logger
│   ├── config/
│   │   └── index.js           # Configuration
│   └── index.js               # Main entry point
├── supabase/
│   ├── schema.sql             # Database schema
│   └── storage.sql            # Storage policies
├── examples/
│   ├── sampleTests.js         # Sample test cases
│   └── loadSampleTests.js     # Load samples into DB
├── frontend/                  # Empty frontend folder
└── package.json
```

### Running Tests

```bash
npm test
```

### Debugging

Set `LOG_LEVEL=debug` in `.env` for verbose logging.

Run a single agent in non-headless mode:

```bash
HEADLESS=false npm run agent
```

## 🔧 Configuration

All configuration is in `src/config/index.js` and can be overridden via environment variables:

| Variable                      | Default  | Description                            |
| ----------------------------- | -------- | -------------------------------------- |
| `CONCURRENT_AGENTS`           | 5        | Number of parallel agents              |
| `HEADLESS`                    | true     | Run browsers in headless mode          |
| `SCREENSHOT_QUALITY`          | 80       | JPEG quality (1-100)                   |
| `BROWSER_TYPE`                | chromium | Browser type (chromium/firefox/webkit) |
| `MAX_RETRIES`                 | 3        | Max retry attempts for failed tests    |
| `AGENT_HEARTBEAT_INTERVAL_MS` | 5000     | Heartbeat interval                     |
| `AGENT_TIMEOUT_MS`            | 300000   | Agent timeout (5 minutes)              |

## 📝 Logging

Logs are stored in the `logs/` directory:

- `error.log` - Error-level logs only
- `combined.log` - All logs
- Console output with colors and timestamps

## 🐛 Troubleshooting

### Agents Not Starting

1. Check Supabase credentials in `.env`
2. Verify database schema is applied
3. Check logs in `logs/error.log`

### Tests Not Running

1. Ensure test cases exist: `SELECT * FROM test_cases WHERE status='pending'`
2. Check agent status: `SELECT * FROM agents`
3. Verify agents are running: `ps aux | grep node`

### Screenshots Not Uploading

1. Verify storage bucket exists in Supabase
2. Check storage policies are applied
3. Ensure `SUPABASE_SERVICE_KEY` has storage permissions

## 📄 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

**Built with:**

- [Playwright](https://playwright.dev/) - Browser automation
- [Supabase](https://supabase.com/) - Backend and real-time database
- [Winston](https://github.com/winstonjs/winston) - Logging
