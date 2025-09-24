// Main service worker for Secure Testing Environment
console.log('[STE] Service Worker: Starting initialization...');

class SecureTestingService {
  constructor() {
    this.isActive = false;
    this.config = null;
    this.monitoringInterval = null;
    this.unauthorizedActions = [];
    this.allowedTabs = new Set();
    this.isInitialized = false;
    this.init().catch(error => {
      console.error('Failed to initialize Secure Testing Service:', error);
    });
  }

  async init() {
    try {
      console.log('[STE] Service Worker: Initializing...');
      
      // Initialize built-in system monitoring
      this.systemMonitor = {
        getSystemInfo: async () => {
          try {
            const systemInfo = {
              timestamp: Date.now(),
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              language: navigator.language,
              cookieEnabled: navigator.cookieEnabled,
              onLine: navigator.onLine
            };
            
            // Get display info if available
            try {
              const displays = await chrome.system.display.getInfo();
              systemInfo.displays = displays;
              systemInfo.displayCount = displays.length;
            } catch (e) {
              systemInfo.displays = [];
              systemInfo.displayCount = 0;
            }
            
            // Get CPU info if available
            try {
              const cpu = await chrome.system.cpu.getInfo();
              systemInfo.cpu = cpu;
            } catch (e) {
              systemInfo.cpu = null;
            }
            
            // Get memory info if available
            try {
              const memory = await chrome.system.memory.getInfo();
              systemInfo.memory = memory;
            } catch (e) {
              systemInfo.memory = null;
            }
            
            return systemInfo;
          } catch (error) {
            console.error('[STE] Error getting system info:', error);
            return {
              timestamp: Date.now(),
              error: error.message
            };
          }
        }
      };
      
      console.log('[STE] Service Worker: Built-in system monitor initialized');
      
      // Load configuration from storage
      console.log('[STE] Service Worker: Loading configuration...');
      await this.loadConfiguration();
      
      // Set up event listeners
      console.log('[STE] Service Worker: Setting up event listeners...');
      this.setupEventListeners();
      
      // Start system monitoring if active
      if (this.isActive) {
        console.log('[STE] Service Worker: Starting monitoring...');
        this.startMonitoring();
      }
      
      this.isInitialized = true;
      console.log('[STE] Service Worker: Initialized successfully');
      
      // Notify all tabs that the extension is ready
      console.log('[STE] Service Worker: Notifying tabs extension is ready...');
      this.notifyTabsExtensionReady();
      
    } catch (error) {
      console.error('[STE] Service Worker: Initialization failed:', error);
      this.isInitialized = false;
    }
  }

  async notifyTabsExtensionReady() {
    try {
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            action: 'EXTENSION_READY',
            extensionId: chrome.runtime.id
          });
        } catch (error) {
          // Tab might not have content script, ignore
        }
      }
    } catch (error) {
      console.error('Failed to notify tabs:', error);
    }
  }

  async loadConfiguration() {
    try {
      const result = await chrome.storage.local.get(['config', 'isActive']);
      this.config = result.config || this.getDefaultConfig();
      this.isActive = result.isActive || false;
    } catch (error) {
      console.error('Failed to load configuration:', error);
      this.config = this.getDefaultConfig();
    }
  }

  getDefaultConfig() {
    return {
      allowedUrls: [
        'chrome://*',
        'chrome-extension://*',
        'https://work-1-coiqhoypmqstyttp.prod-runtime.all-hands.dev/*',
        'https://work-2-coiqhoypmqstyttp.prod-runtime.all-hands.dev/*'
      ],
      allowedExtensions: [],
      restrictions: {
        blockCopyPaste: true,
        blockNewTabs: true,
        blockScreenshots: true,
        blockMinimize: true,
        blockAppSwitching: true,
        blockMultipleMonitors: true,
        blockScreenSharing: true,
        blockBluetoothDevices: true
      },
      monitoring: {
        trackKeystrokes: true,
        trackSystemUsage: true,
        trackRunningApps: true,
        batteryThreshold: 50
      },
      backend: {
        apiUrl: '',
        apiKey: ''
      }
    };
  }

  setupEventListeners() {
    // Tab management
    chrome.tabs.onCreated.addListener(this.handleTabCreated.bind(this));
    chrome.tabs.onUpdated.addListener(this.handleTabUpdated.bind(this));
    chrome.tabs.onRemoved.addListener(this.handleTabRemoved.bind(this));
    chrome.tabs.onActivated.addListener(this.handleTabActivated.bind(this));

    // Window management
    chrome.windows.onCreated.addListener(this.handleWindowCreated.bind(this));
    chrome.windows.onFocusChanged.addListener(this.handleWindowFocusChanged.bind(this));

    // Extension management
    chrome.management.onEnabled.addListener(this.handleExtensionEnabled.bind(this));
    chrome.management.onDisabled.addListener(this.handleExtensionDisabled.bind(this));
    chrome.management.onInstalled.addListener(this.handleExtensionInstalled.bind(this));

    // Web navigation
    chrome.webNavigation.onBeforeNavigate.addListener(this.handleNavigation.bind(this));

    // Message handling
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
    chrome.runtime.onMessageExternal.addListener(this.handleExternalMessage.bind(this));

    // Keyboard shortcuts
    chrome.commands.onCommand.addListener(this.handleCommand.bind(this));

    // Note: chrome.desktopCapture.onStarted doesn't exist in Chrome Extensions API
    // Screen capture detection is handled through other means in system monitoring
  }

  async handleTabCreated(tab) {
    if (!this.isActive) return;

    if (this.config.restrictions.blockNewTabs) {
      // Check if this is an allowed URL
      const isAllowed = this.isUrlAllowed(tab.url);
      
      if (!isAllowed) {
        await this.logUnauthorizedAction('NEW_TAB_BLOCKED', {
          url: tab.url,
          tabId: tab.id,
          timestamp: Date.now()
        });
        
        // Close the unauthorized tab
        chrome.tabs.remove(tab.id);
        
        // Show notification
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Unauthorized Action Blocked',
          message: 'New tab creation is not allowed during the test.'
        });
        
        return;
      }
    }

    this.allowedTabs.add(tab.id);
  }

  async handleTabUpdated(tabId, changeInfo, tab) {
    if (!this.isActive) return;

    if (changeInfo.url) {
      const isAllowed = this.isUrlAllowed(changeInfo.url);
      
      if (!isAllowed) {
        await this.logUnauthorizedAction('NAVIGATION_BLOCKED', {
          url: changeInfo.url,
          tabId: tabId,
          timestamp: Date.now()
        });
        
        // Block navigation to unauthorized URL
        chrome.tabs.update(tabId, { url: 'about:blank' });
        
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Navigation Blocked',
          message: 'Access to this URL is not allowed during the test.'
        });
      }
    }
  }

  handleTabRemoved(tabId, removeInfo) {
    this.allowedTabs.delete(tabId);
  }

  async handleTabActivated(activeInfo) {
    if (!this.isActive) return;

    // Log tab switching for monitoring
    await this.logUnauthorizedAction('TAB_SWITCHED', {
      tabId: activeInfo.tabId,
      windowId: activeInfo.windowId,
      timestamp: Date.now()
    });
  }

  async handleWindowCreated(window) {
    if (!this.isActive) return;

    if (this.config.restrictions.blockNewTabs) {
      await this.logUnauthorizedAction('NEW_WINDOW_BLOCKED', {
        windowId: window.id,
        timestamp: Date.now()
      });
      
      // Close unauthorized window
      chrome.windows.remove(window.id);
    }
  }

  async handleWindowFocusChanged(windowId) {
    if (!this.isActive) return;

    if (windowId === chrome.windows.WINDOW_ID_NONE) {
      // User switched to another application
      if (this.config.restrictions.blockAppSwitching) {
        await this.logUnauthorizedAction('APP_SWITCH_DETECTED', {
          timestamp: Date.now()
        });
        
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Unauthorized Action Detected',
          message: 'Switching to other applications is not allowed during the test.'
        });
      }
    }
  }

  async handleExtensionEnabled(info) {
    if (!this.isActive) return;

    const isAllowed = this.config.allowedExtensions.includes(info.id);
    
    if (!isAllowed && info.id !== chrome.runtime.id) {
      await this.logUnauthorizedAction('EXTENSION_ENABLED', {
        extensionId: info.id,
        extensionName: info.name,
        timestamp: Date.now()
      });
      
      // Disable unauthorized extension
      chrome.management.setEnabled(info.id, false);
      
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Extension Blocked',
        message: `Extension "${info.name}" is not allowed during the test.`
      });
    }
  }

  async handleExtensionDisabled(info) {
    if (info.id === chrome.runtime.id) {
      // Our extension is being disabled - log this as critical
      await this.logUnauthorizedAction('SECURITY_EXTENSION_DISABLED', {
        timestamp: Date.now()
      });
    }
  }

  async handleExtensionInstalled(info) {
    if (!this.isActive) return;

    await this.logUnauthorizedAction('EXTENSION_INSTALLED', {
      extensionId: info.id,
      extensionName: info.name,
      timestamp: Date.now()
    });
  }

  async handleNavigation(details) {
    if (!this.isActive) return;

    if (details.frameId === 0) { // Main frame only
      const isAllowed = this.isUrlAllowed(details.url);
      
      if (!isAllowed) {
        await this.logUnauthorizedAction('NAVIGATION_ATTEMPT', {
          url: details.url,
          tabId: details.tabId,
          timestamp: Date.now()
        });
      }
    }
  }

  async handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'ACTIVATE_MONITORING':
        try {
          await this.activateMonitoring(request.config);
          sendResponse({ success: true });
        } catch (error) {
          console.error('[STE] Failed to activate monitoring:', error);
          sendResponse({ success: false, error: error.message });
        }
        break;
        
      case 'DEACTIVATE_MONITORING':
        await this.deactivateMonitoring();
        sendResponse({ success: true });
        break;
        
      case 'GET_STATUS':
        sendResponse({
          isActive: this.isActive,
          config: this.config,
          unauthorizedActions: this.unauthorizedActions.slice(-10) // Last 10 actions
        });
        break;
        
      case 'LOG_UNAUTHORIZED_ACTION':
        await this.logUnauthorizedAction(request.type, request.data);
        sendResponse({ success: true });
        break;
        
      case 'UPDATE_CONFIG':
        await this.updateConfiguration(request.config);
        sendResponse({ success: true });
        break;
        
      case 'UNINSTALL_EXTENSION':
        await this.uninstallExtension();
        sendResponse({ success: true });
        break;
        
      case 'EMERGENCY_STOP':
        await this.emergencyStop();
        sendResponse({ success: true });
        break;
        
      case 'GET_SYSTEM_INFO':
        const systemInfo = await this.systemMonitor.getSystemInfo();
        sendResponse({ success: true, systemInfo });
        break;
        
      case 'GET_SYSTEM_DATA':
        const systemData = await this.getSystemData();
        sendResponse({ success: true, systemData });
        break;
        
      case 'DEVELOPER_TOOLS_DETECTED':
        await this.handleDeveloperToolsViolation(request.data);
        sendResponse({ success: true });
        break;
        
      case 'PING':
        sendResponse({ 
          success: true, 
          extensionId: chrome.runtime.id,
          version: chrome.runtime.getManifest().version,
          isActive: this.isActive,
          isInitialized: this.isInitialized,
          timestamp: Date.now()
        });
        break;
        
      case 'GET_EXTENSION_INFO':
        sendResponse({
          success: true,
          extensionId: chrome.runtime.id,
          version: chrome.runtime.getManifest().version,
          name: chrome.runtime.getManifest().name,
          isActive: this.isActive,
          config: this.config
        });
        break;
        
      case 'START_SESSION':
        await this.startSession(request.sessionData);
        sendResponse({ success: true });
        break;
        
      case 'END_SESSION':
        await this.endSession();
        sendResponse({ success: true });
        break;
        
      case 'GET_SECURITY_STATUS':
        const securityStatus = await this.getSecurityStatus();
        sendResponse({ success: true, securityStatus });
        break;
        
      case 'GET_UNAUTHORIZED_ACTIONS':
        const actions = this.unauthorizedActions.slice(-(request.limit || 50));
        sendResponse({ success: true, actions });
        break;
        
      case 'CHECK_SCREEN_SHARING':
        const screenSharing = await this.checkScreenSharing();
        sendResponse({ success: true, screenSharing });
        break;
        
      case 'CHECK_URL_ALLOWED':
        const allowed = this.isUrlAllowed(request.url);
        sendResponse({ success: true, allowed });
        break;
        
      case 'BLOCK_NEW_TAB':
        await this.blockNewTab(request.url);
        sendResponse({ success: true });
        break;
        
      case 'LOG_KEYSTROKE':
        await this.logKeystroke(request.keystroke);
        sendResponse({ success: true });
        break;
        
      case 'LOG_WINDOW_STATE':
        await this.logWindowStateChange(request.state, request.details);
        sendResponse({ success: true });
        break;
        
      case 'GET_BLUETOOTH_DEVICES':
        const devices = await this.getBluetoothDevices();
        sendResponse({ success: true, devices });
        break;
        
      case 'CHECK_SCREEN_MIRRORING':
        const mirroring = await this.checkScreenMirroring();
        sendResponse({ success: true, mirroring });
        break;
        
      case 'BLOCK_MULTIPLE_MONITORS':
        await this.blockMultipleMonitors();
        sendResponse({ success: true });
        break;
        
      case 'GET_ALL_OPEN_URLS':
        const urls = await this.getAllOpenUrls();
        sendResponse({ success: true, urls });
        break;
        
      default:
        sendResponse({ error: 'Unknown action' });
    }
    
    return true; // Keep message channel open for async response
  }

  async handleExternalMessage(request, sender, sendResponse) {
    // Handle messages from external web pages
    if (request.action === 'INTEGRATE_EXTENSION') {
      sendResponse({
        success: true,
        extensionId: chrome.runtime.id,
        version: chrome.runtime.getManifest().version
      });
    }
    
    return true;
  }

  async handleCommand(command) {
    switch (command) {
      case 'emergency_stop':
        await this.emergencyStop();
        break;
      
      case '_execute_action':
        // This is handled by the browser automatically (opens popup)
        break;
        
      default:
        // If monitoring is active, block certain keyboard shortcuts
        if (this.isActive) {
          const blockedCommands = ['Ctrl+Shift+I', 'F12', 'Ctrl+U', 'Ctrl+Shift+J'];
          
          if (blockedCommands.includes(command)) {
            await this.logUnauthorizedAction('BLOCKED_SHORTCUT', {
              command: command,
              timestamp: Date.now()
            });
          }
        }
        break;
    }
  }

  async handleScreenCaptureStarted(request) {
    if (!this.isActive) return;

    if (this.config.restrictions.blockScreenSharing) {
      await this.logUnauthorizedAction('SCREEN_CAPTURE_BLOCKED', {
        timestamp: Date.now()
      });
      
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Screen Capture Blocked',
        message: 'Screen sharing/recording is not allowed during the test.'
      });
    }
  }

  isUrlAllowed(url) {
    if (!url || !this.config.allowedUrls.length) return false;
    
    return this.config.allowedUrls.some(allowedUrl => {
      if (allowedUrl.includes('*')) {
        const regex = new RegExp(allowedUrl.replace(/\*/g, '.*'));
        return regex.test(url);
      }
      return url.startsWith(allowedUrl);
    });
  }

  async activateMonitoring(config) {
    try {
      console.log('[STE] Activating monitoring with config:', config);
      
      // Merge configuration
      this.config = { ...this.config, ...config };
      this.isActive = true;
      
      console.log('[STE] Saving configuration to storage...');
      await chrome.storage.local.set({
        config: this.config,
        isActive: this.isActive
      });
      
      console.log('[STE] Starting monitoring...');
      this.startMonitoring();
      
      // Disable unauthorized extensions
      console.log('[STE] Checking extensions...');
      try {
        const extensions = await chrome.management.getAll();
        for (const ext of extensions) {
          if (ext.enabled && 
              ext.id !== chrome.runtime.id && 
              !this.config.allowedExtensions.includes(ext.id)) {
            console.log(`[STE] Disabling unauthorized extension: ${ext.name} (${ext.id})`);
            await chrome.management.setEnabled(ext.id, false);
          }
        }
      } catch (error) {
        console.warn('[STE] Could not manage extensions:', error.message);
        // Don't fail activation if extension management fails
      }
      
      console.log('[STE] Monitoring activated successfully');
    } catch (error) {
      console.error('[STE] Failed to activate monitoring:', error);
      this.isActive = false;
      throw error;
    }
  }

  async deactivateMonitoring() {
    this.isActive = false;
    await chrome.storage.local.set({ isActive: false });
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  startMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    this.monitoringInterval = setInterval(async () => {
      await this.performSystemCheck();
    }, 5000); // Check every 5 seconds
  }

  async performSystemCheck() {
    try {
      // Check battery level
      if (navigator.getBattery) {
        const battery = await navigator.getBattery();
        if (battery.level < (this.config.monitoring.batteryThreshold / 100)) {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Low Battery Warning',
            message: `Battery level is ${Math.round(battery.level * 100)}%. Please connect charger.`
          });
        }
      }
      
      // Check for multiple displays
      if (this.config.restrictions.blockMultipleMonitors) {
        const displays = await chrome.system.display.getInfo();
        if (displays.length > 1) {
          await this.logUnauthorizedAction('MULTIPLE_DISPLAYS_DETECTED', {
            displayCount: displays.length,
            timestamp: Date.now()
          });
        }
      }
      
    } catch (error) {
      console.error('System check failed:', error);
    }
  }

  async logUnauthorizedAction(type, data) {
    const action = {
      id: Date.now() + Math.random(),
      type,
      data,
      timestamp: Date.now()
    };
    
    this.unauthorizedActions.push(action);
    
    // Keep only last 100 actions in memory
    if (this.unauthorizedActions.length > 100) {
      this.unauthorizedActions = this.unauthorizedActions.slice(-100);
    }
    
    // Send to backend if configured
    if (this.config.backend.apiUrl) {
      try {
        await fetch(`${this.config.backend.apiUrl}/log-action`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.backend.apiKey}`
          },
          body: JSON.stringify(action)
        });
      } catch (error) {
        console.error('Failed to send log to backend:', error);
      }
    }
    
    // Store locally as backup
    await chrome.storage.local.set({
      unauthorizedActions: this.unauthorizedActions
    });
  }

  async updateConfiguration(newConfig) {
    this.config = { ...this.config, ...newConfig };
    await chrome.storage.local.set({ config: this.config });
  }

  async uninstallExtension() {
    try {
      // Log the uninstall action
      await this.logUnauthorizedAction('EXTENSION_UNINSTALLED', {
        timestamp: Date.now(),
        reason: 'User requested uninstall'
      });

      // Deactivate monitoring first
      await this.deactivateMonitoring();

      // Clear all stored data
      await chrome.storage.local.clear();
      await chrome.storage.sync.clear();

      // Close all tabs except the current one
      const tabs = await chrome.tabs.query({});
      const currentTab = tabs.find(tab => tab.active);
      
      for (const tab of tabs) {
        if (tab.id !== currentTab?.id) {
          chrome.tabs.remove(tab.id);
        }
      }

      // Self-uninstall the extension
      chrome.management.uninstallSelf();
    } catch (error) {
      console.error('Error during uninstall:', error);
    }
  }

  async emergencyStop() {
    try {
      // Log emergency stop
      await this.logUnauthorizedAction('EMERGENCY_STOP', {
        timestamp: Date.now(),
        reason: 'Emergency stop triggered'
      });

      // Close all tabs
      const tabs = await chrome.tabs.query({});
      for (const tab of tabs) {
        chrome.tabs.remove(tab.id);
      }

      // Redirect to violation page
      chrome.tabs.create({
        url: 'https://examroom.ai/devtooltrying',
        active: true
      });

      // Uninstall extension
      setTimeout(() => {
        chrome.management.uninstallSelf();
      }, 2000);
    } catch (error) {
      console.error('Error during emergency stop:', error);
    }
  }

  async handleDeveloperToolsViolation(data) {
    try {
      // Get system information for logging
      const systemInfo = await this.systemMonitor.getSystemInfo();
      
      // Get IP address and MAC address
      const networkInfo = await this.getNetworkInfo();

      // Log the violation with detailed information
      await this.logUnauthorizedAction('DEVELOPER_TOOLS_VIOLATION', {
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: data.url || 'unknown',
        systemInfo: systemInfo,
        networkInfo: networkInfo,
        severity: 'CRITICAL'
      });

      // Show critical alert
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'CRITICAL SECURITY VIOLATION',
        message: 'Developer tools detected. Exam session terminated.',
        priority: 2
      });

      // Trigger emergency stop
      await this.emergencyStop();
    } catch (error) {
      console.error('Error handling developer tools violation:', error);
    }
  }

  async getNetworkInfo() {
    try {
      // Get IP address using WebRTC
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      return new Promise((resolve) => {
        const networkInfo = {
          ipAddress: 'unknown',
          macAddress: 'unknown',
          timestamp: Date.now()
        };

        pc.createDataChannel('');
        pc.createOffer().then(offer => pc.setLocalDescription(offer));
        
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            const candidate = event.candidate.candidate;
            const ipMatch = candidate.match(/(\d+\.\d+\.\d+\.\d+)/);
            if (ipMatch) {
              networkInfo.ipAddress = ipMatch[1];
            }
          }
        };

        // Try to get MAC address (limited in browser environment)
        if (navigator.connection) {
          networkInfo.connectionType = navigator.connection.effectiveType;
        }

        setTimeout(() => {
          pc.close();
          resolve(networkInfo);
        }, 3000);
      });
    } catch (error) {
      console.error('Error getting network info:', error);
      return {
        ipAddress: 'unknown',
        macAddress: 'unknown',
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  async startSession(sessionData) {
    try {
      // Store session data
      await chrome.storage.local.set({
        currentSession: {
          ...sessionData,
          startTime: Date.now(),
          status: 'active'
        }
      });
      
      // Activate monitoring with session config
      await this.activateMonitoring(this.config);
      
      console.log('Session started:', sessionData.sessionId);
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  }

  async endSession() {
    try {
      // Get current session
      const result = await chrome.storage.local.get(['currentSession']);
      const session = result.currentSession;
      
      if (session) {
        // Update session status
        session.endTime = Date.now();
        session.status = 'completed';
        
        // Store completed session
        await chrome.storage.local.set({
          currentSession: null,
          lastSession: session
        });
      }
      
      // Deactivate monitoring
      await this.deactivateMonitoring();
      
      console.log('Session ended');
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }

  async getSecurityStatus() {
    try {
      const systemInfo = await this.systemMonitor.getSystemInfo();
      
      return {
        isActive: this.isActive,
        restrictions: this.config.restrictions,
        systemInfo: systemInfo,
        unauthorizedActionsCount: this.unauthorizedActions.length,
        lastCheck: Date.now()
      };
    } catch (error) {
      console.error('Error getting security status:', error);
      return {
        isActive: this.isActive,
        error: error.message,
        lastCheck: Date.now()
      };
    }
  }

  async checkScreenSharing() {
    try {
      // Check if screen is being shared
      const displays = await chrome.system.display.getInfo();
      
      // This is a simplified check - in a real implementation,
      // you would need more sophisticated detection
      return {
        isSharing: false, // Placeholder
        displays: displays.length,
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Error checking screen sharing:', error);
      return {
        isSharing: false,
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  async blockNewTab(url) {
    try {
      // Check if URL is allowed
      if (!this.isUrlAllowed(url)) {
        await this.logUnauthorizedAction('NEW_TAB_BLOCKED', {
          url: url,
          timestamp: Date.now()
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error blocking new tab:', error);
      return false;
    }
  }

  async logKeystroke(keystroke) {
    try {
      await this.logUnauthorizedAction('KEYSTROKE_LOGGED', {
        keystroke: keystroke,
        timestamp: Date.now()
      });
      return true;
    } catch (error) {
      console.error('Error logging keystroke:', error);
      return false;
    }
  }

  async logWindowStateChange(state, details) {
    try {
      await this.logUnauthorizedAction('WINDOW_STATE_CHANGE', {
        state: state,
        details: details,
        timestamp: Date.now()
      });
      return true;
    } catch (error) {
      console.error('Error logging window state change:', error);
      return false;
    }
  }

  async getBluetoothDevices() {
    try {
      // Note: Chrome extensions don't have direct access to Bluetooth API
      // This would require additional permissions and is limited
      // For now, return placeholder data
      return [
        { name: 'Demo Bluetooth Device', connected: false },
        { name: 'Wireless Headphones', connected: true }
      ];
    } catch (error) {
      console.error('Error getting Bluetooth devices:', error);
      return [];
    }
  }

  async checkScreenMirroring() {
    try {
      // Check for multiple displays which might indicate screen mirroring
      const displays = await chrome.system.display.getInfo();
      const hasMultipleDisplays = displays.length > 1;
      
      // Log if multiple displays detected
      if (hasMultipleDisplays) {
        await this.logUnauthorizedAction('MULTIPLE_DISPLAYS_DETECTED', {
          displayCount: displays.length,
          displays: displays.map(d => ({ id: d.id, bounds: d.bounds })),
          timestamp: Date.now()
        });
      }
      
      return {
        possibleMirroring: hasMultipleDisplays,
        displayCount: displays.length,
        displays: displays
      };
    } catch (error) {
      console.error('Error checking screen mirroring:', error);
      return {
        possibleMirroring: false,
        error: error.message
      };
    }
  }

  async blockMultipleMonitors() {
    try {
      const displays = await chrome.system.display.getInfo();
      
      if (displays.length > 1) {
        await this.logUnauthorizedAction('MULTIPLE_MONITORS_BLOCKED', {
          displayCount: displays.length,
          timestamp: Date.now()
        });
        
        // In a real implementation, you might want to:
        // 1. Show a warning to the user
        // 2. Disable secondary displays if possible
        // 3. End the session
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error blocking multiple monitors:', error);
      return false;
    }
  }

  async getAllOpenUrls() {
    try {
      const tabs = await chrome.tabs.query({});
      return tabs.map(tab => ({
        id: tab.id,
        url: tab.url,
        title: tab.title,
        active: tab.active,
        windowId: tab.windowId
      }));
    } catch (error) {
      console.error('Error getting open URLs:', error);
      return [];
    }
  }

  async getSystemData() {
    try {
      const systemData = {
        timestamp: Date.now(),
        cpu: null,
        memory: null,
        battery: null,
        displays: [],
        network: null
      };

      // Get CPU info
      try {
        const cpuInfo = await chrome.system.cpu.getInfo();
        if (cpuInfo && cpuInfo.processors && cpuInfo.processors.length > 0) {
          // Calculate average usage across all processors
          let totalUsage = 0;
          let totalProcessors = 0;
          
          cpuInfo.processors.forEach(processor => {
            if (processor.usage && processor.usage.total) {
              totalUsage += (processor.usage.user + processor.usage.kernel) / processor.usage.total * 100;
              totalProcessors++;
            }
          });
          
          systemData.cpu = {
            usage: totalProcessors > 0 ? totalUsage / totalProcessors : 0,
            processors: cpuInfo.processors.length,
            modelName: cpuInfo.modelName || 'Unknown',
            archName: cpuInfo.archName || 'Unknown'
          };
        }
      } catch (error) {
        console.log('[STE] CPU info not available:', error.message);
        systemData.cpu = { usage: 0, processors: 0, modelName: 'Unknown', archName: 'Unknown' };
      }

      // Get memory info
      try {
        const memoryInfo = await chrome.system.memory.getInfo();
        if (memoryInfo) {
          const usedMemory = memoryInfo.capacity - memoryInfo.availableCapacity;
          const usage = (usedMemory / memoryInfo.capacity) * 100;
          
          systemData.memory = {
            usage: usage,
            total: memoryInfo.capacity,
            available: memoryInfo.availableCapacity,
            used: usedMemory
          };
        }
      } catch (error) {
        console.log('[STE] Memory info not available:', error.message);
        systemData.memory = { usage: 0, total: 0, available: 0, used: 0 };
      }

      // Get display info
      try {
        const displays = await chrome.system.display.getInfo();
        systemData.displays = displays.map(display => ({
          id: display.id,
          name: display.name || `Display ${display.id}`,
          bounds: display.bounds,
          workArea: display.workArea,
          isPrimary: display.isPrimary || false
        }));
      } catch (error) {
        console.log('[STE] Display info not available:', error.message);
        systemData.displays = [];
      }

      // Get battery info (if available)
      try {
        if (navigator.getBattery) {
          const battery = await navigator.getBattery();
          systemData.battery = {
            level: battery.level,
            charging: battery.charging,
            chargingTime: battery.chargingTime,
            dischargingTime: battery.dischargingTime
          };
        }
      } catch (error) {
        console.log('[STE] Battery info not available:', error.message);
        systemData.battery = null;
      }

      // Get network info
      try {
        if (navigator.connection) {
          systemData.network = {
            effectiveType: navigator.connection.effectiveType,
            downlink: navigator.connection.downlink,
            rtt: navigator.connection.rtt,
            saveData: navigator.connection.saveData
          };
        }
      } catch (error) {
        console.log('[STE] Network info not available:', error.message);
        systemData.network = null;
      }

      console.log('[STE] System data collected:', systemData);
      return systemData;
    } catch (error) {
      console.error('[STE] Error getting system data:', error);
      return {
        timestamp: Date.now(),
        cpu: { usage: 0, processors: 0, modelName: 'Unknown', archName: 'Unknown' },
        memory: { usage: 0, total: 0, available: 0, used: 0 },
        battery: null,
        displays: [],
        network: null,
        error: error.message
      };
    }
  }
}

// Initialize the service
const secureTestingService = new SecureTestingService();

// Export for external access
self.secureTestingService = secureTestingService;