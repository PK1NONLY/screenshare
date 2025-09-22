// Integration API for Secure Testing Environment
// This file provides a JavaScript API for third-party applications to integrate with the extension

(function() {
  'use strict';

  // Check if API is already loaded
  if (window.SecureTestingEnvironment) {
    console.warn('Secure Testing Environment API already loaded');
    return;
  }

  class SecureTestingEnvironmentAPI {
    constructor() {
      this.extensionId = null;
      this.isConnected = false;
      this.eventListeners = new Map();
      this.messageQueue = [];
      this.init();
    }

    async init() {
      try {
        // Try to connect to the extension
        await this.connectToExtension();
        console.log('Secure Testing Environment API initialized');
      } catch (error) {
        console.error('Failed to initialize STE API:', error);
      }
    }

    async connectToExtension() {
      // Try to find the extension
      const response = await this.sendMessage({ action: 'PING' });
      
      if (response && response.success) {
        this.isConnected = true;
        this.extensionId = response.extensionId;
        
        // Process queued messages
        this.processMessageQueue();
        
        // Set up message listener for extension events
        this.setupMessageListener();
        
        return true;
      } else {
        throw new Error('Extension not found or not responding');
      }
    }

    setupMessageListener() {
      // Listen for messages from the extension
      window.addEventListener('message', (event) => {
        if (event.source !== window) return;
        
        if (event.data && event.data.source === 'secure-testing-environment') {
          this.handleExtensionMessage(event.data);
        }
      });
    }

    handleExtensionMessage(message) {
      const { type, data } = message;
      
      // Emit event to registered listeners
      if (this.eventListeners.has(type)) {
        const listeners = this.eventListeners.get(type);
        listeners.forEach(listener => {
          try {
            listener(data);
          } catch (error) {
            console.error('Error in event listener:', error);
          }
        });
      }
    }

    async sendMessage(message) {
      if (!this.isConnected) {
        // Queue message for later
        this.messageQueue.push(message);
        return null;
      }

      try {
        // Send message to extension content script
        return new Promise((resolve, reject) => {
          const messageId = Date.now() + Math.random();
          const messageWithId = { ...message, messageId };
          
          const timeout = setTimeout(() => {
            reject(new Error('Message timeout'));
          }, 10000);
          
          const responseHandler = (event) => {
            if (event.data && 
                event.data.source === 'secure-testing-environment-response' && 
                event.data.messageId === messageId) {
              clearTimeout(timeout);
              window.removeEventListener('message', responseHandler);
              resolve(event.data.response);
            }
          };
          
          window.addEventListener('message', responseHandler);
          
          // Send message
          window.postMessage({
            source: 'secure-testing-environment-api',
            message: messageWithId
          }, '*');
        });
      } catch (error) {
        console.error('Failed to send message:', error);
        return null;
      }
    }

    processMessageQueue() {
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();
        this.sendMessage(message);
      }
    }

    // Public API Methods

    /**
     * Check if the extension is available and connected
     * @returns {boolean} Connection status
     */
    isAvailable() {
      return this.isConnected;
    }

    /**
     * Get extension information
     * @returns {Promise<Object>} Extension info
     */
    async getExtensionInfo() {
      const response = await this.sendMessage({ action: 'GET_EXTENSION_INFO' });
      return response || null;
    }

    /**
     * Activate monitoring with configuration
     * @param {Object} config - Configuration object
     * @returns {Promise<boolean>} Success status
     */
    async activateMonitoring(config = {}) {
      const response = await this.sendMessage({
        action: 'ACTIVATE_MONITORING',
        config: config
      });
      return response && response.success;
    }

    /**
     * Deactivate monitoring
     * @returns {Promise<boolean>} Success status
     */
    async deactivateMonitoring() {
      const response = await this.sendMessage({
        action: 'DEACTIVATE_MONITORING'
      });
      return response && response.success;
    }

    /**
     * Get current monitoring status
     * @returns {Promise<Object>} Status object
     */
    async getStatus() {
      const response = await this.sendMessage({ action: 'GET_STATUS' });
      return response || null;
    }

    /**
     * Update configuration
     * @param {Object} config - Configuration updates
     * @returns {Promise<boolean>} Success status
     */
    async updateConfiguration(config) {
      const response = await this.sendMessage({
        action: 'UPDATE_CONFIG',
        config: config
      });
      return response && response.success;
    }

    /**
     * Start a new test session
     * @param {Object} sessionData - Session configuration
     * @returns {Promise<boolean>} Success status
     */
    async startSession(sessionData) {
      const response = await this.sendMessage({
        action: 'START_SESSION',
        sessionData: sessionData
      });
      return response && response.success;
    }

    /**
     * End the current test session
     * @returns {Promise<boolean>} Success status
     */
    async endSession() {
      const response = await this.sendMessage({
        action: 'END_SESSION'
      });
      return response && response.success;
    }

    /**
     * Get system information
     * @returns {Promise<Object>} System data
     */
    async getSystemInfo() {
      const response = await this.sendMessage({ action: 'GET_SYSTEM_INFO' });
      return response && response.systemInfo || null;
    }

    /**
     * Get security status
     * @returns {Promise<Object>} Security status
     */
    async getSecurityStatus() {
      const response = await this.sendMessage({ action: 'GET_SECURITY_STATUS' });
      return response && response.securityStatus || null;
    }

    /**
     * Get recent unauthorized actions
     * @param {number} limit - Number of actions to retrieve
     * @returns {Promise<Array>} Array of unauthorized actions
     */
    async getUnauthorizedActions(limit = 10) {
      const response = await this.sendMessage({
        action: 'GET_UNAUTHORIZED_ACTIONS',
        limit: limit
      });
      return response && response.actions || [];
    }

    /**
     * Get keystroke statistics
     * @returns {Promise<Object>} Keystroke statistics
     */
    async getKeystrokeStats() {
      const response = await this.sendMessage({ action: 'GET_KEYSTROKE_STATS' });
      return response && response.stats || null;
    }

    /**
     * Get page interaction statistics
     * @returns {Promise<Object>} Page interaction statistics
     */
    async getPageStats() {
      const response = await this.sendMessage({ action: 'GET_PAGE_STATS' });
      return response && response.stats || null;
    }

    /**
     * Generate a comprehensive report
     * @returns {Promise<Object>} Report data
     */
    async generateReport() {
      const response = await this.sendMessage({ action: 'GENERATE_REPORT' });
      return response && response.report || null;
    }

    /**
     * Set allowed URLs for the test
     * @param {Array<string>} urls - Array of allowed URLs
     * @returns {Promise<boolean>} Success status
     */
    async setAllowedUrls(urls) {
      const response = await this.sendMessage({
        action: 'SET_ALLOWED_URLS',
        urls: urls
      });
      return response && response.success;
    }

    /**
     * Set allowed extensions for the test
     * @param {Array<string>} extensionIds - Array of allowed extension IDs
     * @returns {Promise<boolean>} Success status
     */
    async setAllowedExtensions(extensionIds) {
      const response = await this.sendMessage({
        action: 'SET_ALLOWED_EXTENSIONS',
        extensionIds: extensionIds
      });
      return response && response.success;
    }

    /**
     * Configure security restrictions
     * @param {Object} restrictions - Restriction settings
     * @returns {Promise<boolean>} Success status
     */
    async setSecurityRestrictions(restrictions) {
      const response = await this.sendMessage({
        action: 'SET_SECURITY_RESTRICTIONS',
        restrictions: restrictions
      });
      return response && response.success;
    }

    /**
     * Configure monitoring settings
     * @param {Object} monitoring - Monitoring settings
     * @returns {Promise<boolean>} Success status
     */
    async setMonitoringSettings(monitoring) {
      const response = await this.sendMessage({
        action: 'SET_MONITORING_SETTINGS',
        monitoring: monitoring
      });
      return response && response.success;
    }

    /**
     * Configure backend integration
     * @param {Object} backend - Backend settings
     * @returns {Promise<boolean>} Success status
     */
    async setBackendConfig(backend) {
      const response = await this.sendMessage({
        action: 'SET_BACKEND_CONFIG',
        backend: backend
      });
      return response && response.success;
    }

    /**
     * Test backend connection
     * @returns {Promise<Object>} Connection test result
     */
    async testBackendConnection() {
      const response = await this.sendMessage({ action: 'TEST_BACKEND_CONNECTION' });
      return response || null;
    }

    /**
     * Show a notification to the user
     * @param {string} title - Notification title
     * @param {string} message - Notification message
     * @param {string} type - Notification type (info, warning, error, success)
     * @returns {Promise<boolean>} Success status
     */
    async showNotification(title, message, type = 'info') {
      const response = await this.sendMessage({
        action: 'SHOW_NOTIFICATION',
        title: title,
        message: message,
        type: type
      });
      return response && response.success;
    }

    /**
     * Check if multiple displays are detected
     * @returns {Promise<boolean>} True if multiple displays detected
     */
    async hasMultipleDisplays() {
      const systemInfo = await this.getSystemInfo();
      return systemInfo && systemInfo.displays && systemInfo.displays.length > 1;
    }

    /**
     * Check if screen sharing is active
     * @returns {Promise<boolean>} True if screen sharing detected
     */
    async isScreenSharingActive() {
      const response = await this.sendMessage({ action: 'CHECK_SCREEN_SHARING' });
      return response && response.isActive || false;
    }

    /**
     * Get battery information
     * @returns {Promise<Object>} Battery information
     */
    async getBatteryInfo() {
      const systemInfo = await this.getSystemInfo();
      return systemInfo && systemInfo.battery || null;
    }

    /**
     * Force end session (emergency stop)
     * @returns {Promise<boolean>} Success status
     */
    async emergencyStop() {
      const response = await this.sendMessage({ action: 'EMERGENCY_STOP' });
      return response && response.success;
    }

    /**
     * Uninstall the extension (for candidates after test completion)
     * @returns {Promise<boolean>} Success status
     */
    async uninstallExtension() {
      const response = await this.sendMessage({ action: 'UNINSTALL_EXTENSION' });
      return response && response.success;
    }

    // Event Management

    /**
     * Add event listener for extension events
     * @param {string} eventType - Event type to listen for
     * @param {Function} listener - Event listener function
     */
    addEventListener(eventType, listener) {
      if (!this.eventListeners.has(eventType)) {
        this.eventListeners.set(eventType, []);
      }
      this.eventListeners.get(eventType).push(listener);
    }

    /**
     * Remove event listener
     * @param {string} eventType - Event type
     * @param {Function} listener - Event listener function to remove
     */
    removeEventListener(eventType, listener) {
      if (this.eventListeners.has(eventType)) {
        const listeners = this.eventListeners.get(eventType);
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    }

    /**
     * Remove all event listeners for a specific event type
     * @param {string} eventType - Event type
     */
    removeAllEventListeners(eventType) {
      if (this.eventListeners.has(eventType)) {
        this.eventListeners.set(eventType, []);
      }
    }

    // Utility Methods

    /**
     * Create a pre-configured test session
     * @param {Object} options - Session options
     * @returns {Promise<Object>} Session configuration
     */
    async createTestSession(options = {}) {
      const defaultConfig = {
        allowedUrls: options.allowedUrls || [],
        restrictions: {
          blockCopyPaste: options.blockCopyPaste !== false,
          blockNewTabs: options.blockNewTabs !== false,
          blockScreenshots: options.blockScreenshots !== false,
          blockMultipleMonitors: options.blockMultipleMonitors !== false,
          blockScreenSharing: options.blockScreenSharing !== false,
          ...options.restrictions
        },
        monitoring: {
          trackKeystrokes: options.trackKeystrokes !== false,
          trackSystemUsage: options.trackSystemUsage !== false,
          batteryThreshold: options.batteryThreshold || 50,
          ...options.monitoring
        },
        session: {
          sessionId: options.sessionId || `session_${Date.now()}`,
          candidateId: options.candidateId,
          examId: options.examId,
          duration: options.duration || 7200000, // 2 hours default
          autoSubmit: options.autoSubmit || false
        }
      };

      // Apply configuration
      await this.updateConfiguration(defaultConfig);
      
      // Start session
      const sessionStarted = await this.startSession(defaultConfig.session);
      
      if (sessionStarted) {
        // Activate monitoring
        await this.activateMonitoring(defaultConfig);
        return defaultConfig;
      } else {
        throw new Error('Failed to start test session');
      }
    }

    /**
     * Get a summary of current test status
     * @returns {Promise<Object>} Test status summary
     */
    async getTestSummary() {
      const [status, systemInfo, securityStatus, unauthorizedActions] = await Promise.all([
        this.getStatus(),
        this.getSystemInfo(),
        this.getSecurityStatus(),
        this.getUnauthorizedActions(5)
      ]);

      return {
        isActive: status && status.isActive,
        session: status && status.session,
        system: {
          cpu: systemInfo && systemInfo.cpu,
          memory: systemInfo && systemInfo.memory,
          battery: systemInfo && systemInfo.battery,
          displays: systemInfo && systemInfo.displays
        },
        security: securityStatus,
        recentViolations: unauthorizedActions,
        timestamp: Date.now()
      };
    }
  }

  // Create and expose the API
  const api = new SecureTestingEnvironmentAPI();
  
  // Make API available globally
  window.SecureTestingEnvironment = api;
  
  // Also make it available as STE for shorter access
  window.STE = api;

  // Dispatch ready event
  window.dispatchEvent(new CustomEvent('STEReady', {
    detail: { api: api }
  }));

  console.log('Secure Testing Environment API loaded');

})();