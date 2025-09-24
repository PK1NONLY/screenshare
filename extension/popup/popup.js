// Popup script for Secure Testing Environment

class PopupController {
  constructor() {
    this.isActive = false;
    this.config = null;
    this.systemData = null;
    this.statistics = null;
    this.updateInterval = null;
    this.init();
  }

  async init() {
    console.log('Popup initialized');
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Load initial data
    await this.loadData();
    
    // Update UI
    this.updateUI();
    
    // Start periodic updates
    this.startPeriodicUpdates();
  }

  setupEventListeners() {
    // Control buttons
    document.getElementById('activateBtn').addEventListener('click', () => {
      this.activateMonitoring();
    });
    
    document.getElementById('deactivateBtn').addEventListener('click', () => {
      this.deactivateMonitoring();
    });
    
    // Footer buttons
    document.getElementById('settingsBtn').addEventListener('click', () => {
      this.openSettings();
    });
    
    document.getElementById('reportBtn').addEventListener('click', () => {
      this.generateReport();
    });
    
    document.getElementById('helpBtn').addEventListener('click', () => {
      this.openHelp();
    });
    
    // Toast close button
    document.getElementById('toastClose').addEventListener('click', () => {
      this.hideToast();
    });
  }

  async loadData() {
    try {
      this.showLoading(true);
      
      // Get status from background script
      const response = await chrome.runtime.sendMessage({ action: 'GET_STATUS' });
      
      if (response) {
        this.isActive = response.isActive;
        this.config = response.config;
        this.statistics = response.statistics || {};
      }
      
      // Get system data
      const systemResponse = await chrome.runtime.sendMessage({ action: 'GET_SYSTEM_DATA' });
      if (systemResponse) {
        this.systemData = systemResponse.systemData;
      }
      
    } catch (error) {
      console.error('Failed to load data:', error);
      this.showToast('Failed to load extension data', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  updateUI() {
    this.updateStatusIndicator();
    this.updateControlButtons();
    this.updateSystemStatus();
    this.updateSecurityStatus();
    this.updateSessionInfo();
    this.updateStatistics();
    this.updateRecentActivity();
    this.updateVersionInfo();
  }

  updateStatusIndicator() {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    if (this.isActive) {
      statusDot.className = 'status-dot active';
      statusText.textContent = 'Active';
    } else {
      statusDot.className = 'status-dot';
      statusText.textContent = 'Inactive';
    }
  }

  updateControlButtons() {
    const activateBtn = document.getElementById('activateBtn');
    const deactivateBtn = document.getElementById('deactivateBtn');
    
    if (this.isActive) {
      activateBtn.disabled = true;
      deactivateBtn.disabled = false;
      activateBtn.textContent = 'Monitoring Active';
      deactivateBtn.textContent = 'Deactivate';
    } else {
      activateBtn.disabled = false;
      deactivateBtn.disabled = true;
      activateBtn.textContent = 'Activate Monitoring';
      deactivateBtn.textContent = 'Deactivate';
    }
  }

  updateSystemStatus() {
    if (!this.systemData) return;
    
    // CPU Usage
    const cpuUsage = document.getElementById('cpuUsage');
    if (this.systemData.cpu) {
      const usage = this.systemData.cpu.usage.toFixed(1);
      cpuUsage.textContent = `${usage}%`;
      cpuUsage.className = usage > 80 ? 'status-value danger' : 
                          usage > 60 ? 'status-value warning' : 'status-value';
    }
    
    // Memory Usage
    const memoryUsage = document.getElementById('memoryUsage');
    if (this.systemData.memory) {
      const usage = this.systemData.memory.usage.toFixed(1);
      memoryUsage.textContent = `${usage}%`;
      memoryUsage.className = usage > 90 ? 'status-value danger' : 
                             usage > 75 ? 'status-value warning' : 'status-value';
    }
    
    // Battery Level
    const batteryLevel = document.getElementById('batteryLevel');
    if (this.systemData.battery) {
      const level = (this.systemData.battery.level * 100).toFixed(0);
      const charging = this.systemData.battery.charging ? ' ⚡' : '';
      batteryLevel.textContent = `${level}%${charging}`;
      batteryLevel.className = level < 20 ? 'status-value danger' : 
                              level < 50 ? 'status-value warning' : 'status-value success';
    }
    
    // Display Count
    const displayCount = document.getElementById('displayCount');
    if (this.systemData.displays) {
      const count = this.systemData.displays.length;
      displayCount.textContent = count.toString();
      displayCount.className = count > 1 ? 'status-value warning' : 'status-value success';
    }
  }

  updateSecurityStatus() {
    if (!this.config) return;
    
    const checks = [
      { id: 'copyPasteCheck', key: 'blockCopyPaste' },
      { id: 'newTabCheck', key: 'blockNewTabs' },
      { id: 'screenshotCheck', key: 'blockScreenshots' },
      { id: 'multiDisplayCheck', key: 'blockMultipleMonitors' }
    ];
    
    checks.forEach(check => {
      const element = document.getElementById(check.id);
      const status = element.querySelector('.check-status');
      
      if (this.config.restrictions && this.config.restrictions[check.key]) {
        status.textContent = '✓';
        status.className = 'check-status';
      } else {
        status.textContent = '✗';
        status.className = 'check-status failed';
      }
    });
    
    // Special case for multi-display check
    if (this.systemData && this.systemData.displays) {
      const multiDisplayStatus = document.getElementById('multiDisplayCheck').querySelector('.check-status');
      if (this.systemData.displays.length === 1) {
        multiDisplayStatus.textContent = '✓';
        multiDisplayStatus.className = 'check-status';
      } else {
        multiDisplayStatus.textContent = '✗';
        multiDisplayStatus.className = 'check-status failed';
      }
    }
  }

  updateSessionInfo() {
    const sessionInfo = document.getElementById('sessionInfo');
    
    if (this.config && this.config.session && this.config.session.sessionId) {
      sessionInfo.style.display = 'block';
      
      document.getElementById('sessionId').textContent = this.config.session.sessionId;
      document.getElementById('candidateId').textContent = this.config.session.candidateId || '--';
      
      // Calculate time remaining
      if (this.config.session.startTime && this.config.session.duration) {
        const elapsed = Date.now() - this.config.session.startTime;
        const remaining = Math.max(0, this.config.session.duration - elapsed);
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        document.getElementById('timeRemaining').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      } else {
        document.getElementById('timeRemaining').textContent = '--';
      }
    } else {
      sessionInfo.style.display = 'none';
    }
  }

  updateStatistics() {
    if (!this.statistics) return;
    
    document.getElementById('blockedActions').textContent = this.statistics.blockedActions || 0;
    document.getElementById('keystrokes').textContent = this.statistics.keystrokes || 0;
    document.getElementById('pageInteractions').textContent = this.statistics.pageInteractions || 0;
    
    // Calculate uptime
    if (this.statistics.startTime) {
      const uptime = Date.now() - this.statistics.startTime;
      const minutes = Math.floor(uptime / 60000);
      const hours = Math.floor(minutes / 60);
      
      if (hours > 0) {
        document.getElementById('uptime').textContent = `${hours}h ${minutes % 60}m`;
      } else {
        document.getElementById('uptime').textContent = `${minutes}m`;
      }
    } else {
      document.getElementById('uptime').textContent = '0m';
    }
  }

  async updateRecentActivity() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'GET_RECENT_ACTIVITY' });
      const activityList = document.getElementById('activityList');
      
      if (response && response.activities && response.activities.length > 0) {
        activityList.innerHTML = '';
        
        response.activities.slice(0, 5).forEach(activity => {
          const item = document.createElement('div');
          item.className = `activity-item ${this.getActivityClass(activity.type)}`;
          
          const time = new Date(activity.timestamp).toLocaleTimeString('en-US', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit'
          });
          
          item.innerHTML = `
            <span class="activity-time">${time}</span>
            <span class="activity-text">${this.formatActivityText(activity)}</span>
          `;
          
          activityList.appendChild(item);
        });
      } else {
        activityList.innerHTML = `
          <div class="activity-item">
            <span class="activity-time">--:--</span>
            <span class="activity-text">No recent activity</span>
          </div>
        `;
      }
    } catch (error) {
      console.error('Failed to load recent activity:', error);
    }
  }

  getActivityClass(type) {
    if (type.includes('BLOCKED') || type.includes('UNAUTHORIZED')) {
      return 'blocked';
    } else if (type.includes('WARNING') || type.includes('SUSPICIOUS')) {
      return 'warning';
    } else {
      return 'info';
    }
  }

  formatActivityText(activity) {
    const typeMap = {
      'COPY_PASTE_BLOCKED': 'Copy/paste blocked',
      'NEW_TAB_BLOCKED': 'New tab blocked',
      'SCREENSHOT_BLOCKED': 'Screenshot blocked',
      'DEV_TOOLS_BLOCKED': 'Developer tools blocked',
      'RIGHT_CLICK_BLOCKED': 'Right-click blocked',
      'WINDOW_BLUR_DETECTED': 'Window lost focus',
      'MULTIPLE_DISPLAYS_DETECTED': 'Multiple displays detected',
      'SUSPICIOUS_KEYBOARD_PATTERN': 'Suspicious keyboard activity',
      'LOW_BATTERY': 'Low battery warning',
      'HIGH_CPU_USAGE': 'High CPU usage detected',
      'HIGH_MEMORY_USAGE': 'High memory usage detected'
    };
    
    return typeMap[activity.type] || activity.type.replace(/_/g, ' ').toLowerCase();
  }

  updateVersionInfo() {
    const manifest = chrome.runtime.getManifest();
    document.getElementById('versionInfo').textContent = `v${manifest.version}`;
  }

  async activateMonitoring() {
    try {
      this.showLoading(true);
      
      const response = await chrome.runtime.sendMessage({
        action: 'ACTIVATE_MONITORING',
        config: this.config || {}
      });
      
      console.log('[STE Popup] Activation response:', response);

      if (response && response.success) {
        this.isActive = true;
        this.updateUI();
        this.showToast('Monitoring activated successfully', 'success');
        console.log('[STE Popup] Monitoring activated successfully');
      } else {
        const errorMsg = response?.error || 'Unknown error';
        console.error('[STE Popup] Activation failed:', errorMsg);
        this.showToast(`Failed to activate monitoring: ${errorMsg}`, 'error');
      }
    } catch (error) {
      console.error('[STE Popup] Failed to activate monitoring:', error);
      this.showToast(`Failed to activate monitoring: ${error.message}`, 'error');
    } finally {
      this.showLoading(false);
    }
  }

  async deactivateMonitoring() {
    try {
      this.showLoading(true);
      
      const response = await chrome.runtime.sendMessage({
        action: 'DEACTIVATE_MONITORING'
      });
      
      if (response.success) {
        this.isActive = false;
        this.updateUI();
        this.showToast('Monitoring deactivated', 'info');
      } else {
        this.showToast('Failed to deactivate monitoring', 'error');
      }
    } catch (error) {
      console.error('Failed to deactivate monitoring:', error);
      this.showToast('Failed to deactivate monitoring', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  openSettings() {
    chrome.tabs.create({
      url: chrome.runtime.getURL('admin/admin.html')
    });
  }

  async generateReport() {
    try {
      this.showLoading(true);
      
      const response = await chrome.runtime.sendMessage({
        action: 'GENERATE_REPORT'
      });
      
      if (response.success) {
        // Create and download report
        const blob = new Blob([JSON.stringify(response.report, null, 2)], {
          type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ste-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.showToast('Report generated successfully', 'success');
      } else {
        this.showToast('Failed to generate report', 'error');
      }
    } catch (error) {
      console.error('Failed to generate report:', error);
      this.showToast('Failed to generate report', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  openHelp() {
    chrome.tabs.create({
      url: 'https://github.com/your-repo/secure-testing-environment/wiki'
    });
  }

  startPeriodicUpdates() {
    // Update every 5 seconds
    this.updateInterval = setInterval(async () => {
      await this.loadData();
      this.updateUI();
    }, 5000);
  }

  stopPeriodicUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  showLoading(show) {
    const overlay = document.getElementById('loadingOverlay');
    overlay.style.display = show ? 'flex' : 'none';
  }

  showToast(message, type = 'info') {
    const toast = document.getElementById('notificationToast');
    const icon = document.getElementById('toastIcon');
    const messageEl = document.getElementById('toastMessage');
    
    // Set icon based on type
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
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.hideToast();
    }, 5000);
  }

  hideToast() {
    const toast = document.getElementById('notificationToast');
    toast.style.display = 'none';
  }

  // Cleanup when popup is closed
  destroy() {
    this.stopPeriodicUpdates();
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const popup = new PopupController();
  
  // Cleanup when popup is unloaded
  window.addEventListener('beforeunload', () => {
    popup.destroy();
  });
});

// Handle popup visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Popup is hidden, stop updates to save resources
    if (window.popupController) {
      window.popupController.stopPeriodicUpdates();
    }
  } else {
    // Popup is visible, resume updates
    if (window.popupController) {
      window.popupController.startPeriodicUpdates();
    }
  }
});