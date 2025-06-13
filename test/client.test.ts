import axios from 'axios';
import { LogelseClient } from '../src/client';
import { LogEntry } from '../src/types';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LogelseClient', () => {
  let client: LogelseClient;
  const mockApiKey = 'test-api-key';
  const mockLogEntry: LogEntry = {
    timestamp: '2026-06-03T18:04:05Z',
    log_level: 'INFO',
    message: 'Test log message',
    app_name: 'Test App',
    app_uuid: 'test-uuid-123',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock axios.create to return a mock instance
    const mockAxiosInstance = {
      post: jest.fn(),
    };
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    mockedAxios.isAxiosError.mockReturnValue(false);
    
    client = new LogelseClient(mockApiKey);
  });

  describe('constructor', () => {
    it('should create client with valid API key', () => {
      expect(() => new LogelseClient(mockApiKey)).not.toThrow();
    });

    it('should throw error with invalid API key', () => {
      expect(() => new LogelseClient('')).toThrow('API key is required and must be a string');
      expect(() => new LogelseClient(null as any)).toThrow('API key is required and must be a string');
    });

    it('should use default options when none provided', () => {
      const client = new LogelseClient(mockApiKey);
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://ingst.logelse.com',
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': mockApiKey,
        },
      });
    });

    it('should use custom options when provided', () => {
      const customOptions = {
        baseUrl: 'https://custom.api.com',
        timeout: 10000,
        retryAttempts: 5,
        retryDelay: 2000,
        debug: true,
      };
      
      new LogelseClient(mockApiKey, customOptions);
      
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://custom.api.com',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': mockApiKey,
        },
      });
    });
  });

  describe('log', () => {
    it('should send log entry successfully', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.post as jest.Mock).mockResolvedValue({ status: 200 });

      await client.log(mockLogEntry);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/logs', mockLogEntry);
    });

    it('should validate log entry before sending', async () => {
      const invalidEntry = { ...mockLogEntry, timestamp: '' };

      await expect(client.log(invalidEntry)).rejects.toThrow(
        "Field 'timestamp' is required and must be a string"
      );
    });

    it('should retry on failure', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.post as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({ status: 200 });

      await client.log(mockLogEntry);

      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retry attempts', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.post as jest.Mock).mockRejectedValue(new Error('Network error'));

      const clientWithRetries = new LogelseClient(mockApiKey, { retryAttempts: 2, retryDelay: 10 });

      await expect(clientWithRetries.log(mockLogEntry)).rejects.toThrow(
        'Failed to send log after 2 attempts'
      );
    });
  });

  describe('logBatch', () => {
    it('should send multiple log entries', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.post as jest.Mock).mockResolvedValue({ status: 200 });

      const entries = [mockLogEntry, { ...mockLogEntry, message: 'Second message' }];
      await client.logBatch(entries);

      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
    });

    it('should throw error for empty array', async () => {
      await expect(client.logBatch([])).rejects.toThrow('Entries must be a non-empty array');
    });

    it('should validate all entries before sending', async () => {
      const entries = [
        mockLogEntry,
        { ...mockLogEntry, app_name: '' }, // Invalid entry
      ];

      await expect(client.logBatch(entries)).rejects.toThrow(
        "Invalid log entry at index 1: Field 'app_name' is required and must be a string"
      );
    });
  });

  describe('createLogEntry', () => {
    it('should create log entry with current timestamp', () => {
      const entry = client.createLogEntry('INFO', 'Test message', 'Test App', 'test-uuid');

      expect(entry).toEqual({
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        log_level: 'INFO',
        message: 'Test message',
        app_name: 'Test App',
        app_uuid: 'test-uuid',
      });
    });
  });

  describe('logMessage', () => {
    it('should create and send log entry', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.post as jest.Mock).mockResolvedValue({ status: 200 });

      await client.logMessage('ERROR', 'Error message', 'Test App', 'test-uuid');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/logs', expect.objectContaining({
        log_level: 'ERROR',
        message: 'Error message',
        app_name: 'Test App',
        app_uuid: 'test-uuid',
      }));
    });
  });

  describe('validation', () => {
    const testCases = [
      { field: 'timestamp', value: '', error: "Field 'timestamp' is required and must be a string" },
      { field: 'log_level', value: '', error: "Field 'log_level' is required and must be a string" },
      { field: 'message', value: '', error: "Field 'message' is required and must be a string" },
      { field: 'app_name', value: '', error: "Field 'app_name' is required and must be a string" },
      { field: 'app_uuid', value: '', error: "Field 'app_uuid' is required and must be a string" },
    ];

    testCases.forEach(({ field, value, error }) => {
      it(`should validate ${field} field`, async () => {
        const invalidEntry = { ...mockLogEntry, [field]: value };
        await expect(client.log(invalidEntry)).rejects.toThrow(error);
      });
    });

    it('should validate timestamp format', async () => {
      const invalidEntry = { ...mockLogEntry, timestamp: 'invalid-date' };
      await expect(client.log(invalidEntry)).rejects.toThrow(
        'Timestamp must be a valid ISO 8601 date string'
      );
    });

    it('should reject non-object entries', async () => {
      await expect(client.log(null as any)).rejects.toThrow('Log entry must be an object');
      await expect(client.log('string' as any)).rejects.toThrow('Log entry must be an object');
    });
  });

  describe('error handling', () => {
    it('should handle axios errors with response', async () => {
      const mockAxiosInstance = mockedAxios.create();
      const axiosError = {
        response: {
          status: 400,
          data: { message: 'Bad Request' },
        },
        request: {},
        message: 'Request failed',
      };

      mockedAxios.isAxiosError.mockReturnValue(true);
      (mockAxiosInstance.post as jest.Mock).mockRejectedValue(axiosError);

      await expect(client.log(mockLogEntry)).rejects.toThrow(
        'Failed to send log after 3 attempts: HTTP 400: Bad Request'
      );
    });

    it('should handle axios errors without response', async () => {
      const mockAxiosInstance = mockedAxios.create();
      const axiosError = {
        request: {},
        message: 'Network Error',
      };

      mockedAxios.isAxiosError.mockReturnValue(true);
      (mockAxiosInstance.post as jest.Mock).mockRejectedValue(axiosError);

      await expect(client.log(mockLogEntry)).rejects.toThrow(
        'Failed to send log after 3 attempts: Network error: Network Error'
      );
    });

    it('should handle non-axios errors', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.post as jest.Mock).mockRejectedValue(new Error('Generic error'));

      await expect(client.log(mockLogEntry)).rejects.toThrow(
        'Failed to send log after 3 attempts: Generic error'
      );
    });
  });
});
