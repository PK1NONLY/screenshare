// System monitoring utilities for Secure Testing Environment

class SystemMonitor {
  constructor() {
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.systemData = {
      cpu: { usage: 0 },
      memory: { usage: 0, total: 0 },
      battery: { level: 1, charging: false },
      displays: [],
      runningProcesses: [],
      networkConnections: []
    };
  }

  async startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    console.log('System monitoring started');
    
    // Initial system info gathering
    await this.gatherSystemInfo();
    
    // Set up periodic monitoring
    this.monitoringInterval = setInterval(async () => {
      await this.gatherSystemInfo();
      await this.checkSystemSecurity();
    }, 2000); // Monitor every 2 seconds
  }

  stopMonitoring() {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    console.log('System monitoring stopped');
  }

  async gatherSystemInfo() {
    try {
      // CPU usage
      await this.getCPUInfo();
      
      // Memory usage
      await this.getMemoryInfo();
      
      // Battery status
      await this.getBatteryInfo();
      
      // Display information
      await this.getDisplayInfo();
      
      // Running processes (limited by Chrome API)
      await this.getProcessInfo();
      
    } catch (error) {
      console.error('Error gathering system info:', error);
    }
  }

  async getCPUInfo() {
    try {
      const cpuInfo = await chrome.system.cpu.getInfo();
      
      // Calculate average CPU usage
      let totalUsage = 0;
      cpuInfo.processors.forEach(processor => {
        const usage = processor.usage;
        const total = usage.user + usage.kernel + usage.idle + usage.total;
        const activeTime = total - usage.idle;
        totalUsage += (activeTime / total) * 100;
      });
      
      this.systemData.cpu = {
        usage: totalUsage / cpuInfo.processors.length,
        processors: cpuInfo.processors.length,
        modelName: cpuInfo.modelName,
        archName: cpuInfo.archName
      };
      
    } catch (error) {
      console.error('Failed to get CPU info:', error);
    }
  }

  async getMemoryInfo() {
    try {
      const memoryInfo = await chrome.system.memory.getInfo();
      
      this.systemData.memory = {
        total: memoryInfo.capacity,
        available: memoryInfo.availableCapacity,
        usage: ((memoryInfo.capacity - memoryInfo.availableCapacity) / memoryInfo.capacity) * 100
      };
      
    } catch (error) {
      console.error('Failed to get memory info:', error);
    }
  }

  async getBatteryInfo() {
    try {
      if ('getBattery' in navigator) {
        const battery = await navigator.getBattery();
        
        this.systemData.battery = {
          level: battery.level,
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime
        };
        
        // Set up battery event listeners
        battery.addEventListener('levelchange', () => {
          this.systemData.battery.level = battery.level;
          this.checkBatteryLevel();
        });
        
        battery.addEventListener('chargingchange', () => {
          this.systemData.battery.charging = battery.charging;
        });
      }
    } catch (error) {
      console.error('Failed to get battery info:', error);
    }
  }

  async getDisplayInfo() {
    try {
      const displays = await chrome.system.display.getInfo();
      
      this.systemData.displays = displays.map(display => ({
        id: display.id,
        name: display.name,
        isPrimary: display.isPrimary,
        isInternal: display.isInternal,
        bounds: display.bounds,
        workArea: display.workArea,
        overscan: display.overscan
      }));
      
    } catch (error) {
      console.error('Failed to get display info:', error);
    }
  }

  async getProcessInfo() {
    try {
      // Chrome extension API has limited access to system processes
      // We can only get Chrome-related processes
      const processes = await chrome.processes.getProcessInfo([], true);
      
      this.systemData.runningProcesses = Object.values(processes).map(process => ({
        id: process.id,
        type: process.type,
        cpu: process.cpu,
        memory: process.memory,
        title: process.title || 'Unknown'
      }));
      
    } catch (error) {
      console.error('Failed to get process info:', error);
    }
  }

  async checkSystemSecurity() {
    const securityIssues = [];
    
    // Check for multiple displays
    if (this.systemData.displays.length > 1) {
      securityIssues.push({
        type: 'MULTIPLE_DISPLAYS',
        severity: 'HIGH',
        message: `${this.systemData.displays.length} displays detected`,
        data: this.systemData.displays
      });
    }
    
    // Check CPU usage (high usage might indicate unauthorized processes)
    if (this.systemData.cpu.usage > 80) {
      securityIssues.push({
        type: 'HIGH_CPU_USAGE',
        severity: 'MEDIUM',
        message: `CPU usage is ${this.systemData.cpu.usage.toFixed(1)}%`,
        data: this.systemData.cpu
      });
    }
    
    // Check memory usage
    if (this.systemData.memory.usage > 90) {
      securityIssues.push({
        type: 'HIGH_MEMORY_USAGE',
        severity: 'MEDIUM',
        message: `Memory usage is ${this.systemData.memory.usage.toFixed(1)}%`,
        data: this.systemData.memory
      });
    }
    
    // Check battery level
    if (this.systemData.battery.level < 0.2) {
      securityIssues.push({
        type: 'LOW_BATTERY',
        severity: 'LOW',
        message: `Battery level is ${(this.systemData.battery.level * 100).toFixed(0)}%`,
        data: this.systemData.battery
      });
    }
    
    // Report security issues
    if (securityIssues.length > 0) {
      await this.reportSecurityIssues(securityIssues);
    }
  }

  async checkBatteryLevel() {
    const batteryLevel = this.systemData.battery.level * 100;
    
    if (batteryLevel < 50 && !this.systemData.battery.charging) {
      // Send message to content scripts to notify the integrated page
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, {
            action: 'BATTERY_WARNING',
            level: batteryLevel,
            charging: this.systemData.battery.charging
          }).catch(() => {
            // Ignore errors for tabs that don't have our content script
          });
        });
      });
      
      // Also show browser notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Low Battery Warning',
        message: `Battery level is ${batteryLevel.toFixed(0)}%. Please connect charger to continue the test.`
      });
    }
  }

  async reportSecurityIssues(issues) {
    // Send to main service worker
    if (self.secureTestingService) {
      for (const issue of issues) {
        await self.secureTestingService.logUnauthorizedAction(issue.type, {
          severity: issue.severity,
          message: issue.message,
          data: issue.data,
          timestamp: Date.now()
        });
      }
    }
  }

  async detectScreenSharing() {
    try {
      // Check if screen is being captured
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false
      });
      
      // If we get here, screen sharing is active
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      // Screen sharing not active or permission denied
      return false;
    }
  }

  async detectBluetoothDevices() {
    try {
      if ('bluetooth' in navigator) {
        const devices = await navigator.bluetooth.getDevices();
        return devices.length > 0;
      }
      return false;
    } catch (error) {
      return false;
    }
  }

  async getNetworkInfo() {
    try {
      // Check network connection
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (connection) {
        return {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        };
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get network info:', error);
      return null;
    }
  }

  getSystemData() {
    return { ...this.systemData };
  }

  async generateSystemReport() {
    await this.gatherSystemInfo();
    
    return {
      timestamp: Date.now(),
      system: this.systemData,
      security: {
        multipleDisplays: this.systemData.displays.length > 1,
        highCpuUsage: this.systemData.cpu.usage > 80,
        highMemoryUsage: this.systemData.memory.usage > 90,
        lowBattery: this.systemData.battery.level < 0.5,
        screenSharingDetected: await this.detectScreenSharing(),
        bluetoothDevicesDetected: await this.detectBluetoothDevices()
      },
      network: await this.getNetworkInfo()
    };
  }
}

// Create global instance
const systemMonitor = new SystemMonitor();

// Export for use in service worker
self.systemMonitor = systemMonitor;