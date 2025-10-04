/**
 * Frontend Configuration
 * 
 * This file automatically detects if you're running locally or on Railway
 */

const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';

// Determine backend URL
const API_BASE_URL = isLocalhost 
  ? 'http://localhost:3001'  // Local development
  : window.location.origin;   // Railway deployment (uses same domain)

// WebSocket URL (wss:// for HTTPS, ws:// for HTTP)
const WS_PROTOCOL = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const WS_BASE_URL = isLocalhost
  ? 'ws://localhost:3001'
  : `${WS_PROTOCOL}//${window.location.host}`;

export const config = {
  // API endpoints
  api: {
    baseUrl: API_BASE_URL,
    agents: `${API_BASE_URL}/api/agents`,
    tests: `${API_BASE_URL}/api/tests`,
    aiAgent: {
      start: `${API_BASE_URL}/api/ai-agent/start`,
      stop: `${API_BASE_URL}/api/ai-agent/stop`,
      status: `${API_BASE_URL}/api/ai-agent/status`,
      nextAction: `${API_BASE_URL}/api/ai-agent/next-action`,
    },
    health: `${API_BASE_URL}/health`,
  },
  
  // WebSocket endpoints
  ws: {
    baseUrl: WS_BASE_URL,
    viewer: `${WS_BASE_URL}/viewer`,
  },
  
  // Environment
  isProduction: !isLocalhost,
  isLocalhost: isLocalhost,
  
  // Logging
  debug: isLocalhost,
};

// Log configuration on load
if (config.debug) {
  console.log('🔧 Frontend Config:', config);
}

export default config;

