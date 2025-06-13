import axios from 'axios';
import { LogelseClient } from '../src/client';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LogelseClient', () => {
  let client: LogelseClient;
  const mockApiKey = 'test-api-key';
  const mockOptions = {
    appName: 'test-app',
    appUuid: 'test-uuid-123'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock axios.create to return a mock instance
    const mockAxiosInstance = {
      post: jest.fn(),
    };
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    mockedAxios.isAxiosError.mockReturnValue(false);
    
    client = new LogelseClient(mockApiKey, mockOptions);
  });

  describe('constructor', () => {
    it('should create client with valid API key and options', () => {
      expect(() => new LogelseClient(mockApiKey, mockOptions)).not.toThrow();
    });

    it('should throw error with invalid API key', () => {
      expect(() => new LogelseClient('', mockOptions)).toThrow('API key is required and must be a string');
      expect(() => new LogelseClient(null as any, mockOptions)).toThrow('API key is required and must be a string');
    });

    it('should throw error with missing appName', () => {
      expect(() => new LogelseClient(mockApiKey, { appUuid: 'test' } as any)).toThrow('appName is required and must be a string');
    });

    it('should throw error with missing appUuid', () => {
      expect(() => new LogelseClient(mockApiKey, { appName: 'test' } as any)).toThrow('appUuid is required and must be a string');
    });

    it('should use default options when none provided', () => {
      const client = new LogelseClient(mockApiKey, mockOptions);
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
        ...mockOptions,
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

  describe('log method', () => {
    it('should send log entry successfully', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.post as jest.Mock).mockResolvedValue({ status: 200 });

      await client.log('INFO', 'Test message');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/logs', expect.objectContaining({
        log_level: 'INFO',
        message: 'Test message',
        app_name: 'test-app',
        app_uuid: 'test-uuid-123',
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      }));
    });

    it('should use custom timestamp when provided', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.post as jest.Mock).mockResolvedValue({ status: 200 });

      const customTimestamp = '2024-01-01T12:00:00Z';
      await client.log('INFO', 'Test message', customTimestamp);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/logs', expect.objectContaining({
        timestamp: customTimestamp
      }));
    });

    it('should validate log level', async () => {
      await expect(client.log('', 'Test message')).rejects.toThrow('Log level is required and must be a string');
      await expect(client.log(null as any, 'Test message')).rejects.toThrow('Log level is required and must be a string');
    });

    it('should validate message', async () => {
      await expect(client.log('INFO', '')).rejects.toThrow('Message is required and must be a string');
      await expect(client.log('INFO', null as any)).rejects.toThrow('Message is required and must be a string');
    });

    it('should retry on failure', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.post as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValue({ status: 200 });

      await client.log('INFO', 'Test message');

      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retry attempts', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.post as jest.Mock).mockRejectedValue(new Error('Network error'));

      const clientWithRetries = new LogelseClient(mockApiKey, { ...mockOptions, retryAttempts: 2, retryDelay: 10 });

      await expect(clientWithRetries.log('INFO', 'Test message')).rejects.toThrow(
        'Failed to send log after 2 attempts'
      );
    });
  });

  describe('convenience methods', () => {
    beforeEach(() => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.post as jest.Mock).mockResolvedValue({ status: 200 });
    });

    it('should send debug log', async () => {
      const mockAxiosInstance = mockedAxios.create();
      await client.debug('Debug message');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/logs', expect.objectContaining({
        log_level: 'DEBUG',
        message: 'Debug message'
      }));
    });

    it('should send info log', async () => {
      const mockAxiosInstance = mockedAxios.create();
      await client.info('Info message');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/logs', expect.objectContaining({
        log_level: 'INFO',
        message: 'Info message'
      }));
    });

    it('should send warn log', async () => {
      const mockAxiosInstance = mockedAxios.create();
      await client.warn('Warning message');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/logs', expect.objectContaining({
        log_level: 'WARN',
        message: 'Warning message'
      }));
    });

    it('should send error log', async () => {
      const mockAxiosInstance = mockedAxios.create();
      await client.error('Error message');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/logs', expect.objectContaining({
        log_level: 'ERROR',
        message: 'Error message'
      }));
    });

    it('should send fatal log', async () => {
      const mockAxiosInstance = mockedAxios.create();
      await client.fatal('Fatal message');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/logs', expect.objectContaining({
        log_level: 'FATAL',
        message: 'Fatal message'
      }));
    });

    it('should accept custom timestamp in convenience methods', async () => {
      const mockAxiosInstance = mockedAxios.create();
      const customTimestamp = '2024-01-01T12:00:00Z';
      
      await client.info('Info message', customTimestamp);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/logs', expect.objectContaining({
        timestamp: customTimestamp
      }));
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

      await expect(client.log('INFO', 'Test message')).rejects.toThrow(
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

      await expect(client.log('INFO', 'Test message')).rejects.toThrow(
        'Failed to send log after 3 attempts: Network error: Network Error'
      );
    });

    it('should handle non-axios errors', async () => {
      const mockAxiosInstance = mockedAxios.create();
      (mockAxiosInstance.post as jest.Mock).mockRejectedValue(new Error('Generic error'));

      await expect(client.log('INFO', 'Test message')).rejects.toThrow(
        'Failed to send log after 3 attempts: Generic error'
      );
    });
  });
});
