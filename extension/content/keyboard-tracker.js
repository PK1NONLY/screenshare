// Keyboard tracking content script for Secure Testing Environment

class KeyboardTracker {
  constructor() {
    this.isActive = false;
    this.config = null;
    this.keystrokes = [];
    this.maxKeystrokes = 10000;
    this.suspiciousPatterns = [];
    this.blockedKeys = new Set();
    
    // Bind event handlers to maintain 'this' context
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    
    this.init();
  }

  async init() {
    try {
      console.log('[STE] Keyboard Tracker initializing...');
      
      if (!window.STELogger) {
        console.log('[STE] Logger not available, Keyboard Tracker will use console');
      } else {
        window.STELogger.info('Keyboard Tracker initialized');
      }
      
      // Get configuration from background
      await this.loadConfiguration();
      
      // Set up message listener
      chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
      
      // Start tracking if active
      if (this.isActive) {
        this.startTracking();
      }
      
      // Make this available globally for debugging
      window.STEKeyboardTracker = this;
      
      console.log('[STE] Keyboard Tracker initialized successfully');
      
    } catch (error) {
      console.error('[STE] Keyboard Tracker initialization failed:', error);
    }
  }

  async loadConfiguration() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'GET_STATUS' });
      this.isActive = response.isActive;
      this.config = response.config;
      
      if (this.config) {
        this.setupBlockedKeys();
      }
    } catch (error) {
      window.STELogger?.error('Failed to load configuration', error);
    }
  }

  handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'START_KEYBOARD_TRACKING':
        this.startTracking();
        sendResponse({ success: true });
        break;
        
      case 'STOP_KEYBOARD_TRACKING':
        this.stopTracking();
        sendResponse({ success: true });
        break;
        
      case 'GET_KEYSTROKES':
        sendResponse({ keystrokes: this.getKeystrokes() });
        break;
        
      case 'CLEAR_KEYSTROKES':
        this.clearKeystrokes();
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ error: 'Unknown action' });
    }
    
    return true;
  }

  setupBlockedKeys() {
    if (!this.config) return;

    // Common blocked key combinations
    this.blockedKeys.clear();
    
    if (this.config.restrictions?.blockDevTools) {
      this.blockedKeys.add('F12');
      this.blockedKeys.add('Ctrl+Shift+I');
      this.blockedKeys.add('Ctrl+Shift+J');
      this.blockedKeys.add('Ctrl+Shift+C');
      this.blockedKeys.add('Ctrl+U');
    }
    
    if (this.config.restrictions?.blockCopyPaste) {
      this.blockedKeys.add('Ctrl+C');
      this.blockedKeys.add('Ctrl+V');
      this.blockedKeys.add('Ctrl+X');
      this.blockedKeys.add('Ctrl+A');
    }
    
    if (this.config.restrictions?.blockNewTabs) {
      this.blockedKeys.add('Ctrl+T');
      this.blockedKeys.add('Ctrl+N');
      this.blockedKeys.add('Ctrl+Shift+T');
      this.blockedKeys.add('Ctrl+Shift+N');
    }
    
    if (this.config.restrictions?.blockAppSwitching) {
      this.blockedKeys.add('Alt+Tab');
      this.blockedKeys.add('Ctrl+Alt+Tab');
      this.blockedKeys.add('Win+Tab');
      this.blockedKeys.add('Cmd+Tab');
    }
    
    if (this.config.restrictions?.blockPrintScreen) {
      this.blockedKeys.add('PrintScreen');
      this.blockedKeys.add('Alt+PrintScreen');
      this.blockedKeys.add('Ctrl+PrintScreen');
    }

    // Additional system shortcuts
    this.blockedKeys.add('Ctrl+Shift+Esc'); // Task Manager
    this.blockedKeys.add('Ctrl+Alt+Del'); // Security screen
    this.blockedKeys.add('Win+L'); // Lock screen
    this.blockedKeys.add('Win+D'); // Show desktop
    this.blockedKeys.add('Win+M'); // Minimize all
    this.blockedKeys.add('Alt+F4'); // Close window
    this.blockedKeys.add('F11'); // Fullscreen toggle
  }

  startTracking() {
    if (this.isActive) return;
    
    this.isActive = true;
    
    // Add event listeners
    document.addEventListener('keydown', this.handleKeyDown, true);
    document.addEventListener('keyup', this.handleKeyUp, true);
    document.addEventListener('keypress', this.handleKeyPress, true);
    
    window.STELogger?.info('Keyboard tracking started');
  }

  stopTracking() {
    if (!this.isActive) return;
    
    this.isActive = false;
    
    // Remove event listeners
    document.removeEventListener('keydown', this.handleKeyDown, true);
    document.removeEventListener('keyup', this.handleKeyUp, true);
    document.removeEventListener('keypress', this.handleKeyPress, true);
    
    window.STELogger?.info('Keyboard tracking stopped');
  }

  handleKeyDown(event) {
    if (!this.isActive) return;

    const keystroke = this.createKeystrokeRecord(event, 'keydown');
    this.recordKeystroke(keystroke);

    // Check if this key combination is blocked
    const keyCombo = this.getKeyCombo(event);
    if (this.isKeyBlocked(keyCombo)) {
      event.preventDefault();
      event.stopPropagation();
      
      this.logBlockedKey(keyCombo, keystroke);
      this.showBlockedKeyNotification(keyCombo);
      
      return false;
    }

    // Check for suspicious patterns
    this.checkSuspiciousPatterns(keystroke);
  }

  handleKeyUp(event) {
    if (!this.isActive) return;

    const keystroke = this.createKeystrokeRecord(event, 'keyup');
    this.recordKeystroke(keystroke);
  }

  handleKeyPress(event) {
    if (!this.isActive) return;

    const keystroke = this.createKeystrokeRecord(event, 'keypress');
    this.recordKeystroke(keystroke);
  }

  createKeystrokeRecord(event, type) {
    return {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      type: type,
      key: event.key,
      code: event.code,
      keyCode: event.keyCode,
      which: event.which,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      metaKey: event.metaKey,
      repeat: event.repeat,
      location: event.location,
      target: {
        tagName: event.target.tagName,
        id: event.target.id,
        className: event.target.className,
        type: event.target.type
      },
      url: window.location.href,
      title: document.title
    };
  }

  recordKeystroke(keystroke) {
    this.keystrokes.push(keystroke);
    
    // Keep only the most recent keystrokes
    if (this.keystrokes.length > this.maxKeystrokes) {
      this.keystrokes = this.keystrokes.slice(-this.maxKeystrokes);
    }
    
    // Send keystroke to background script for logging
    chrome.runtime.sendMessage({
      action: 'LOG_KEYSTROKE',
      keystroke: keystroke.key
    }).catch(error => {
      window.STELogger?.error('Failed to log keystroke', error);
    });
    
    // Send to demo page if it's the current page
    if (window.location.href.includes('/demo/index.html')) {
      window.postMessage({
        type: 'STE_KEYSTROKE',
        keystroke: keystroke.key,
        timestamp: keystroke.timestamp
      }, '*');
    }
    
    // Send to background script periodically
    if (this.keystrokes.length % 50 === 0) {
      this.sendKeystrokesToBackground();
    }
  }

  getKeyCombo(event) {
    const parts = [];
    
    if (event.ctrlKey) parts.push('Ctrl');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    if (event.metaKey) parts.push(navigator.platform.includes('Mac') ? 'Cmd' : 'Win');
    
    // Handle special keys
    let key = event.key;
    if (key === ' ') key = 'Space';
    if (key === 'Control') key = 'Ctrl';
    if (key === 'Meta') key = navigator.platform.includes('Mac') ? 'Cmd' : 'Win';
    
    parts.push(key);
    
    return parts.join('+');
  }

  isKeyBlocked(keyCombo) {
    return this.blockedKeys.has(keyCombo);
  }

  checkSuspiciousPatterns(keystroke) {
    // Check for rapid key sequences (possible automation)
    const recentKeys = this.keystrokes.slice(-10);
    const rapidSequence = recentKeys.filter(k => 
      Date.now() - k.timestamp < 100 && k.type === 'keydown'
    );
    
    if (rapidSequence.length > 5) {
      this.logSuspiciousPattern('RAPID_KEY_SEQUENCE', {
        sequence: rapidSequence,
        rate: rapidSequence.length / 0.1 // keys per second
      });
    }
    
    // Check for repeated identical keystrokes
    const lastFiveKeys = this.keystrokes.slice(-5);
    if (lastFiveKeys.length === 5 && 
        lastFiveKeys.every(k => k.key === keystroke.key && k.type === 'keydown')) {
      this.logSuspiciousPattern('REPEATED_KEY_PATTERN', {
        key: keystroke.key,
        count: 5
      });
    }
    
    // Check for unusual key combinations
    if (keystroke.altKey && keystroke.ctrlKey && keystroke.shiftKey) {
      this.logSuspiciousPattern('UNUSUAL_KEY_COMBINATION', {
        combo: this.getKeyCombo({ 
          altKey: true, 
          ctrlKey: true, 
          shiftKey: true, 
          key: keystroke.key 
        })
      });
    }
    
    // Check for function key usage
    if (keystroke.key.startsWith('F') && /^F\d+$/.test(keystroke.key)) {
      this.logSuspiciousPattern('FUNCTION_KEY_USAGE', {
        key: keystroke.key
      });
    }
  }

  async logBlockedKey(keyCombo, keystroke) {
    window.STELogger?.warn(`Blocked key combination: ${keyCombo}`, keystroke);
    
    try {
      await chrome.runtime.sendMessage({
        action: 'LOG_UNAUTHORIZED_ACTION',
        type: 'BLOCKED_KEY_COMBINATION',
        data: {
          keyCombo: keyCombo,
          keystroke: keystroke,
          url: window.location.href,
          timestamp: Date.now()
        }
      });
    } catch (error) {
      window.STELogger?.error('Failed to log blocked key', error);
    }
  }

  async logSuspiciousPattern(type, data) {
    const pattern = {
      id: Date.now() + Math.random(),
      type: type,
      data: data,
      timestamp: Date.now(),
      url: window.location.href
    };
    
    this.suspiciousPatterns.push(pattern);
    
    window.STELogger?.warn(`Suspicious pattern detected: ${type}`, data);
    
    try {
      await chrome.runtime.sendMessage({
        action: 'LOG_UNAUTHORIZED_ACTION',
        type: 'SUSPICIOUS_KEYBOARD_PATTERN',
        data: pattern
      });
    } catch (error) {
      window.STELogger?.error('Failed to log suspicious pattern', error);
    }
  }

  showBlockedKeyNotification(keyCombo) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'ste-key-notification';
    const content = document.createElement('div');
    content.className = 'ste-key-notification-content';
    
    const title = document.createElement('strong');
    title.textContent = 'Key Combination Blocked';
    
    const message = document.createElement('p');
    message.textContent = `${keyCombo} is not allowed during the test.`;
    
    content.appendChild(title);
    content.appendChild(message);
    notification.appendChild(content);

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .ste-key-notification {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(244, 67, 54, 0.95);
        color: white;
        padding: 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        z-index: 10001;
        font-family: Arial, sans-serif;
        font-size: 16px;
        text-align: center;
        min-width: 300px;
      }
      .ste-key-notification-content strong {
        display: block;
        margin-bottom: 10px;
        font-size: 18px;
      }
      .ste-key-notification-content p {
        margin: 0;
        opacity: 0.9;
      }
    `;
    
    if (!document.querySelector('#ste-key-notification-styles')) {
      style.id = 'ste-key-notification-styles';
      document.head.appendChild(style);
    }

    document.body.appendChild(notification);

    // Auto-remove after 2 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 2000);
  }

  async sendKeystrokesToBackground() {
    if (this.keystrokes.length === 0) return;
    
    try {
      await chrome.runtime.sendMessage({
        action: 'STORE_KEYSTROKES',
        keystrokes: this.keystrokes.slice() // Send copy
      });
    } catch (error) {
      window.STELogger?.error('Failed to send keystrokes to background', error);
    }
  }

  getKeystrokes() {
    return [...this.keystrokes];
  }

  clearKeystrokes() {
    this.keystrokes = [];
    this.suspiciousPatterns = [];
  }

  getStatistics() {
    const now = Date.now();
    const last5Minutes = this.keystrokes.filter(k => now - k.timestamp < 5 * 60 * 1000);
    const last1Minute = this.keystrokes.filter(k => now - k.timestamp < 60 * 1000);
    
    return {
      totalKeystrokes: this.keystrokes.length,
      keystrokesLast5Min: last5Minutes.length,
      keystrokesLast1Min: last1Minute.length,
      averageKeysPerMinute: last5Minutes.length / 5,
      suspiciousPatterns: this.suspiciousPatterns.length,
      mostUsedKeys: this.getMostUsedKeys(),
      keyboardActivity: this.getKeyboardActivity()
    };
  }

  getMostUsedKeys() {
    const keyCount = {};
    
    this.keystrokes.forEach(k => {
      if (k.type === 'keydown') {
        keyCount[k.key] = (keyCount[k.key] || 0) + 1;
      }
    });
    
    return Object.entries(keyCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([key, count]) => ({ key, count }));
  }

  getKeyboardActivity() {
    const now = Date.now();
    const intervals = [];
    
    // Create 1-minute intervals for the last hour
    for (let i = 0; i < 60; i++) {
      const start = now - (i + 1) * 60 * 1000;
      const end = now - i * 60 * 1000;
      const count = this.keystrokes.filter(k => 
        k.timestamp >= start && k.timestamp < end && k.type === 'keydown'
      ).length;
      
      intervals.unshift({
        start: new Date(start).toISOString(),
        end: new Date(end).toISOString(),
        keystrokes: count
      });
    }
    
    return intervals;
  }
}

// Initialize keyboard tracker
const keyboardTracker = new KeyboardTracker();

// Export for external access
window.STEKeyboardTracker = keyboardTracker;