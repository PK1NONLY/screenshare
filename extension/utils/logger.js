// Logging utility for Secure Testing Environment

class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000;
    this.logLevel = 'INFO'; // DEBUG, INFO, WARN, ERROR
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.logs.push(logEntry);

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output
    const consoleMethod = level.toLowerCase();
    if (console[consoleMethod]) {
      console[consoleMethod](`[STE] ${message}`, data || '');
    }

    // Send to background script
    this.sendToBackground(logEntry);
  }

  debug(message, data) {
    if (this.shouldLog('DEBUG')) {
      this.log('DEBUG', message, data);
    }
  }

  info(message, data) {
    if (this.shouldLog('INFO')) {
      this.log('INFO', message, data);
    }
  }

  warn(message, data) {
    if (this.shouldLog('WARN')) {
      this.log('WARN', message, data);
    }
  }

  error(message, data) {
    if (this.shouldLog('ERROR')) {
      this.log('ERROR', message, data);
    }
  }

  shouldLog(level) {
    const levels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  sendToBackground(logEntry) {
    try {
      chrome.runtime.sendMessage({
        action: 'LOG_ENTRY',
        logEntry: logEntry
      }).catch(() => {
        // Ignore errors if background script is not available
      });
    } catch (error) {
      // Ignore errors
    }
  }

  getLogs() {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  setLogLevel(level) {
    this.logLevel = level;
  }
}

// Create global logger instance
window.STELogger = new Logger();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Logger;
}