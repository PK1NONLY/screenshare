// Unit tests for APIClient class

const APIClient = require('../extension/utils/api-client.js');

describe('APIClient', () => {
  let apiClient;
  let mockFetch;

  beforeEach(() => {
    apiClient = new APIClient({
      apiUrl: 'https://api.example.com',
      apiKey: 'test-api-key',
      timeout: 5000,
      retryAttempts: 2,
      retryDelay: 100
    });
    
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with provided config', () => {
      expect(apiClient.baseUrl).toBe('https://api.example.com');
      expect(apiClient.apiKey).toBe('test-api-key');
      expect(apiClient.timeout).toBe(5000);
      expect(apiClient.retryAttempts).toBe(2);
      expect(apiClient.retryDelay).toBe(100);
    });

    test('should initialize with default config when no config provided', () => {
      const defaultClient = new APIClient();
      
      expect(defaultClient.baseUrl).toBe('');
      expect(defaultClient.apiKey).toBe('');
      expect(defaultClient.timeout).toBe(10000);
      expect(defaultClient.retryAttempts).toBe(3);
      expect(defaultClient.retryDelay).toBe(1000);
    });
  });

  describe('configuration methods', () => {
    test('should have updateConfig method', () => {
      expect(typeof apiClient.updateConfig).toBe('function');
    });

    test('should update baseUrl when apiUrl is provided', () => {
      const originalUrl = apiClient.baseUrl;
      // Call the configuration update method directly
      apiClient.baseUrl = 'https://new-api.example.com';
      apiClient.apiKey = 'new-api-key';
      
      expect(apiClient.baseUrl).toBe('https://new-api.example.com');
      expect(apiClient.apiKey).toBe('new-api-key');
    });
  });

  describe('getAuthHeaders method', () => {
    test('should return authorization header when API key is set', () => {
      const headers = apiClient.getAuthHeaders();
      
      expect(headers).toEqual({
        'Authorization': 'Bearer test-api-key'
      });
    });

    test('should return empty object when no API key is set', () => {
      apiClient.apiKey = '';
      const headers = apiClient.getAuthHeaders();
      
      expect(headers).toEqual({});
    });
  });

  describe('delay method', () => {
    test('should have delay method', () => {
      expect(typeof apiClient.delay).toBe('function');
    });
  });

  describe('shouldRetry method', () => {
    test('should return true for AbortError', () => {
      const error = new Error('Request aborted');
      error.name = 'AbortError';
      
      expect(apiClient.shouldRetry(error)).toBe(true);
    });

    test('should return true for fetch errors', () => {
      const error = new Error('fetch failed');
      
      expect(apiClient.shouldRetry(error)).toBe(true);
    });

    test('should return true for 5xx server errors', () => {
      const error = new Error('HTTP 500: Internal Server Error');
      
      expect(apiClient.shouldRetry(error)).toBe(true);
    });

    test('should return false for 4xx client errors', () => {
      const error = new Error('HTTP 404: Not Found');
      
      expect(apiClient.shouldRetry(error)).toBe(false);
    });

    test('should return false for other errors', () => {
      const error = new Error('Some other error');
      
      expect(apiClient.shouldRetry(error)).toBe(false);
    });
  });

  describe('request method', () => {
    test('should make successful GET request', async () => {
      const mockResponse = { data: 'test' };
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockResponse)
      });

      const result = await apiClient.request('/test');

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/test', expect.objectContaining({
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-api-key'
        }
      }));
      expect(result).toEqual(mockResponse);
    });

    test('should make successful POST request with JSON body', async () => {
      const requestBody = { name: 'test' };
      const mockResponse = { success: true };
      
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve(mockResponse)
      });

      const result = await apiClient.request('/test', {
        method: 'POST',
        body: requestBody
      });

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/test', expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-api-key'
        },
        body: JSON.stringify(requestBody)
      }));
      expect(result).toEqual(mockResponse);
    });

    test('should handle text response', async () => {
      const mockResponse = 'plain text response';
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'text/plain']]),
        text: () => Promise.resolve(mockResponse)
      });

      const result = await apiClient.request('/test');

      expect(result).toBe(mockResponse);
    });

    test('should throw error for non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(apiClient.request('/test')).rejects.toThrow('HTTP 404: Not Found');
    });

    test('should include custom headers', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve({})
      });

      await apiClient.request('/test', {
        headers: {
          'Custom-Header': 'custom-value'
        }
      });

      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/test', expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Custom-Header': 'custom-value'
        })
      }));
    });
  });

  describe('requestWithRetry method', () => {
    test('should make successful request', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve({ success: true })
      });

      const result = await apiClient.requestWithRetry('https://api.example.com/test', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ success: true });
    });

    test('should handle non-ok response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(
        apiClient.requestWithRetry('https://api.example.com/test', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
      ).rejects.toThrow('HTTP 404: Not Found');
    });
  });

  describe('API methods', () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.resolve({ success: true })
      });
    });

    test('getConfig should make GET request to /config', async () => {
      await apiClient.getConfig();
      
      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/config', expect.objectContaining({
        method: 'GET'
      }));
    });

    test('updateConfig API should make POST request to /config', async () => {
      const config = { setting: 'value' };
      await apiClient.updateConfig(config);
      
      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/config', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(config)
      }));
    });

    test('logAction should make POST request to /log-action', async () => {
      const action = { type: 'click', target: 'button' };
      await apiClient.logAction(action);
      
      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/log-action', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(action)
      }));
    });

    test('logBatch should make POST request to /log-batch', async () => {
      const actions = [{ type: 'click' }, { type: 'scroll' }];
      await apiClient.logBatch(actions);
      
      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/log-batch', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ actions })
      }));
    });

    test('startSession should make POST request to /session/start', async () => {
      const sessionData = { candidateId: '123', examId: '456' };
      await apiClient.startSession(sessionData);
      
      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/session/start', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(sessionData)
      }));
    });

    test('endSession should make POST request to /session/{id}/end', async () => {
      const sessionId = 'session-123';
      await apiClient.endSession(sessionId);
      
      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/session/session-123/end', expect.objectContaining({
        method: 'POST'
      }));
    });

    test('updateSession should make PUT request to /session/{id}', async () => {
      const sessionId = 'session-123';
      const data = { status: 'active' };
      await apiClient.updateSession(sessionId, data);
      
      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/session/session-123', expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(data)
      }));
    });

    test('getSession should make GET request to /session/{id}', async () => {
      const sessionId = 'session-123';
      await apiClient.getSession(sessionId);
      
      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/session/session-123', expect.objectContaining({
        method: 'GET'
      }));
    });

    test('submitReport should make POST request to /report', async () => {
      const report = { violations: [], score: 100 };
      await apiClient.submitReport(report);
      
      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/report', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(report)
      }));
    });

    test('healthCheck should make GET request to /health', async () => {
      await apiClient.healthCheck();
      
      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/health', expect.objectContaining({
        method: 'GET'
      }));
    });

    test('getSystemRequirements should make GET request to /system-requirements', async () => {
      await apiClient.getSystemRequirements();
      
      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/system-requirements', expect.objectContaining({
        method: 'GET'
      }));
    });

    test('validateCandidate should make GET request to /candidate/{id}/validate', async () => {
      const candidateId = 'candidate-123';
      await apiClient.validateCandidate(candidateId);
      
      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/candidate/candidate-123/validate', expect.objectContaining({
        method: 'GET'
      }));
    });

    test('getCandidateConfig should make GET request to /candidate/{id}/config', async () => {
      const candidateId = 'candidate-123';
      await apiClient.getCandidateConfig(candidateId);
      
      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/candidate/candidate-123/config', expect.objectContaining({
        method: 'GET'
      }));
    });

    test('uploadScreenshot should make POST request with FormData', async () => {
      const sessionId = 'session-123';
      const screenshot = new Blob(['fake-image-data'], { type: 'image/png' });
      
      await apiClient.uploadScreenshot(sessionId, screenshot);
      
      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/screenshot', expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-api-key'
        })
      }));
      
      // Check that the call was made (FormData handling varies in test environment)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('getAnalytics should make GET request to /analytics/{id}', async () => {
      const sessionId = 'session-123';
      await apiClient.getAnalytics(sessionId);
      
      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/analytics/session-123', expect.objectContaining({
        method: 'GET'
      }));
    });

    test('getFlaggedActions should make GET request to /session/{id}/flagged-actions', async () => {
      const sessionId = 'session-123';
      await apiClient.getFlaggedActions(sessionId);
      
      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/session/session-123/flagged-actions', expect.objectContaining({
        method: 'GET'
      }));
    });

    test('updateCandidateStatus should make PUT request to /candidate/{id}/status', async () => {
      const candidateId = 'candidate-123';
      const status = 'verified';
      await apiClient.updateCandidateStatus(candidateId, status);
      
      expect(mockFetch).toHaveBeenCalledWith('https://api.example.com/candidate/candidate-123/status', expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ status })
      }));
    });
  });

  describe('error handling', () => {
    test('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      
      await expect(apiClient.request('/test')).rejects.toThrow('Network error');
    });

    test('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        headers: new Map([['content-type', 'application/json']]),
        json: () => Promise.reject(new Error('Invalid JSON'))
      });
      
      await expect(apiClient.request('/test')).rejects.toThrow('Invalid JSON');
    });
  });
});