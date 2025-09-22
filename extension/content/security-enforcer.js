// Security enforcement content script for Secure Testing Environment

class SecurityEnforcer {
  constructor() {
    this.isActive = false;
    this.config = null;
    this.blockedEvents = new Set();
    this.originalFunctions = new Map();
    this.eventListeners = new Map();
    this.init();
  }

  async init() {
    window.STELogger?.info('Security Enforcer initialized');
    
    // Get configuration from background
    await this.loadConfiguration();
    
    // Set up message listener
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    
    // Start enforcement if active
    if (this.isActive) {
      this.startEnforcement();
    }
  }

  async loadConfiguration() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'GET_STATUS' });
      this.isActive = response.isActive;
      this.config = response.config;
    } catch (error) {
      window.STELogger?.error('Failed to load configuration', error);
    }
  }

  handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'ACTIVATE_SECURITY':
        this.activate(request.config);
        sendResponse({ success: true });
        break;
        
      case 'DEACTIVATE_SECURITY':
        this.deactivate();
        sendResponse({ success: true });
        break;
        
      case 'UPDATE_CONFIG':
        this.updateConfig(request.config);
        sendResponse({ success: true });
        break;
        
      case 'BATTERY_WARNING':
        this.showBatteryWarning(request.level, request.charging);
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ error: 'Unknown action' });
    }
    
    return true;
  }

  activate(config) {
    this.isActive = true;
    this.config = config;
    this.startEnforcement();
    window.STELogger?.info('Security enforcement activated');
  }

  deactivate() {
    this.isActive = false;
    this.stopEnforcement();
    window.STELogger?.info('Security enforcement deactivated');
  }

  updateConfig(config) {
    this.config = { ...this.config, ...config };
    
    if (this.isActive) {
      this.stopEnforcement();
      this.startEnforcement();
    }
  }

  startEnforcement() {
    if (!this.config) return;

    // Block copy/paste operations
    if (this.config.restrictions?.blockCopyPaste) {
      this.blockCopyPaste();
    }

    // Block right-click context menu
    if (this.config.restrictions?.blockRightClick) {
      this.blockRightClick();
    }

    // Block text selection
    if (this.config.restrictions?.blockTextSelection) {
      this.blockTextSelection();
    }

    // Block drag and drop
    if (this.config.restrictions?.blockDragDrop) {
      this.blockDragDrop();
    }

    // Block developer tools
    if (this.config.restrictions?.blockDevTools) {
      this.blockDevTools();
    }

    // Block print screen
    if (this.config.restrictions?.blockPrintScreen) {
      this.blockPrintScreen();
    }

    // Block screenshots
    if (this.config.restrictions?.blockScreenshots) {
      this.blockScreenshots();
    }

    // Override window functions
    this.overrideWindowFunctions();

    // Monitor page visibility
    this.monitorPageVisibility();

    // Block navigation
    this.blockUnauthorizedNavigation();

    window.STELogger?.info('Security enforcement started');
  }

  stopEnforcement() {
    // Remove all event listeners
    this.eventListeners.forEach((listener, event) => {
      document.removeEventListener(event, listener, true);
    });
    this.eventListeners.clear();

    // Restore original functions
    this.originalFunctions.forEach((original, functionName) => {
      try {
        const parts = functionName.split('.');
        let obj = window;
        for (let i = 0; i < parts.length - 1; i++) {
          obj = obj[parts[i]];
        }
        obj[parts[parts.length - 1]] = original;
      } catch (error) {
        window.STELogger?.error('Failed to restore function', { functionName, error });
      }
    });
    this.originalFunctions.clear();

    window.STELogger?.info('Security enforcement stopped');
  }

  blockCopyPaste() {
    const events = ['copy', 'cut', 'paste'];
    
    events.forEach(event => {
      const listener = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.logBlockedAction('COPY_PASTE_BLOCKED', { event: event });
        this.showBlockedNotification(`${event.toUpperCase()} operation is not allowed during the test.`);
        return false;
      };
      
      document.addEventListener(event, listener, true);
      this.eventListeners.set(event, listener);
    });

    // Block clipboard API
    if (navigator.clipboard) {
      const originalRead = navigator.clipboard.read;
      const originalReadText = navigator.clipboard.readText;
      const originalWrite = navigator.clipboard.write;
      const originalWriteText = navigator.clipboard.writeText;

      navigator.clipboard.read = () => {
        this.logBlockedAction('CLIPBOARD_READ_BLOCKED');
        return Promise.reject(new Error('Clipboard access blocked'));
      };

      navigator.clipboard.readText = () => {
        this.logBlockedAction('CLIPBOARD_READ_TEXT_BLOCKED');
        return Promise.reject(new Error('Clipboard access blocked'));
      };

      navigator.clipboard.write = () => {
        this.logBlockedAction('CLIPBOARD_WRITE_BLOCKED');
        return Promise.reject(new Error('Clipboard access blocked'));
      };

      navigator.clipboard.writeText = () => {
        this.logBlockedAction('CLIPBOARD_WRITE_TEXT_BLOCKED');
        return Promise.reject(new Error('Clipboard access blocked'));
      };

      this.originalFunctions.set('navigator.clipboard.read', originalRead);
      this.originalFunctions.set('navigator.clipboard.readText', originalReadText);
      this.originalFunctions.set('navigator.clipboard.write', originalWrite);
      this.originalFunctions.set('navigator.clipboard.writeText', originalWriteText);
    }
  }

  blockRightClick() {
    const listener = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.logBlockedAction('RIGHT_CLICK_BLOCKED');
      this.showBlockedNotification('Right-click is not allowed during the test.');
      return false;
    };
    
    document.addEventListener('contextmenu', listener, true);
    this.eventListeners.set('contextmenu', listener);
  }

  blockTextSelection() {
    const listener = (e) => {
      e.preventDefault();
      e.stopPropagation();
      return false;
    };
    
    document.addEventListener('selectstart', listener, true);
    this.eventListeners.set('selectstart', listener);

    // Add CSS to prevent text selection
    const style = document.createElement('style');
    style.textContent = `
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      input, textarea {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
    `;
    document.head.appendChild(style);
  }

  blockDragDrop() {
    const events = ['drag', 'dragstart', 'dragend', 'dragover', 'dragenter', 'dragleave', 'drop'];
    
    events.forEach(event => {
      const listener = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.logBlockedAction('DRAG_DROP_BLOCKED', { event });
        return false;
      };
      
      document.addEventListener(event, listener, true);
      this.eventListeners.set(event, listener);
    });
  }

  blockDevTools() {
    // Block F12 and other dev tools shortcuts
    const listener = (e) => {
      // F12
      if (e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        this.logBlockedAction('DEV_TOOLS_BLOCKED', { key: 'F12' });
        this.showBlockedNotification('Developer tools are not allowed during the test.');
        return false;
      }
      
      // Ctrl+Shift+I
      if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
        e.preventDefault();
        e.stopPropagation();
        this.logBlockedAction('DEV_TOOLS_BLOCKED', { key: 'Ctrl+Shift+I' });
        this.showBlockedNotification('Developer tools are not allowed during the test.');
        return false;
      }
      
      // Ctrl+Shift+J
      if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
        e.preventDefault();
        e.stopPropagation();
        this.logBlockedAction('DEV_TOOLS_BLOCKED', { key: 'Ctrl+Shift+J' });
        this.showBlockedNotification('Developer tools are not allowed during the test.');
        return false;
      }
      
      // Ctrl+U
      if (e.ctrlKey && e.keyCode === 85) {
        e.preventDefault();
        e.stopPropagation();
        this.logBlockedAction('VIEW_SOURCE_BLOCKED', { key: 'Ctrl+U' });
        this.showBlockedNotification('View source is not allowed during the test.');
        return false;
      }
    };
    
    document.addEventListener('keydown', listener, true);
    this.eventListeners.set('keydown-devtools', listener);
  }

  blockPrintScreen() {
    const listener = (e) => {
      // Print Screen key
      if (e.keyCode === 44) {
        e.preventDefault();
        e.stopPropagation();
        this.logBlockedAction('PRINT_SCREEN_BLOCKED');
        this.showBlockedNotification('Screenshots are not allowed during the test.');
        return false;
      }
    };
    
    document.addEventListener('keydown', listener, true);
    this.eventListeners.set('keydown-printscreen', listener);
  }

  blockScreenshots() {
    // Override getDisplayMedia
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      const original = navigator.mediaDevices.getDisplayMedia;
      
      navigator.mediaDevices.getDisplayMedia = () => {
        this.logBlockedAction('SCREEN_CAPTURE_BLOCKED');
        this.showBlockedNotification('Screen capture is not allowed during the test.');
        return Promise.reject(new Error('Screen capture blocked'));
      };
      
      this.originalFunctions.set('navigator.mediaDevices.getDisplayMedia', original);
    }

    // Override getUserMedia for screen capture
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      const original = navigator.mediaDevices.getUserMedia;
      
      navigator.mediaDevices.getUserMedia = (constraints) => {
        if (constraints && constraints.video && constraints.video.mediaSource === 'screen') {
          this.logBlockedAction('SCREEN_CAPTURE_BLOCKED');
          this.showBlockedNotification('Screen capture is not allowed during the test.');
          return Promise.reject(new Error('Screen capture blocked'));
        }
        return original.call(navigator.mediaDevices, constraints);
      };
      
      this.originalFunctions.set('navigator.mediaDevices.getUserMedia', original);
    }
  }

  overrideWindowFunctions() {
    // Block window.open
    const originalOpen = window.open;
    window.open = (...args) => {
      this.logBlockedAction('WINDOW_OPEN_BLOCKED', { args });
      this.showBlockedNotification('Opening new windows is not allowed during the test.');
      return null;
    };
    this.originalFunctions.set('window.open', originalOpen);

    // Block window.print
    const originalPrint = window.print;
    window.print = () => {
      this.logBlockedAction('PRINT_BLOCKED');
      this.showBlockedNotification('Printing is not allowed during the test.');
    };
    this.originalFunctions.set('window.print', originalPrint);

    // Monitor window blur (app switching)
    const blurListener = () => {
      this.logBlockedAction('WINDOW_BLUR_DETECTED');
    };
    window.addEventListener('blur', blurListener);
    this.eventListeners.set('blur', blurListener);

    // Monitor window focus
    const focusListener = () => {
      this.logBlockedAction('WINDOW_FOCUS_DETECTED');
    };
    window.addEventListener('focus', focusListener);
    this.eventListeners.set('focus', focusListener);
  }

  monitorPageVisibility() {
    const visibilityListener = () => {
      if (document.hidden) {
        this.logBlockedAction('PAGE_HIDDEN');
        this.showBlockedNotification('Please keep the test page visible.');
      } else {
        this.logBlockedAction('PAGE_VISIBLE');
      }
    };
    
    document.addEventListener('visibilitychange', visibilityListener);
    this.eventListeners.set('visibilitychange', visibilityListener);
  }

  blockUnauthorizedNavigation() {
    const beforeUnloadListener = (e) => {
      this.logBlockedAction('NAVIGATION_ATTEMPT');
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave the test? Your progress may be lost.';
      return e.returnValue;
    };
    
    window.addEventListener('beforeunload', beforeUnloadListener);
    this.eventListeners.set('beforeunload', beforeUnloadListener);
  }

  showBatteryWarning(level, charging) {
    if (level < 50 && !charging) {
      this.showNotification('Low Battery Warning', 
        `Battery level is ${level}%. Please connect charger to continue the test.`,
        'warning');
    }
  }

  showBlockedNotification(message) {
    this.showNotification('Action Blocked', message, 'error');
  }

  showNotification(title, message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `ste-notification ste-notification-${type}`;
    notification.innerHTML = `
      <div class="ste-notification-content">
        <strong>${title}</strong>
        <p>${message}</p>
      </div>
      <button class="ste-notification-close">&times;</button>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .ste-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 15px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 10000;
        max-width: 300px;
        font-family: Arial, sans-serif;
        font-size: 14px;
      }
      .ste-notification-error {
        border-left: 4px solid #f44336;
      }
      .ste-notification-warning {
        border-left: 4px solid #ff9800;
      }
      .ste-notification-info {
        border-left: 4px solid #2196f3;
      }
      .ste-notification-content strong {
        display: block;
        margin-bottom: 5px;
        color: #333;
      }
      .ste-notification-content p {
        margin: 0;
        color: #666;
      }
      .ste-notification-close {
        position: absolute;
        top: 5px;
        right: 10px;
        background: none;
        border: none;
        font-size: 18px;
        cursor: pointer;
        color: #999;
      }
      .ste-notification-close:hover {
        color: #333;
      }
    `;
    
    if (!document.querySelector('#ste-notification-styles')) {
      style.id = 'ste-notification-styles';
      document.head.appendChild(style);
    }

    // Add close functionality
    notification.querySelector('.ste-notification-close').addEventListener('click', () => {
      notification.remove();
    });

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);

    document.body.appendChild(notification);
  }

  async logBlockedAction(type, data = {}) {
    window.STELogger?.warn(`Blocked action: ${type}`, data);
    
    try {
      await chrome.runtime.sendMessage({
        action: 'LOG_UNAUTHORIZED_ACTION',
        type: type,
        data: {
          ...data,
          url: window.location.href,
          timestamp: Date.now(),
          userAgent: navigator.userAgent
        }
      });
    } catch (error) {
      window.STELogger?.error('Failed to log blocked action', error);
    }
  }
}

// Initialize security enforcer
const securityEnforcer = new SecurityEnforcer();

// Export for external access
window.STESecurityEnforcer = securityEnforcer;