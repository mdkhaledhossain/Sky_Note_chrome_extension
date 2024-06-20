function capturePageInfo() {
    return {
      url: window.location.href,
      title: document.title
      
    };
  }
  
  // Listen for messages from popup script requesting captured information
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.action === 'getCapturedPageInfo') {
      // Capture page information and send it back to popup script
      sendResponse(capturePageInfo());
    }
  });
  