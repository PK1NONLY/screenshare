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

  async getSystemInfo() {
    await this.gatherSystemInfo();
    
    const info = {
      timestamp: Date.now(),
      cpu: this.systemData.cpu,
      memory: this.systemData.memory,
      battery: this.systemData.battery,
      displays: this.systemData.displays,
      processes: this.systemData.runningProcesses,
      network: await this.getNetworkInfo(),
      virtualMachine: await this.detectVirtualMachine()
    };

    // Check for low battery
    if (info.battery.level < 0.5 && info.battery.charging === false) {
      this.notifyLowBattery(info.battery.level);
    }

    // Check for virtual machine
    if (info.virtualMachine.isVirtual) {
      this.notifyVirtualMachine(info.virtualMachine);
    }

    return info;
  }

  async detectVirtualMachine() {
    const vmIndicators = {
      isVirtual: false,
      confidence: 0,
      indicators: [],
      details: {}
    };

    try {
      // Check user agent for VM indicators
      const userAgent = navigator.userAgent.toLowerCase();
      const vmUserAgentPatterns = [
        'virtualbox', 'vmware', 'parallels', 'qemu', 'kvm', 
        'xen', 'hyper-v', 'vbox', 'vm'
      ];

      for (const pattern of vmUserAgentPatterns) {
        if (userAgent.includes(pattern)) {
          vmIndicators.indicators.push(`User agent contains: ${pattern}`);
          vmIndicators.confidence += 20;
        }
      }

      // Check hardware concurrency (VMs often have limited cores)
      const cores = navigator.hardwareConcurrency;
      if (cores <= 2) {
        vmIndicators.indicators.push(`Low CPU cores: ${cores}`);
        vmIndicators.confidence += 10;
      }

      // Check memory (VMs often have limited memory)
      if (this.systemData.memory.total < 4 * 1024 * 1024 * 1024) { // Less than 4GB
        vmIndicators.indicators.push(`Low memory: ${(this.systemData.memory.total / (1024*1024*1024)).toFixed(1)}GB`);
        vmIndicators.confidence += 15;
      }

      // Check screen resolution patterns common in VMs
      const screen = window.screen;
      const commonVMResolutions = [
        '1024x768', '800x600', '1280x1024', '1366x768'
      ];
      const currentRes = `${screen.width}x${screen.height}`;
      
      if (commonVMResolutions.includes(currentRes)) {
        vmIndicators.indicators.push(`Common VM resolution: ${currentRes}`);
        vmIndicators.confidence += 10;
      }

      // Check for VM-specific GPU/graphics indicators
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      
      if (gl) {
        const renderer = gl.getParameter(gl.RENDERER).toLowerCase();
        const vmGpuPatterns = [
          'vmware', 'virtualbox', 'parallels', 'qemu', 'microsoft basic render'
        ];

        for (const pattern of vmGpuPatterns) {
          if (renderer.includes(pattern)) {
            vmIndicators.indicators.push(`VM GPU detected: ${renderer}`);
            vmIndicators.confidence += 25;
          }
        }
      }

      // Check timezone (VMs often have UTC or specific timezone patterns)
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone === 'UTC' || timezone.includes('Generic')) {
        vmIndicators.indicators.push(`Suspicious timezone: ${timezone}`);
        vmIndicators.confidence += 5;
      }

      // Check for VM-specific browser features
      if (navigator.plugins.length === 0) {
        vmIndicators.indicators.push('No browser plugins detected');
        vmIndicators.confidence += 10;
      }

      // Check performance characteristics
      const start = performance.now();
      for (let i = 0; i < 100000; i++) {
        Math.random();
      }
      const executionTime = performance.now() - start;
      
      if (executionTime > 50) { // Slow execution might indicate VM
        vmIndicators.indicators.push(`Slow execution time: ${executionTime.toFixed(2)}ms`);
        vmIndicators.confidence += 10;
      }

      // Determine if it's likely a VM
      vmIndicators.isVirtual = vmIndicators.confidence >= 30;
      vmIndicators.details = {
        userAgent: navigator.userAgent,
        cores: cores,
        memory: this.systemData.memory.total,
        resolution: currentRes,
        timezone: timezone,
        plugins: navigator.plugins.length,
        executionTime: executionTime
      };

    } catch (error) {
      console.error('Error detecting virtual machine:', error);
      vmIndicators.error = error.message;
    }

    return vmIndicators;
  }

  async notifyLowBattery(level) {
    const batteryLevel = level * 100;
    
    // Send message to content scripts
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
    
    // Show browser notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Low Battery Warning',
      message: `Battery level is ${batteryLevel.toFixed(0)}%. Please connect charger to continue the test.`
    });
  }

  async notifyVirtualMachine(vmInfo) {
    // Log the VM detection
    if (self.secureTestingService) {
      await self.secureTestingService.logUnauthorizedAction('VIRTUAL_MACHINE_DETECTED', {
        confidence: vmInfo.confidence,
        indicators: vmInfo.indicators,
        details: vmInfo.details,
        severity: 'HIGH',
        timestamp: Date.now()
      });
    }

    // Send message to content scripts
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'VIRTUAL_MACHINE_DETECTED',
          confidence: vmInfo.confidence,
          indicators: vmInfo.indicators
        }).catch(() => {
          // Ignore errors for tabs that don't have our content script
        });
      });
    });
    
    // Show critical notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Virtual Machine Detected',
      message: `Virtual machine detected with ${vmInfo.confidence}% confidence. This may violate test security policies.`,
      priority: 2
    });
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