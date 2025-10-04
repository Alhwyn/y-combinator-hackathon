// Content script for AI QA Agent
// Injected into all pages to help with element interaction

console.log('🤖 AI QA Agent content script loaded');

// Helper function to highlight elements when clicked by the agent
function highlightElement(element) {
  const originalBorder = element.style.border;
  element.style.border = '3px solid #667eea';
  element.style.transition = 'border 0.3s';
  
  setTimeout(() => {
    element.style.border = originalBorder;
  }, 1000);
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'HIGHLIGHT_ELEMENT') {
    const element = document.querySelector(message.selector);
    if (element) {
      highlightElement(element);
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: 'Element not found' });
    }
  }
  return true;
});

