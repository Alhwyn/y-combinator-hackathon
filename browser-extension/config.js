/**
 * Browser Extension Configuration
 * 
 * IMPORTANT: Update the defaultServerUrl below to match your backend URL
 * 
 * Common configurations:
 * - Local development: http://localhost:3001
 * - Railway: https://your-app-name.up.railway.app
 * - Custom deployment: https://your-domain.com
 */

export const config = {
  // ⚠️ CHANGE THIS TO YOUR BACKEND URL ⚠️
  // The browser extension will use this URL if no custom URL is saved
  defaultServerUrl: 'http://localhost:3001',  // Default to local for safety
  
  // You can also set different URLs per environment
  development: {
    serverUrl: 'http://localhost:3001',
  },
  
  production: {
    // Set this to your production backend URL
    // Example: https://your-app.up.railway.app
    serverUrl: 'http://localhost:3001',  // Update this!
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

