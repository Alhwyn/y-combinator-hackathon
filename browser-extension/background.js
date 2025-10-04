// Background service worker for AI QA Agent

let agentState = {
  isRunning: false,
  sessionId: null,
  stepCount: 0,
  intervalId: null,
  config: {}
};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'START_AGENT') {
    startAgent(message);
    sendResponse({ success: true });
  } else if (message.type === 'STOP_AGENT') {
    stopAgent();
    sendResponse({ success: true });
  } else if (message.type === 'GET_STATUS') {
    sendResponse(agentState);
  }
  return true;
});

async function startAgent(config) {
  if (agentState.isRunning) {
    log('Agent already running', 'info');
    return;
  }
  
  agentState.isRunning = true;
  agentState.config = config;
  agentState.stepCount = 0;
  
  log('🤖 Initializing AI agent...', 'info');
  
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab) {
      log('No active tab found', 'error');
      stopAgent();
      return;
    }
    
    // Initialize session with backend
    const response = await fetch(`${config.serverUrl}/api/ai-agent/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: config.apiKey,
        testGoal: config.testGoal,
        testUrl: tab.url
      })
    });
    
    const result = await response.json();
    
    if (!result.success) {
      log(`Failed to start session: ${result.error}`, 'error');
      stopAgent();
      return;
    }
    
    agentState.sessionId = result.sessionId;
    log(`✅ Session started: ${result.sessionId}`, 'success');
    
    // Start capture loop
    const intervalMs = config.interval * 1000;
    agentState.intervalId = setInterval(() => {
      captureAndDecide(tab.id);
    }, intervalMs);
    
    // Run first iteration immediately
    setTimeout(() => captureAndDecide(tab.id), 1000);
    
  } catch (error) {
    log(`Error starting agent: ${error.message}`, 'error');
    stopAgent();
  }
}

async function stopAgent() {
  if (!agentState.isRunning) return;
  
  if (agentState.intervalId) {
    clearInterval(agentState.intervalId);
    agentState.intervalId = null;
  }
  
  // Notify backend
  if (agentState.sessionId) {
    try {
      await fetch(`${agentState.config.serverUrl}/api/ai-agent/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: agentState.sessionId })
      });
    } catch (error) {
      console.error('Error stopping session:', error);
    }
  }
  
  agentState.isRunning = false;
  agentState.sessionId = null;
  agentState.stepCount = 0;
  
  // Notify popup
  chrome.runtime.sendMessage({ type: 'STOPPED' });
  
  log('🛑 Agent stopped', 'info');
}

async function captureAndDecide(tabId) {
  if (!agentState.isRunning) return;
  
  agentState.stepCount++;
  updateStep(agentState.stepCount);
  
  log(`📸 Step ${agentState.stepCount}: Capturing...`, 'info');
  
  try {
    // Capture screenshot
    const dataUrl = await chrome.tabs.captureVisibleTab(null, {
      format: 'jpeg',
      quality: 80
    });
    
    // Get page info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const pageInfo = {
      url: tab.url,
      title: tab.title
    };
    
    // Get next action from AI
    log('🧠 Asking AI for next action...', 'ai');
    
    const response = await fetch(`${agentState.config.serverUrl}/api/ai-agent/next-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: agentState.sessionId,
        screenshot: dataUrl,
        pageInfo
      })
    });
    
    const action = await response.json();
    
    if (!action || !action.type) {
      log('Invalid action received from AI', 'error');
      return;
    }
    
    log(`✨ AI: ${action.type} - ${action.description || ''}`, 'ai');
    
    // Execute action
    await executeAction(tabId, action);
    
    // Check if complete
    if (action.type === 'complete') {
      log(`${action.success ? '✅' : '❌'} ${action.reason}`, action.success ? 'success' : 'error');
      stopAgent();
    }
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, 'error');
    console.error(error);
  }
}

async function executeAction(tabId, action) {
  try {
    switch (action.type) {
      case 'click':
        await chrome.scripting.executeScript({
          target: { tabId },
          func: (selector) => {
            const element = document.querySelector(selector);
            if (element) {
              element.click();
              return { success: true };
            }
            throw new Error(`Element not found: ${selector}`);
          },
          args: [action.selector]
        });
        log(`👆 Clicked: ${action.selector}`, 'info');
        break;
        
      case 'type':
        await chrome.scripting.executeScript({
          target: { tabId },
          func: (selector, value) => {
            const element = document.querySelector(selector);
            if (element) {
              element.value = value;
              element.dispatchEvent(new Event('input', { bubbles: true }));
              element.dispatchEvent(new Event('change', { bubbles: true }));
              return { success: true };
            }
            throw new Error(`Element not found: ${selector}`);
          },
          args: [action.selector, action.value]
        });
        log(`⌨️ Typed into: ${action.selector}`, 'info');
        break;
        
      case 'keyboard':
        await chrome.scripting.executeScript({
          target: { tabId },
          func: (key) => {
            document.activeElement.dispatchEvent(
              new KeyboardEvent('keydown', { key, bubbles: true })
            );
            document.activeElement.dispatchEvent(
              new KeyboardEvent('keypress', { key, bubbles: true })
            );
            document.activeElement.dispatchEvent(
              new KeyboardEvent('keyup', { key, bubbles: true })
            );
            return { success: true };
          },
          args: [action.key]
        });
        log(`⌨️ Pressed: ${action.key}`, 'info');
        break;
        
      case 'wait':
        await new Promise(resolve => setTimeout(resolve, action.ms));
        log(`⏳ Waited ${action.ms}ms`, 'info');
        break;
        
      case 'scroll':
        await chrome.scripting.executeScript({
          target: { tabId },
          func: (direction) => {
            if (direction === 'down') {
              window.scrollBy(0, window.innerHeight);
            } else {
              window.scrollBy(0, -window.innerHeight);
            }
            return { success: true };
          },
          args: [action.direction]
        });
        log(`📜 Scrolled ${action.direction}`, 'info');
        break;
        
      case 'complete':
        // No action needed, handled in captureAndDecide
        break;
        
      default:
        log(`⚠️ Unknown action type: ${action.type}`, 'error');
    }
  } catch (error) {
    log(`❌ Action failed: ${error.message}`, 'error');
    throw error;
  }
}

function log(message, type = 'info') {
  console.log(`[${type.toUpperCase()}] ${message}`);
  
  // Send to popup if open
  chrome.runtime.sendMessage({
    type: 'LOG',
    message,
    logType: type
  }).catch(() => {
    // Popup might be closed, ignore error
  });
}

function updateStep(count) {
  chrome.runtime.sendMessage({
    type: 'STEP_UPDATE',
    stepCount: count
  }).catch(() => {
    // Popup might be closed, ignore error
  });
}

