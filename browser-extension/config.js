/**
 * Browser Extension Configuration
 * 
 * Update these values after deploying to Railway
 */

export const config = {
  // Default backend server URL
  // LOCAL: http://localhost:3001
  // RAILWAY: https://your-app-name.railway.app
  defaultServerUrl: 'http://localhost:3001',
  
  // You can also set different URLs per environment
  development: {
    serverUrl: 'http://localhost:3001',
  },
  
  production: {
    // Update this after deploying to Railway
    serverUrl: 'https://your-app-name.railway.app',
  },
  
  // Auto-detect environment (checks if on railway domain)
  getServerUrl() {
    // Check if we have a saved URL
    chrome.storage.local.get(['serverUrl'], (result) => {
      if (result.serverUrl) {
        return result.serverUrl;
      }
    });
    
    // Otherwise use default
    return this.defaultServerUrl;
  },
};

export default config;

