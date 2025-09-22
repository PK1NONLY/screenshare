// Configuration management for Secure Testing Environment

class ConfigManager {
  constructor() {
    this.config = null;
    this.defaultConfig = this.getDefaultConfig();
    this.configUpdateListeners = [];
  }

  getDefaultConfig() {
    return {
      // Basic settings
      extensionId: chrome.runtime.id,
      version: chrome.runtime.getManifest().version,
      
      // URL restrictions
      allowedUrls: [
        'chrome://newtab/',
        'chrome://extensions/',
        'about:blank'
      ],
      
      // Extension whitelist
      allowedExtensions: [],
      
      // Security restrictions
      restrictions: {
        blockCopyPaste: true,
        blockNewTabs: true,
        blockScreenshots: true,
        blockMinimize: true,
        blockAppSwitching: true,
        blockMultipleMonitors: true,
        blockScreenSharing: true,
        blockBluetoothDevices: true,
        blockDevTools: true,
        blockPrintScreen: true,
        blockRightClick: true,
        blockTextSelection: true,
        blockDragDrop: true
      },
      
      // Monitoring settings
      monitoring: {
        trackKeystrokes: true,
        trackMouseMovements: false,
        trackSystemUsage: true,
        trackRunningApps: true,
        trackNetworkActivity: true,
        batteryThreshold: 50,
        cpuThreshold: 80,
        memoryThreshold: 90,
        monitoringInterval: 5000 // 5 seconds
      },
      
      // Backend integration
      backend: {
        apiUrl: '',
        apiKey: '',
        syncInterval: 30000, // 30 seconds
        enableRealTimeSync: false,
        retryAttempts: 3,
        timeout: 10000 // 10 seconds
      },
      
      // Notification settings
      notifications: {
        showWarnings: true,
        showBlocked: true,
        showSystemAlerts: true,
        soundEnabled: false
      },
      
      // Test session settings
      session: {
        sessionId: null,
        candidateId: null,
        examId: null,
        startTime: null,
        duration: null,
        autoSubmit: false
      },
      
      // Advanced security
      advanced: {
        enableVirtualMachine: false,
        blockVirtualKeyboard: true,
        blockScreenReader: false,
        enableBiometricVerification: false,
        requireCameraAccess: false,
        enableProctoring: false
      }
    };
  }

  async loadConfig() {
    try {
      const result = await chrome.storage.local.get(['config']);
      
      if (result.config) {
        this.config = this.mergeConfigs(this.defaultConfig, result.config);
      } else {
        this.config = { ...this.defaultConfig };
        await this.saveConfig();
      }
      
      return this.config;
    } catch (error) {
      console.error('Failed to load configuration:', error);
      this.config = { ...this.defaultConfig };
      return this.config;
    }
  }

  async saveConfig() {
    try {
      await chrome.storage.local.set({ config: this.config });
      this.notifyConfigUpdate();
      return true;
    } catch (error) {
      console.error('Failed to save configuration:', error);
      return false;
    }
  }

  async updateConfig(updates) {
    if (!this.config) {
      await this.loadConfig();
    }
    
    this.config = this.mergeConfigs(this.config, updates);
    return await this.saveConfig();
  }

  async resetConfig() {
    this.config = { ...this.defaultConfig };
    return await this.saveConfig();
  }

  mergeConfigs(base, updates) {
    const merged = { ...base };
    
    for (const key in updates) {
      if (updates.hasOwnProperty(key)) {
        if (typeof updates[key] === 'object' && updates[key] !== null && !Array.isArray(updates[key])) {
          merged[key] = this.mergeConfigs(merged[key] || {}, updates[key]);
        } else {
          merged[key] = updates[key];
        }
      }
    }
    
    return merged;
  }

  getConfig() {
    return this.config ? { ...this.config } : null;
  }

  getConfigValue(path) {
    if (!this.config) return null;
    
    const keys = path.split('.');
    let value = this.config;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return null;
      }
    }
    
    return value;
  }

  async setConfigValue(path, value) {
    if (!this.config) {
      await this.loadConfig();
    }
    
    const keys = path.split('.');
    let current = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
    return await this.saveConfig();
  }

  async syncWithBackend() {
    const backendConfig = this.getConfigValue('backend');
    
    if (!backendConfig.apiUrl || !backendConfig.apiKey) {
      console.log('Backend not configured, skipping sync');
      return false;
    }
    
    try {
      // Fetch configuration from backend
      const response = await fetch(`${backendConfig.apiUrl}/config`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${backendConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: backendConfig.timeout
      });
      
      if (response.ok) {
        const serverConfig = await response.json();
        await this.updateConfig(serverConfig);
        console.log('Configuration synced with backend');
        return true;
      } else {
        console.error('Failed to sync with backend:', response.status);
        return false;
      }
    } catch (error) {
      console.error('Backend sync error:', error);
      return false;
    }
  }

  async sendConfigToBackend() {
    const backendConfig = this.getConfigValue('backend');
    
    if (!backendConfig.apiUrl || !backendConfig.apiKey) {
      return false;
    }
    
    try {
      const response = await fetch(`${backendConfig.apiUrl}/config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${backendConfig.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.config),
        timeout: backendConfig.timeout
      });
      
      return response.ok;
    } catch (error) {
      console.error('Failed to send config to backend:', error);
      return false;
    }
  }

  validateConfig(config) {
    const errors = [];
    
    // Validate URLs
    if (config.allowedUrls && Array.isArray(config.allowedUrls)) {
      config.allowedUrls.forEach((url, index) => {
        try {
          new URL(url);
        } catch (e) {
          if (!url.includes('*') && !url.startsWith('chrome://') && !url.startsWith('about:')) {
            errors.push(`Invalid URL at index ${index}: ${url}`);
          }
        }
      });
    }
    
    // Validate thresholds
    if (config.monitoring) {
      if (config.monitoring.batteryThreshold < 0 || config.monitoring.batteryThreshold > 100) {
        errors.push('Battery threshold must be between 0 and 100');
      }
      
      if (config.monitoring.cpuThreshold < 0 || config.monitoring.cpuThreshold > 100) {
        errors.push('CPU threshold must be between 0 and 100');
      }
      
      if (config.monitoring.memoryThreshold < 0 || config.monitoring.memoryThreshold > 100) {
        errors.push('Memory threshold must be between 0 and 100');
      }
    }
    
    // Validate backend settings
    if (config.backend && config.backend.apiUrl) {
      try {
        new URL(config.backend.apiUrl);
      } catch (e) {
        errors.push('Invalid backend API URL');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  addConfigUpdateListener(listener) {
    this.configUpdateListeners.push(listener);
  }

  removeConfigUpdateListener(listener) {
    const index = this.configUpdateListeners.indexOf(listener);
    if (index > -1) {
      this.configUpdateListeners.splice(index, 1);
    }
  }

  notifyConfigUpdate() {
    this.configUpdateListeners.forEach(listener => {
      try {
        listener(this.config);
      } catch (error) {
        console.error('Config update listener error:', error);
      }
    });
  }

  async exportConfig() {
    const config = this.getConfig();
    
    // Remove sensitive information
    const exportConfig = { ...config };
    if (exportConfig.backend) {
      delete exportConfig.backend.apiKey;
    }
    
    return JSON.stringify(exportConfig, null, 2);
  }

  async importConfig(configJson) {
    try {
      const importedConfig = JSON.parse(configJson);
      const validation = this.validateConfig(importedConfig);
      
      if (!validation.isValid) {
        throw new Error(`Invalid configuration: ${validation.errors.join(', ')}`);
      }
      
      await this.updateConfig(importedConfig);
      return true;
    } catch (error) {
      console.error('Failed to import configuration:', error);
      throw error;
    }
  }

  async startAutoSync() {
    const backendConfig = this.getConfigValue('backend');
    
    if (backendConfig.enableRealTimeSync && backendConfig.syncInterval > 0) {
      setInterval(async () => {
        await this.syncWithBackend();
      }, backendConfig.syncInterval);
      
      console.log(`Auto-sync started with interval: ${backendConfig.syncInterval}ms`);
    }
  }

  async createSessionConfig(sessionData) {
    const sessionConfig = {
      session: {
        sessionId: sessionData.sessionId,
        candidateId: sessionData.candidateId,
        examId: sessionData.examId,
        startTime: Date.now(),
        duration: sessionData.duration,
        autoSubmit: sessionData.autoSubmit || false
      }
    };
    
    await this.updateConfig(sessionConfig);
    return sessionConfig;
  }

  async endSession() {
    const sessionConfig = {
      session: {
        sessionId: null,
        candidateId: null,
        examId: null,
        startTime: null,
        duration: null,
        autoSubmit: false
      }
    };
    
    await this.updateConfig(sessionConfig);
  }

  isSessionActive() {
    const session = this.getConfigValue('session');
    return session && session.sessionId && session.startTime;
  }

  getSessionTimeRemaining() {
    const session = this.getConfigValue('session');
    
    if (!session || !session.startTime || !session.duration) {
      return null;
    }
    
    const elapsed = Date.now() - session.startTime;
    const remaining = session.duration - elapsed;
    
    return Math.max(0, remaining);
  }
}

// Create global instance
const configManager = new ConfigManager();

// Initialize configuration
configManager.loadConfig().then(() => {
  configManager.startAutoSync();
});

// Export for use in service worker
self.configManager = configManager;