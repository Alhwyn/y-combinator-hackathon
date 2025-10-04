// Popup script for AI QA Agent extension

let isRunning = false;

document.addEventListener('DOMContentLoaded', async () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const setupForm = document.getElementById('setupForm');
  const runningControls = document.getElementById('runningControls');
  const logContainer = document.getElementById('log');
  const stepCountEl = document.getElementById('stepCount');
  
  // Load saved settings
  const settings = await chrome.storage.local.get(['apiKey', 'serverUrl', 'testGoal', 'interval']);
  if (settings.apiKey) document.getElementById('apiKey').value = settings.apiKey;
  
  // Default server URL - CHANGE THIS to match your backend!
  if (settings.serverUrl) {
    document.getElementById('serverUrl').value = settings.serverUrl;
  } else {
    // ⚠️ UPDATE THIS URL to match your backend deployment ⚠️
    // Local: http://localhost:3001
    // Railway: https://your-app.up.railway.app
    document.getElementById('serverUrl').value = 'http://localhost:3001';
  }
  
  if (settings.testGoal) document.getElementById('testGoal').value = settings.testGoal;
  if (settings.interval) document.getElementById('interval').value = settings.interval;
  
  // Check if agent is already running
  const status = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
  if (status?.isRunning) {
    showRunning();
  }
  
  // Listen for log updates
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'LOG') {
      addLog(message.message, message.logType);
    } else if (message.type === 'STEP_UPDATE') {
      stepCountEl.textContent = message.stepCount;
    } else if (message.type === 'STOPPED') {
      showSetup();
    }
  });
  
  startBtn.addEventListener('click', async () => {
    const apiKey = document.getElementById('apiKey').value.trim();
    const serverUrl = document.getElementById('serverUrl').value.trim();
    const testGoal = document.getElementById('testGoal').value.trim();
    const interval = parseInt(document.getElementById('interval').value);
    
    if (!apiKey) {
      addLog('Please enter API key', 'error');
      return;
    }
    
    if (!serverUrl) {
      addLog('Please enter server URL', 'error');
      return;
    }
    
    if (!testGoal) {
      addLog('Please enter test goal', 'error');
      return;
    }
    
    // Save settings
    await chrome.storage.local.set({ apiKey, serverUrl, testGoal, interval });
    
    // Start agent
    chrome.runtime.sendMessage({
      type: 'START_AGENT',
      apiKey,
      serverUrl,
      testGoal,
      interval
    });
    
    showRunning();
    addLog('🚀 Agent started', 'success');
  });
  
  stopBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'STOP_AGENT' });
    showSetup();
    addLog('🛑 Agent stopped', 'info');
  });
  
  function showRunning() {
    setupForm.classList.add('hidden');
    runningControls.classList.remove('hidden');
    isRunning = true;
  }
  
  function showSetup() {
    setupForm.classList.remove('hidden');
    runningControls.classList.add('hidden');
    isRunning = false;
  }
  
  function addLog(message, type = 'info') {
    const entry = document.createElement('div');
    entry.className = `log-entry log-${type}`;
    entry.textContent = `${new Date().toLocaleTimeString()}: ${message}`;
    logContainer.insertBefore(entry, logContainer.firstChild);
    
    // Keep only last 20 logs
    while (logContainer.children.length > 20) {
      logContainer.removeChild(logContainer.lastChild);
    }
  }
});

