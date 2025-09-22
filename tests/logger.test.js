// Unit tests for Logger class

const Logger = require('../extension/utils/logger.js');

describe('Logger', () => {
  let logger;

  beforeEach(() => {
    logger = new Logger();
    jest.clearAllMocks();
    // Reset console mocks
    console.log.mockClear();
    console.debug.mockClear();
    console.info.mockClear();
    console.warn.mockClear();
    console.error.mockClear();
  });

  describe('constructor', () => {
    test('should initialize with default values', () => {
      expect(logger.logs).toEqual([]);
      expect(logger.maxLogs).toBe(1000);
      expect(logger.logLevel).toBe('INFO');
    });
  });

  describe('log method', () => {
    test('should create log entry with correct structure', () => {
      const testMessage = 'Test message';
      const testData = { key: 'value' };
      
      logger.log('INFO', testMessage, testData);
      
      expect(logger.logs).toHaveLength(1);
      const logEntry = logger.logs[0];
      
      expect(logEntry).toHaveProperty('timestamp');
      expect(logEntry.level).toBe('INFO');
      expect(logEntry.message).toBe(testMessage);
      expect(logEntry.data).toEqual(testData);
      expect(logEntry.url).toBe('https://example.com');
      expect(logEntry.userAgent).toBe('Mozilla/5.0 (Test Browser) Chrome/91.0.4472.124 Safari/537.36');
    });

    test('should handle null data parameter', () => {
      logger.log('INFO', 'Test message');
      
      expect(logger.logs[0].data).toBeNull();
    });

    test('should call appropriate console method', () => {
      logger.log('INFO', 'Test message');
      expect(console.info).toHaveBeenCalledWith('[STE] Test message', '');
      
      logger.log('ERROR', 'Error message', { error: true });
      expect(console.error).toHaveBeenCalledWith('[STE] Error message', { error: true });
    });

    test('should send message to background script', () => {
      logger.log('INFO', 'Test message');
      
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({
        action: 'LOG_ENTRY',
        logEntry: expect.objectContaining({
          level: 'INFO',
          message: 'Test message'
        })
      });
    });

    test('should handle chrome.runtime.sendMessage errors gracefully', () => {
      chrome.runtime.sendMessage.mockRejectedValue(new Error('Background script not available'));
      
      expect(() => {
        logger.log('INFO', 'Test message');
      }).not.toThrow();
    });

    test('should limit logs to maxLogs', () => {
      logger.maxLogs = 3;
      
      logger.log('INFO', 'Message 1');
      logger.log('INFO', 'Message 2');
      logger.log('INFO', 'Message 3');
      logger.log('INFO', 'Message 4');
      
      expect(logger.logs).toHaveLength(3);
      expect(logger.logs[0].message).toBe('Message 2');
      expect(logger.logs[1].message).toBe('Message 3');
      expect(logger.logs[2].message).toBe('Message 4');
    });
  });

  describe('debug method', () => {
    test('should log debug message when log level allows', () => {
      logger.setLogLevel('DEBUG');
      logger.debug('Debug message', { debug: true });
      
      expect(logger.logs).toHaveLength(1);
      expect(logger.logs[0].level).toBe('DEBUG');
      expect(logger.logs[0].message).toBe('Debug message');
    });

    test('should not log debug message when log level is higher', () => {
      logger.setLogLevel('INFO');
      logger.debug('Debug message');
      
      expect(logger.logs).toHaveLength(0);
    });
  });

  describe('info method', () => {
    test('should log info message when log level allows', () => {
      logger.setLogLevel('INFO');
      logger.info('Info message', { info: true });
      
      expect(logger.logs).toHaveLength(1);
      expect(logger.logs[0].level).toBe('INFO');
      expect(logger.logs[0].message).toBe('Info message');
    });

    test('should not log info message when log level is higher', () => {
      logger.setLogLevel('WARN');
      logger.info('Info message');
      
      expect(logger.logs).toHaveLength(0);
    });
  });

  describe('warn method', () => {
    test('should log warn message when log level allows', () => {
      logger.setLogLevel('WARN');
      logger.warn('Warning message', { warn: true });
      
      expect(logger.logs).toHaveLength(1);
      expect(logger.logs[0].level).toBe('WARN');
      expect(logger.logs[0].message).toBe('Warning message');
    });

    test('should not log warn message when log level is higher', () => {
      logger.setLogLevel('ERROR');
      logger.warn('Warning message');
      
      expect(logger.logs).toHaveLength(0);
    });
  });

  describe('error method', () => {
    test('should always log error message', () => {
      logger.setLogLevel('ERROR');
      logger.error('Error message', { error: true });
      
      expect(logger.logs).toHaveLength(1);
      expect(logger.logs[0].level).toBe('ERROR');
      expect(logger.logs[0].message).toBe('Error message');
    });
  });

  describe('shouldLog method', () => {
    test('should return true for levels at or above current log level', () => {
      logger.setLogLevel('INFO');
      
      expect(logger.shouldLog('DEBUG')).toBe(false);
      expect(logger.shouldLog('INFO')).toBe(true);
      expect(logger.shouldLog('WARN')).toBe(true);
      expect(logger.shouldLog('ERROR')).toBe(true);
    });

    test('should handle invalid log levels', () => {
      logger.setLogLevel('INFO');
      
      expect(logger.shouldLog('INVALID')).toBe(false);
    });
  });

  describe('getLogs method', () => {
    test('should return copy of logs array', () => {
      logger.log('INFO', 'Test message');
      const logs = logger.getLogs();
      
      expect(logs).toHaveLength(1);
      expect(logs).not.toBe(logger.logs); // Should be a copy
      expect(logs[0]).toEqual(logger.logs[0]);
    });
  });

  describe('clearLogs method', () => {
    test('should clear all logs', () => {
      logger.log('INFO', 'Test message 1');
      logger.log('INFO', 'Test message 2');
      
      expect(logger.logs).toHaveLength(2);
      
      logger.clearLogs();
      
      expect(logger.logs).toHaveLength(0);
    });
  });

  describe('setLogLevel method', () => {
    test('should update log level', () => {
      expect(logger.logLevel).toBe('INFO');
      
      logger.setLogLevel('DEBUG');
      
      expect(logger.logLevel).toBe('DEBUG');
    });
  });

  describe('sendToBackground method', () => {
    test('should handle chrome runtime not available', () => {
      // Temporarily remove chrome.runtime
      const originalChrome = global.chrome;
      global.chrome = undefined;
      
      expect(() => {
        logger.sendToBackground({ test: 'entry' });
      }).not.toThrow();
      
      // Restore chrome
      global.chrome = originalChrome;
    });

    test('should handle sendMessage throwing error', () => {
      chrome.runtime.sendMessage.mockImplementation(() => {
        throw new Error('Runtime error');
      });
      
      expect(() => {
        logger.sendToBackground({ test: 'entry' });
      }).not.toThrow();
    });
  });

  describe('integration tests', () => {
    test('should handle multiple log levels in sequence', () => {
      logger.setLogLevel('DEBUG');
      
      logger.debug('Debug message');
      logger.info('Info message');
      logger.warn('Warning message');
      logger.error('Error message');
      
      expect(logger.logs).toHaveLength(4);
      expect(logger.logs[0].level).toBe('DEBUG');
      expect(logger.logs[1].level).toBe('INFO');
      expect(logger.logs[2].level).toBe('WARN');
      expect(logger.logs[3].level).toBe('ERROR');
    });

    test('should maintain log order with different levels', () => {
      logger.setLogLevel('INFO');
      
      logger.info('First message');
      logger.debug('Should not appear');
      logger.warn('Second message');
      logger.error('Third message');
      
      expect(logger.logs).toHaveLength(3);
      expect(logger.logs[0].message).toBe('First message');
      expect(logger.logs[1].message).toBe('Second message');
      expect(logger.logs[2].message).toBe('Third message');
    });
  });
});