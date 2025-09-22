// Page monitoring content script for Secure Testing Environment

// Cross-browser API compatibility
const getAPI = () => typeof browser !== 'undefined' ? browser : chrome;

class PageMonitor {
  constructor() {
    this.isActive = false;
    this.config = null;
    this.pageData = {
      url: window.location.href,
      title: document.title,
      loadTime: Date.now(),
      interactions: [],
      focusEvents: [],
      scrollEvents: [],
      resizeEvents: [],
      networkRequests: []
    };
    this.observers = [];
    this.init();
  }

  async init() {
    window.STELogger?.info('Page Monitor initialized');
    
    // Get configuration from background
    await this.loadConfiguration();
    
    // Set up message listener
    getAPI().runtime.onMessage.addListener(this.handleMessage.bind(this));
    
    // Start monitoring if active
    if (this.isActive) {
      this.startMonitoring();
    }
  }

  async loadConfiguration() {
    try {
      const response = await getAPI().runtime.sendMessage({ action: 'GET_STATUS' });
      this.isActive = response.isActive;
      this.config = response.config;
    } catch (error) {
      window.STELogger?.error('Failed to load configuration', error);
    }
  }

  handleMessage(request, sender, sendResponse) {
    switch (request.action) {
      case 'START_PAGE_MONITORING':
        this.startMonitoring();
        sendResponse({ success: true });
        break;
        
      case 'STOP_PAGE_MONITORING':
        this.stopMonitoring();
        sendResponse({ success: true });
        break;
        
      case 'GET_PAGE_DATA':
        sendResponse({ pageData: this.getPageData() });
        break;
        
      case 'CLEAR_PAGE_DATA':
        this.clearPageData();
        sendResponse({ success: true });
        break;
        
      default:
        sendResponse({ error: 'Unknown action' });
    }
    
    return true;
  }

  startMonitoring() {
    if (this.isActive) return;
    
    this.isActive = true;
    
    // Monitor page interactions
    this.monitorInteractions();
    
    // Monitor page visibility
    this.monitorVisibility();
    
    // Monitor page focus
    this.monitorFocus();
    
    // Monitor scrolling
    this.monitorScrolling();
    
    // Monitor window resize
    this.monitorResize();
    
    // Monitor DOM changes
    this.monitorDOMChanges();
    
    // Monitor network requests
    this.monitorNetworkRequests();
    
    // Monitor form interactions
    this.monitorFormInteractions();
    
    // Monitor media elements
    this.monitorMediaElements();
    
    window.STELogger?.info('Page monitoring started');
  }

  stopMonitoring() {
    if (!this.isActive) return;
    
    this.isActive = false;
    
    // Disconnect all observers
    this.observers.forEach(observer => {
      if (observer.disconnect) {
        observer.disconnect();
      }
    });
    this.observers = [];
    
    window.STELogger?.info('Page monitoring stopped');
  }

  monitorInteractions() {
    const events = ['click', 'dblclick', 'mousedown', 'mouseup', 'mousemove'];
    
    events.forEach(eventType => {
      const listener = (event) => {
        this.recordInteraction({
          type: eventType,
          timestamp: Date.now(),
          target: {
            tagName: event.target.tagName,
            id: event.target.id,
            className: event.target.className,
            textContent: event.target.textContent?.substring(0, 100)
          },
          coordinates: {
            clientX: event.clientX,
            clientY: event.clientY,
            pageX: event.pageX,
            pageY: event.pageY
          },
          buttons: event.buttons,
          ctrlKey: event.ctrlKey,
          altKey: event.altKey,
          shiftKey: event.shiftKey
        });
      };
      
      document.addEventListener(eventType, listener, true);
      this.observers.push({ type: 'event', eventType, listener });
    });
  }

  monitorVisibility() {
    const visibilityListener = () => {
      this.recordInteraction({
        type: 'visibility_change',
        timestamp: Date.now(),
        hidden: document.hidden,
        visibilityState: document.visibilityState
      });
      
      if (document.hidden) {
        this.logSuspiciousActivity('PAGE_HIDDEN', {
          timestamp: Date.now(),
          duration: null // Will be calculated when page becomes visible
        });
      }
    };
    
    document.addEventListener('visibilitychange', visibilityListener);
    this.observers.push({ type: 'event', eventType: 'visibilitychange', listener: visibilityListener });
  }

  monitorFocus() {
    const focusListener = () => {
      this.pageData.focusEvents.push({
        type: 'focus',
        timestamp: Date.now()
      });
    };
    
    const blurListener = () => {
      this.pageData.focusEvents.push({
        type: 'blur',
        timestamp: Date.now()
      });
      
      this.logSuspiciousActivity('WINDOW_BLUR', {
        timestamp: Date.now()
      });
    };
    
    window.addEventListener('focus', focusListener);
    window.addEventListener('blur', blurListener);
    
    this.observers.push({ type: 'event', eventType: 'focus', listener: focusListener });
    this.observers.push({ type: 'event', eventType: 'blur', listener: blurListener });
  }

  monitorScrolling() {
    let scrollTimeout;
    
    const scrollListener = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.pageData.scrollEvents.push({
          timestamp: Date.now(),
          scrollX: window.scrollX,
          scrollY: window.scrollY,
          documentHeight: document.documentElement.scrollHeight,
          windowHeight: window.innerHeight
        });
      }, 100);
    };
    
    window.addEventListener('scroll', scrollListener, { passive: true });
    this.observers.push({ type: 'event', eventType: 'scroll', listener: scrollListener });
  }

  monitorResize() {
    const resizeListener = () => {
      this.pageData.resizeEvents.push({
        timestamp: Date.now(),
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        outerWidth: window.outerWidth,
        outerHeight: window.outerHeight,
        screenWidth: screen.width,
        screenHeight: screen.height
      });
      
      // Check for suspicious resize patterns
      if (this.pageData.resizeEvents.length > 1) {
        const lastResize = this.pageData.resizeEvents[this.pageData.resizeEvents.length - 1];
        const prevResize = this.pageData.resizeEvents[this.pageData.resizeEvents.length - 2];
        
        // Detect rapid resizing (possible automation)
        if (lastResize.timestamp - prevResize.timestamp < 100) {
          this.logSuspiciousActivity('RAPID_WINDOW_RESIZE', {
            resizeEvents: this.pageData.resizeEvents.slice(-5)
          });
        }
      }
    };
    
    window.addEventListener('resize', resizeListener);
    this.observers.push({ type: 'event', eventType: 'resize', listener: resizeListener });
  }

  monitorDOMChanges() {
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Log significant DOM changes
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check for suspicious elements
              if (this.isSuspiciousElement(node)) {
                this.logSuspiciousActivity('SUSPICIOUS_DOM_ELEMENT', {
                  tagName: node.tagName,
                  id: node.id,
                  className: node.className,
                  innerHTML: node.innerHTML?.substring(0, 200)
                });
              }
            }
          });
        }
        
        // Monitor attribute changes
        if (mutation.type === 'attributes') {
          const target = mutation.target;
          if (target.tagName === 'IFRAME' || target.tagName === 'SCRIPT') {
            this.logSuspiciousActivity('SUSPICIOUS_ATTRIBUTE_CHANGE', {
              tagName: target.tagName,
              attribute: mutation.attributeName,
              oldValue: mutation.oldValue,
              newValue: target.getAttribute(mutation.attributeName)
            });
          }
        }
      });
    });
    
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ['src', 'href', 'onclick', 'onload']
    });
    
    this.observers.push(mutationObserver);
  }

  monitorNetworkRequests() {
    // Override fetch
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const url = args[0];
      const options = args[1] || {};
      
      this.recordNetworkRequest({
        type: 'fetch',
        url: url,
        method: options.method || 'GET',
        timestamp: Date.now()
      });
      
      // Check for suspicious requests
      if (this.isSuspiciousRequest(url)) {
        this.logSuspiciousActivity('SUSPICIOUS_NETWORK_REQUEST', {
          url: url,
          method: options.method || 'GET'
        });
      }
      
      return originalFetch.apply(this, args);
    };
    
    // Override XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      this._steUrl = url;
      this._steMethod = method;
      
      this.addEventListener('loadstart', () => {
        pageMonitor.recordNetworkRequest({
          type: 'xhr',
          url: url,
          method: method,
          timestamp: Date.now()
        });
        
        if (pageMonitor.isSuspiciousRequest(url)) {
          pageMonitor.logSuspiciousActivity('SUSPICIOUS_XHR_REQUEST', {
            url: url,
            method: method
          });
        }
      });
      
      return originalXHROpen.apply(this, [method, url, ...args]);
    };
  }

  monitorFormInteractions() {
    const formListener = (event) => {
      const form = event.target.closest('form');
      if (form) {
        this.recordInteraction({
          type: 'form_interaction',
          timestamp: Date.now(),
          eventType: event.type,
          formId: form.id,
          formAction: form.action,
          fieldName: event.target.name,
          fieldType: event.target.type,
          fieldValue: event.target.type === 'password' ? '[HIDDEN]' : event.target.value?.substring(0, 100)
        });
      }
    };
    
    const formEvents = ['input', 'change', 'submit', 'reset'];
    formEvents.forEach(eventType => {
      document.addEventListener(eventType, formListener, true);
      this.observers.push({ type: 'event', eventType, listener: formListener });
    });
  }

  monitorMediaElements() {
    const mediaListener = (event) => {
      if (event.target.tagName === 'VIDEO' || event.target.tagName === 'AUDIO') {
        this.recordInteraction({
          type: 'media_interaction',
          timestamp: Date.now(),
          eventType: event.type,
          mediaType: event.target.tagName.toLowerCase(),
          src: event.target.src,
          currentTime: event.target.currentTime,
          duration: event.target.duration,
          volume: event.target.volume,
          muted: event.target.muted
        });
        
        // Log media events that might be suspicious
        if (event.type === 'play' || event.type === 'pause') {
          this.logSuspiciousActivity('MEDIA_INTERACTION', {
            action: event.type,
            mediaType: event.target.tagName.toLowerCase(),
            src: event.target.src
          });
        }
      }
    };
    
    const mediaEvents = ['play', 'pause', 'ended', 'volumechange', 'seeking', 'seeked'];
    mediaEvents.forEach(eventType => {
      document.addEventListener(eventType, mediaListener, true);
      this.observers.push({ type: 'event', eventType, listener: mediaListener });
    });
  }

  recordInteraction(interaction) {
    this.pageData.interactions.push(interaction);
    
    // Keep only the most recent interactions
    if (this.pageData.interactions.length > 1000) {
      this.pageData.interactions = this.pageData.interactions.slice(-1000);
    }
  }

  recordNetworkRequest(request) {
    this.pageData.networkRequests.push(request);
    
    // Keep only the most recent requests
    if (this.pageData.networkRequests.length > 500) {
      this.pageData.networkRequests = this.pageData.networkRequests.slice(-500);
    }
  }

  isSuspiciousElement(element) {
    // Check for elements that might be used for cheating
    const suspiciousPatterns = [
      /remote.*control/i,
      /screen.*share/i,
      /team.*viewer/i,
      /vnc/i,
      /rdp/i,
      /anydesk/i,
      /getAPI().*remote/i
    ];
    
    const text = (element.textContent || element.innerHTML || '').toLowerCase();
    const className = (element.className || '').toLowerCase();
    const id = (element.id || '').toLowerCase();
    
    return suspiciousPatterns.some(pattern => 
      pattern.test(text) || pattern.test(className) || pattern.test(id)
    );
  }

  isSuspiciousRequest(url) {
    if (typeof url !== 'string') return false;
    
    const suspiciousPatterns = [
      /teamviewer/i,
      /anydesk/i,
      /chrome-remote/i,
      /vnc/i,
      /rdp/i,
      /screen.*share/i,
      /remote.*desktop/i,
      /file.*upload/i,
      /pastebin/i,
      /github\.com.*gist/i
    ];
    
    return suspiciousPatterns.some(pattern => pattern.test(url));
  }

  async logSuspiciousActivity(type, data) {
    window.STELogger?.warn(`Suspicious activity detected: ${type}`, data);
    
    try {
      await getAPI().runtime.sendMessage({
        action: 'LOG_UNAUTHORIZED_ACTION',
        type: type,
        data: {
          ...data,
          url: window.location.href,
          timestamp: Date.now(),
          pageData: this.getPageSummary()
        }
      });
    } catch (error) {
      window.STELogger?.error('Failed to log suspicious activity', error);
    }
  }

  getPageData() {
    return {
      ...this.pageData,
      currentUrl: window.location.href,
      currentTitle: document.title,
      timestamp: Date.now()
    };
  }

  getPageSummary() {
    return {
      url: window.location.href,
      title: document.title,
      loadTime: this.pageData.loadTime,
      interactionCount: this.pageData.interactions.length,
      focusEventCount: this.pageData.focusEvents.length,
      scrollEventCount: this.pageData.scrollEvents.length,
      resizeEventCount: this.pageData.resizeEvents.length,
      networkRequestCount: this.pageData.networkRequests.length,
      timeOnPage: Date.now() - this.pageData.loadTime
    };
  }

  clearPageData() {
    this.pageData = {
      url: window.location.href,
      title: document.title,
      loadTime: Date.now(),
      interactions: [],
      focusEvents: [],
      scrollEvents: [],
      resizeEvents: [],
      networkRequests: []
    };
  }

  getStatistics() {
    const now = Date.now();
    const timeOnPage = now - this.pageData.loadTime;
    
    return {
      timeOnPage: timeOnPage,
      totalInteractions: this.pageData.interactions.length,
      interactionsPerMinute: (this.pageData.interactions.length / (timeOnPage / 60000)).toFixed(2),
      focusLossCount: this.pageData.focusEvents.filter(e => e.type === 'blur').length,
      scrollDistance: this.calculateScrollDistance(),
      resizeCount: this.pageData.resizeEvents.length,
      networkRequests: this.pageData.networkRequests.length,
      suspiciousActivities: this.getSuspiciousActivitiesCount()
    };
  }

  calculateScrollDistance() {
    let totalDistance = 0;
    
    for (let i = 1; i < this.pageData.scrollEvents.length; i++) {
      const prev = this.pageData.scrollEvents[i - 1];
      const curr = this.pageData.scrollEvents[i];
      
      const distance = Math.sqrt(
        Math.pow(curr.scrollX - prev.scrollX, 2) + 
        Math.pow(curr.scrollY - prev.scrollY, 2)
      );
      
      totalDistance += distance;
    }
    
    return Math.round(totalDistance);
  }

  getSuspiciousActivitiesCount() {
    // This would be populated by the background script
    return this.pageData.interactions.filter(i => 
      i.type.includes('suspicious') || i.type.includes('blocked')
    ).length;
  }
}

// Initialize page monitor
const pageMonitor = new PageMonitor();

// Export for external access
window.STEPageMonitor = pageMonitor;