import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const config = {
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
  },
  agent: {
    concurrentAgents: parseInt(process.env.CONCURRENT_AGENTS || '5', 10),
    headless: process.env.HEADLESS === 'true',
    screenshotQuality: parseInt(process.env.SCREENSHOT_QUALITY || '80', 10),
    heartbeatInterval: parseInt(process.env.AGENT_HEARTBEAT_INTERVAL_MS || '5000', 10),
    timeout: parseInt(process.env.AGENT_TIMEOUT_MS || '300000', 10),
    testMode: process.env.TEST_MODE === 'true', // Enables test isolation
    testId: process.env.TEST_ID || null, // Unique test run identifier
    aiMode: process.env.AI_MODE !== 'false', // Run agents in AI autonomous mode (defaults to true)
  },
  browser: {
    type: process.env.BROWSER_TYPE || 'chromium',
    viewport: {
      width: parseInt(process.env.VIEWPORT_WIDTH || '1920', 10),
      height: parseInt(process.env.VIEWPORT_HEIGHT || '1080', 10),
    },
    // Allow port offset for parallel browser debugging
    debugPort: process.env.BROWSER_DEBUG_PORT ? parseInt(process.env.BROWSER_DEBUG_PORT, 10) : null,
  },
  retry: {
    maxRetries: parseInt(process.env.MAX_RETRIES || '3', 10),
    delayMs: parseInt(process.env.RETRY_DELAY_MS || '1000', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  paths: {
    screenshots: join(__dirname, '../../screenshots'),
    logs: join(__dirname, '../../logs'),
  },
  video: {
    enabled: process.env.ENABLE_VIDEO_RECORDING === 'true',
    saveOnDisk: process.env.SAVE_VIDEO_ON_DISK === 'true',
    size: {
      width: parseInt(process.env.VIDEO_WIDTH || '1280', 10),
      height: parseInt(process.env.VIDEO_HEIGHT || '720', 10),
    },
  },
  liveStream: {
    enabled: process.env.ENABLE_LIVE_STREAM === 'true',
    fps: parseInt(process.env.LIVE_STREAM_FPS || '2', 10),
    quality: parseInt(process.env.LIVE_STREAM_QUALITY || '60', 10),
    port: parseInt(process.env.LIVE_STREAM_PORT || '3001', 10),
  },
};

export default config;

