// API client utility for backend communication

class APIClient {
  constructor(config = {}) {
    this.baseUrl = config.apiUrl || '';
    this.apiKey = config.apiKey || '';
    this.timeout = config.timeout || 10000;
    this.retryAttempts = config.retryAttempts || 3;
    this.retryDelay = config.retryDelay || 1000;
  }

  updateConfig(config) {
    this.baseUrl = config.apiUrl || this.baseUrl;
    this.apiKey = config.apiKey || this.apiKey;
    this.timeout = config.timeout || this.timeout;
    this.retryAttempts = config.retryAttempts || this.retryAttempts;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers
      },
      ...options
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    return this.requestWithRetry(url, config);
  }

  async requestWithRetry(url, config, attempt = 1) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        ...config,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      if (attempt < this.retryAttempts && this.shouldRetry(error)) {
        console.warn(`Request failed (attempt ${attempt}/${this.retryAttempts}):`, error.message);
        await this.delay(this.retryDelay * attempt);
        return this.requestWithRetry(url, config, attempt + 1);
      } else {
        throw error;
      }
    }
  }

  shouldRetry(error) {
    // Retry on network errors, timeouts, and 5xx server errors
    return error.name === 'AbortError' || 
           error.message.includes('fetch') ||
           error.message.includes('5');
  }

  getAuthHeaders() {
    if (this.apiKey) {
      return { 'Authorization': `Bearer ${this.apiKey}` };
    }
    return {};
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // API Methods

  async getConfig() {
    return this.request('/config');
  }

  async updateConfig(config) {
    return this.request('/config', {
      method: 'POST',
      body: config
    });
  }

  async logAction(action) {
    return this.request('/log-action', {
      method: 'POST',
      body: action
    });
  }

  async logBatch(actions) {
    return this.request('/log-batch', {
      method: 'POST',
      body: { actions }
    });
  }

  async startSession(sessionData) {
    return this.request('/session/start', {
      method: 'POST',
      body: sessionData
    });
  }

  async endSession(sessionId) {
    return this.request(`/session/${sessionId}/end`, {
      method: 'POST'
    });
  }

  async updateSession(sessionId, data) {
    return this.request(`/session/${sessionId}`, {
      method: 'PUT',
      body: data
    });
  }

  async getSession(sessionId) {
    return this.request(`/session/${sessionId}`);
  }

  async submitReport(report) {
    return this.request('/report', {
      method: 'POST',
      body: report
    });
  }

  async healthCheck() {
    return this.request('/health');
  }

  async getSystemRequirements() {
    return this.request('/system-requirements');
  }

  async validateCandidate(candidateId) {
    return this.request(`/candidate/${candidateId}/validate`);
  }

  async getCandidateConfig(candidateId) {
    return this.request(`/candidate/${candidateId}/config`);
  }

  async uploadScreenshot(sessionId, screenshot) {
    const formData = new FormData();
    formData.append('screenshot', screenshot);
    formData.append('sessionId', sessionId);
    formData.append('timestamp', Date.now().toString());

    return this.request('/screenshot', {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData
        ...this.getAuthHeaders()
      }
    });
  }

  async getAnalytics(sessionId) {
    return this.request(`/analytics/${sessionId}`);
  }

  async getFlaggedActions(sessionId) {
    return this.request(`/session/${sessionId}/flagged-actions`);
  }

  async updateCandidateStatus(candidateId, status) {
    return this.request(`/candidate/${candidateId}/status`, {
      method: 'PUT',
      body: { status }
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APIClient;
} else {
  window.APIClient = APIClient;
}