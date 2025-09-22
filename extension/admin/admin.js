// Admin panel script for Secure Testing Environment

// Cross-browser API compatibility
const getAPI = () => typeof browser !== 'undefined' ? browser : chrome;

class AdminPanel {
  constructor() {
    this.config = null;
    this.currentTab = 'general';
    this.init();
  }

  async init() {
    console.log('Admin panel initialized');
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Load configuration
    await this.loadConfiguration();
    
    // Update UI
    this.updateUI();
    
    // Set debug info
    this.setDebugInfo();
  }

  setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Header actions
    document.getElementById('saveConfigBtn').addEventListener('click', () => {
      this.saveConfiguration();
    });
    
    document.getElementById('resetConfigBtn').addEventListener('click', () => {
      this.resetConfiguration();
    });

    // General settings
    document.getElementById('addUrlBtn').addEventListener('click', () => {
      this.addUrl();
    });
    
    document.getElementById('addExtensionBtn').addEventListener('click', () => {
      this.addExtension();
    });

    // Backend integration
    document.getElementById('testConnectionBtn').addEventListener('click', () => {
      this.testBackendConnection();
    });

    // Session management
    document.getElementById('startSessionBtn').addEventListener('click', () => {
      this.startSession();
    });
    
    document.getElementById('endSessionBtn').addEventListener('click', () => {
      this.endSession();
    });

    // Advanced features
    document.getElementById('exportConfigBtn').addEventListener('click', () => {
      this.exportConfiguration();
    });
    
    document.getElementById('importConfigBtn').addEventListener('click', () => {
      document.getElementById('importConfigFile').click();
    });
    
    document.getElementById('importConfigFile').addEventListener('change', (e) => {
      this.importConfiguration(e.target.files[0]);
    });

    // Toast close
    document.getElementById('toastClose').addEventListener('click', () => {
      this.hideToast();
    });

    // Form change listeners
    this.setupFormChangeListeners();
  }

  setupFormChangeListeners() {
    // Add change listeners to all form inputs
    const inputs = document.querySelectorAll('input[type="checkbox"], input[type="number"], input[type="text"], input[type="url"], input[type="password"]');
    
    inputs.forEach(input => {
      input.addEventListener('change', () => {
        this.updateConfigFromForm();
      });
    });
  }

  switchTab(tabName) {
    // Update nav tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    this.currentTab = tabName;
  }

  async loadConfiguration() {
    try {
      this.showLoading(true);
      
      const response = await getAPI().runtime.sendMessage({ action: 'GET_CONFIG' });
      
      if (response && response.config) {
        this.config = response.config;
      } else {
        // Load default configuration
        this.config = await this.getDefaultConfig();
      }
      
    } catch (error) {
      console.error('Failed to load configuration:', error);
      this.showToast('Failed to load configuration', 'error');
      this.config = await this.getDefaultConfig();
    } finally {
      this.showLoading(false);
    }
  }

  async getDefaultConfig() {
    // Return default configuration structure
    return {
      allowedUrls: ['chrome://newtab/', 'about:blank'],
      allowedExtensions: [],
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
      monitoring: {
        trackKeystrokes: true,
        trackMouseMovements: false,
        trackSystemUsage: true,
        trackRunningApps: true,
        trackNetworkActivity: true,
        batteryThreshold: 50,
        cpuThreshold: 80,
        memoryThreshold: 90,
        monitoringInterval: 5
      },
      backend: {
        apiUrl: '',
        apiKey: '',
        timeout: 10000,
        retryAttempts: 3,
        enableRealTimeSync: false,
        syncInterval: 30
      },
      notifications: {
        showWarnings: true,
        showBlocked: true,
        soundEnabled: false
      },
      session: {
        sessionId: null,
        candidateId: null,
        examId: null,
        startTime: null,
        duration: null,
        autoSubmit: false
      },
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

  updateUI() {
    if (!this.config) return;

    // Update general settings
    this.updateUrlList();
    this.updateExtensionList();
    
    // Update form fields
    this.updateFormFields();
    
    // Update session info
    this.updateSessionInfo();
  }

  updateFormFields() {
    // General settings
    document.getElementById('showWarnings').checked = this.config.notifications?.showWarnings || false;
    document.getElementById('showBlocked').checked = this.config.notifications?.showBlocked || false;
    document.getElementById('soundEnabled').checked = this.config.notifications?.soundEnabled || false;

    // Security restrictions
    const restrictions = this.config.restrictions || {};
    Object.keys(restrictions).forEach(key => {
      const element = document.getElementById(key);
      if (element) {
        element.checked = restrictions[key] || false;
      }
    });

    // Monitoring settings
    const monitoring = this.config.monitoring || {};
    document.getElementById('trackKeystrokes').checked = monitoring.trackKeystrokes || false;
    document.getElementById('trackMouseMovements').checked = monitoring.trackMouseMovements || false;
    document.getElementById('trackSystemUsage').checked = monitoring.trackSystemUsage || false;
    document.getElementById('trackRunningApps').checked = monitoring.trackRunningApps || false;
    document.getElementById('trackNetworkActivity').checked = monitoring.trackNetworkActivity || false;
    document.getElementById('batteryThreshold').value = monitoring.batteryThreshold || 50;
    document.getElementById('cpuThreshold').value = monitoring.cpuThreshold || 80;
    document.getElementById('memoryThreshold').value = monitoring.memoryThreshold || 90;
    document.getElementById('monitoringInterval').value = monitoring.monitoringInterval || 5;

    // Backend settings
    const backend = this.config.backend || {};
    document.getElementById('apiUrl').value = backend.apiUrl || '';
    document.getElementById('apiKey').value = backend.apiKey || '';
    document.getElementById('apiTimeout').value = backend.timeout || 10000;
    document.getElementById('retryAttempts').value = backend.retryAttempts || 3;
    document.getElementById('enableRealTimeSync').checked = backend.enableRealTimeSync || false;
    document.getElementById('syncInterval').value = backend.syncInterval || 30;

    // Advanced settings
    const advanced = this.config.advanced || {};
    Object.keys(advanced).forEach(key => {
      const element = document.getElementById(key);
      if (element) {
        element.checked = advanced[key] || false;
      }
    });
  }

  updateUrlList() {
    const urlList = document.getElementById('urlList');
    urlList.innerHTML = '';

    if (this.config.allowedUrls && this.config.allowedUrls.length > 0) {
      this.config.allowedUrls.forEach((url, index) => {
        const item = document.createElement('div');
        item.className = 'url-item';
        item.innerHTML = `
          <span class="url-text">${url}</span>
          <button class="remove-btn" onclick="adminPanel.removeUrl(${index})">Remove</button>
        `;
        urlList.appendChild(item);
      });
    } else {
      urlList.innerHTML = '<div class="url-item"><span class="url-text">No URLs configured</span></div>';
    }
  }

  updateExtensionList() {
    const extensionList = document.getElementById('extensionList');
    extensionList.innerHTML = '';

    if (this.config.allowedExtensions && this.config.allowedExtensions.length > 0) {
      this.config.allowedExtensions.forEach((extensionId, index) => {
        const item = document.createElement('div');
        item.className = 'extension-item';
        item.innerHTML = `
          <span class="extension-text">${extensionId}</span>
          <button class="remove-btn" onclick="adminPanel.removeExtension(${index})">Remove</button>
        `;
        extensionList.appendChild(item);
      });
    } else {
      extensionList.innerHTML = '<div class="extension-item"><span class="extension-text">No extensions configured</span></div>';
    }
  }

  updateSessionInfo() {
    const session = this.config.session || {};
    
    document.getElementById('currentSessionId').textContent = session.sessionId || 'Not active';
    document.getElementById('currentCandidateId').textContent = session.candidateId || '--';
    
    if (session.startTime) {
      document.getElementById('currentStartTime').textContent = new Date(session.startTime).toLocaleString();
    } else {
      document.getElementById('currentStartTime').textContent = '--';
    }
    
    if (session.duration) {
      const minutes = Math.floor(session.duration / 60000);
      document.getElementById('currentDuration').textContent = `${minutes} minutes`;
    } else {
      document.getElementById('currentDuration').textContent = '--';
    }
  }

  addUrl() {
    const input = document.getElementById('newUrlInput');
    const url = input.value.trim();
    
    if (!url) {
      this.showToast('Please enter a URL', 'warning');
      return;
    }
    
    if (!this.config.allowedUrls) {
      this.config.allowedUrls = [];
    }
    
    if (this.config.allowedUrls.includes(url)) {
      this.showToast('URL already exists', 'warning');
      return;
    }
    
    this.config.allowedUrls.push(url);
    input.value = '';
    this.updateUrlList();
    this.showToast('URL added successfully', 'success');
  }

  removeUrl(index) {
    if (this.config.allowedUrls && index >= 0 && index < this.config.allowedUrls.length) {
      this.config.allowedUrls.splice(index, 1);
      this.updateUrlList();
      this.showToast('URL removed successfully', 'success');
    }
  }

  addExtension() {
    const input = document.getElementById('newExtensionInput');
    const extensionId = input.value.trim();
    
    if (!extensionId) {
      this.showToast('Please enter an extension ID', 'warning');
      return;
    }
    
    if (!this.config.allowedExtensions) {
      this.config.allowedExtensions = [];
    }
    
    if (this.config.allowedExtensions.includes(extensionId)) {
      this.showToast('Extension already exists', 'warning');
      return;
    }
    
    this.config.allowedExtensions.push(extensionId);
    input.value = '';
    this.updateExtensionList();
    this.showToast('Extension added successfully', 'success');
  }

  removeExtension(index) {
    if (this.config.allowedExtensions && index >= 0 && index < this.config.allowedExtensions.length) {
      this.config.allowedExtensions.splice(index, 1);
      this.updateExtensionList();
      this.showToast('Extension removed successfully', 'success');
    }
  }

  updateConfigFromForm() {
    if (!this.config) return;

    // Update notifications
    this.config.notifications = {
      showWarnings: document.getElementById('showWarnings').checked,
      showBlocked: document.getElementById('showBlocked').checked,
      soundEnabled: document.getElementById('soundEnabled').checked
    };

    // Update restrictions
    const restrictionIds = [
      'blockCopyPaste', 'blockNewTabs', 'blockScreenshots', 'blockMinimize',
      'blockAppSwitching', 'blockMultipleMonitors', 'blockScreenSharing',
      'blockBluetoothDevices', 'blockDevTools', 'blockPrintScreen',
      'blockRightClick', 'blockTextSelection', 'blockDragDrop'
    ];
    
    restrictionIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        this.config.restrictions[id] = element.checked;
      }
    });

    // Update monitoring
    this.config.monitoring = {
      trackKeystrokes: document.getElementById('trackKeystrokes').checked,
      trackMouseMovements: document.getElementById('trackMouseMovements').checked,
      trackSystemUsage: document.getElementById('trackSystemUsage').checked,
      trackRunningApps: document.getElementById('trackRunningApps').checked,
      trackNetworkActivity: document.getElementById('trackNetworkActivity').checked,
      batteryThreshold: parseInt(document.getElementById('batteryThreshold').value) || 50,
      cpuThreshold: parseInt(document.getElementById('cpuThreshold').value) || 80,
      memoryThreshold: parseInt(document.getElementById('memoryThreshold').value) || 90,
      monitoringInterval: parseInt(document.getElementById('monitoringInterval').value) || 5
    };

    // Update backend
    this.config.backend = {
      apiUrl: document.getElementById('apiUrl').value.trim(),
      apiKey: document.getElementById('apiKey').value.trim(),
      timeout: parseInt(document.getElementById('apiTimeout').value) || 10000,
      retryAttempts: parseInt(document.getElementById('retryAttempts').value) || 3,
      enableRealTimeSync: document.getElementById('enableRealTimeSync').checked,
      syncInterval: parseInt(document.getElementById('syncInterval').value) || 30
    };

    // Update advanced
    const advancedIds = [
      'enableVirtualMachine', 'blockVirtualKeyboard', 'blockScreenReader',
      'enableBiometricVerification', 'requireCameraAccess', 'enableProctoring'
    ];
    
    advancedIds.forEach(id => {
      const element = document.getElementById(id);
      if (element) {
        this.config.advanced[id] = element.checked;
      }
    });
  }

  async saveConfiguration() {
    try {
      this.showLoading(true);
      this.updateConfigFromForm();
      
      const response = await getAPI().runtime.sendMessage({
        action: 'UPDATE_CONFIG',
        config: this.config
      });
      
      if (response.success) {
        this.showToast('Configuration saved successfully', 'success');
      } else {
        this.showToast('Failed to save configuration', 'error');
      }
    } catch (error) {
      console.error('Failed to save configuration:', error);
      this.showToast('Failed to save configuration', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  async resetConfiguration() {
    if (!confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      return;
    }
    
    try {
      this.showLoading(true);
      
      const response = await getAPI().runtime.sendMessage({
        action: 'RESET_CONFIG'
      });
      
      if (response.success) {
        this.config = await this.getDefaultConfig();
        this.updateUI();
        this.showToast('Configuration reset to defaults', 'success');
      } else {
        this.showToast('Failed to reset configuration', 'error');
      }
    } catch (error) {
      console.error('Failed to reset configuration:', error);
      this.showToast('Failed to reset configuration', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  async testBackendConnection() {
    const statusDiv = document.getElementById('connectionStatus');
    statusDiv.className = 'connection-status testing';
    statusDiv.textContent = 'Testing connection...';
    
    try {
      const apiUrl = document.getElementById('apiUrl').value.trim();
      const apiKey = document.getElementById('apiKey').value.trim();
      
      if (!apiUrl) {
        statusDiv.className = 'connection-status error';
        statusDiv.textContent = 'Please enter an API URL';
        return;
      }
      
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': apiKey ? `Bearer ${apiKey}` : '',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });
      
      if (response.ok) {
        statusDiv.className = 'connection-status success';
        statusDiv.textContent = 'Connection successful!';
      } else {
        statusDiv.className = 'connection-status error';
        statusDiv.textContent = `Connection failed: ${response.status} ${response.statusText}`;
      }
    } catch (error) {
      statusDiv.className = 'connection-status error';
      statusDiv.textContent = `Connection failed: ${error.message}`;
    }
  }

  async startSession() {
    const sessionId = document.getElementById('newSessionId').value.trim();
    const candidateId = document.getElementById('newCandidateId').value.trim();
    const examId = document.getElementById('newExamId').value.trim();
    const duration = parseInt(document.getElementById('sessionDuration').value) || 0;
    const autoSubmit = document.getElementById('autoSubmit').checked;
    
    if (!sessionId) {
      this.showToast('Please enter a session ID', 'warning');
      return;
    }
    
    if (duration <= 0) {
      this.showToast('Please enter a valid duration', 'warning');
      return;
    }
    
    try {
      this.showLoading(true);
      
      const sessionData = {
        sessionId,
        candidateId,
        examId,
        duration: duration * 60000, // Convert to milliseconds
        autoSubmit
      };
      
      const response = await getAPI().runtime.sendMessage({
        action: 'START_SESSION',
        sessionData
      });
      
      if (response.success) {
        this.config.session = {
          sessionId,
          candidateId,
          examId,
          startTime: Date.now(),
          duration: duration * 60000,
          autoSubmit
        };
        
        this.updateSessionInfo();
        this.showToast('Session started successfully', 'success');
        
        // Clear form
        document.getElementById('newSessionId').value = '';
        document.getElementById('newCandidateId').value = '';
        document.getElementById('newExamId').value = '';
        document.getElementById('sessionDuration').value = '';
        document.getElementById('autoSubmit').checked = false;
      } else {
        this.showToast('Failed to start session', 'error');
      }
    } catch (error) {
      console.error('Failed to start session:', error);
      this.showToast('Failed to start session', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  async endSession() {
    if (!this.config.session?.sessionId) {
      this.showToast('No active session to end', 'warning');
      return;
    }
    
    if (!confirm('Are you sure you want to end the current session?')) {
      return;
    }
    
    try {
      this.showLoading(true);
      
      const response = await getAPI().runtime.sendMessage({
        action: 'END_SESSION'
      });
      
      if (response.success) {
        this.config.session = {
          sessionId: null,
          candidateId: null,
          examId: null,
          startTime: null,
          duration: null,
          autoSubmit: false
        };
        
        this.updateSessionInfo();
        this.showToast('Session ended successfully', 'success');
      } else {
        this.showToast('Failed to end session', 'error');
      }
    } catch (error) {
      console.error('Failed to end session:', error);
      this.showToast('Failed to end session', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  async exportConfiguration() {
    try {
      this.updateConfigFromForm();
      
      const configJson = JSON.stringify(this.config, null, 2);
      const blob = new Blob([configJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `ste-config-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      this.showToast('Configuration exported successfully', 'success');
    } catch (error) {
      console.error('Failed to export configuration:', error);
      this.showToast('Failed to export configuration', 'error');
    }
  }

  async importConfiguration(file) {
    if (!file) return;
    
    try {
      const text = await file.text();
      const importedConfig = JSON.parse(text);
      
      // Validate configuration structure
      if (!this.validateConfiguration(importedConfig)) {
        this.showToast('Invalid configuration file', 'error');
        return;
      }
      
      this.config = importedConfig;
      this.updateUI();
      this.showToast('Configuration imported successfully', 'success');
    } catch (error) {
      console.error('Failed to import configuration:', error);
      this.showToast('Failed to import configuration', 'error');
    }
  }

  validateConfiguration(config) {
    // Basic validation of configuration structure
    const requiredKeys = ['allowedUrls', 'restrictions', 'monitoring', 'backend'];
    return requiredKeys.every(key => key in config);
  }

  setDebugInfo() {
    const manifest = getAPI().runtime.getManifest();
    document.getElementById('extensionId').textContent = getAPI().runtime.id;
    document.getElementById('extensionVersion').textContent = manifest.version;
    document.getElementById('userAgent').textContent = navigator.userAgent;
  }

  showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = show ? 'flex' : 'none';
  }

  showToast(message, type = 'info') {
    const toast = document.getElementById('notificationToast');
    const icon = document.getElementById('toastIcon');
    const messageEl = document.getElementById('toastMessage');
    
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    icon.textContent = icons[type] || icons.info;
    messageEl.textContent = message;
    
    toast.className = `notification-toast ${type}`;
    toast.style.display = 'flex';
    
    setTimeout(() => {
      this.hideToast();
    }, 5000);
  }

  hideToast() {
    const toast = document.getElementById('notificationToast');
    toast.style.display = 'none';
  }
}

// Initialize admin panel when DOM is loaded
let adminPanel;

document.addEventListener('DOMContentLoaded', () => {
  adminPanel = new AdminPanel();
});

// Make adminPanel globally accessible for onclick handlers
window.adminPanel = adminPanel;