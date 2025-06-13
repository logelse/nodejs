import axios, { AxiosInstance, AxiosError } from 'axios';
import { LogEntry, LogelseClientOptions, LogLevel } from './types';

/**
 * Logelse SDK Client for sending logs to the Logelse API
 */
export class LogelseClient {
  private readonly apiKey: string;
  private readonly appName: string;
  private readonly appUuid: string;
  private readonly httpClient: AxiosInstance;
  private readonly options: Required<Omit<LogelseClientOptions, 'appName' | 'appUuid'>>;

  /**
   * Creates a new Logelse client instance
   * @param apiKey - Your Logelse API key
   * @param options - Configuration options including appName and appUuid
   */
  constructor(apiKey: string, options: LogelseClientOptions) {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('API key is required and must be a string');
    }

    if (!options.appName || typeof options.appName !== 'string') {
      throw new Error('appName is required and must be a string');
    }

    if (!options.appUuid || typeof options.appUuid !== 'string') {
      throw new Error('appUuid is required and must be a string');
    }

    this.apiKey = apiKey;
    this.appName = options.appName;
    this.appUuid = options.appUuid;
    
    this.options = {
      baseUrl: options.baseUrl || 'https://ingst.logelse.com',
      timeout: options.timeout || 5000,
      retryAttempts: options.retryAttempts || 3,
      retryDelay: options.retryDelay || 1000,
      debug: options.debug || false,
    };

    this.httpClient = axios.create({
      baseURL: this.options.baseUrl,
      timeout: this.options.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': this.apiKey,
      },
    });
  }

  /**
   * Sends a log message to the Logelse API
   * @param level - Log level (DEBUG, INFO, WARN, ERROR, FATAL)
   * @param message - Log message
   * @param timestamp - Optional timestamp (defaults to current time)
   * @returns Promise that resolves when the log is sent successfully
   */
  async log(level: LogLevel | string, message: string, timestamp?: string): Promise<void> {
    if (!level || typeof level !== 'string') {
      throw new Error('Log level is required and must be a string');
    }

    if (!message || typeof message !== 'string') {
      throw new Error('Message is required and must be a string');
    }

    const entry: LogEntry = {
      timestamp: timestamp || new Date().toISOString(),
      log_level: level,
      message,
      app_name: this.appName,
      app_uuid: this.appUuid,
    };

    await this.sendWithRetry('/logs', entry);
  }

  /**
   * Convenience methods for different log levels
   */
  async debug(message: string, timestamp?: string): Promise<void> {
    await this.log('DEBUG', message, timestamp);
  }

  async info(message: string, timestamp?: string): Promise<void> {
    await this.log('INFO', message, timestamp);
  }

  async warn(message: string, timestamp?: string): Promise<void> {
    await this.log('WARN', message, timestamp);
  }

  async error(message: string, timestamp?: string): Promise<void> {
    await this.log('ERROR', message, timestamp);
  }

  async fatal(message: string, timestamp?: string): Promise<void> {
    await this.log('FATAL', message, timestamp);
  }

  /**
   * Sends a request with retry logic
   * @param endpoint - API endpoint
   * @param data - Data to send
   */
  private async sendWithRetry(endpoint: string, data: any): Promise<void> {
    let lastError: Error = new Error('Unknown error');

    for (let attempt = 1; attempt <= this.options.retryAttempts; attempt++) {
      try {
        if (this.options.debug) {
          console.log(`[Logelse] Attempt ${attempt}/${this.options.retryAttempts} - Sending log to ${endpoint}`);
        }

        const response = await this.httpClient.post(endpoint, data);
        
        if (this.options.debug) {
          console.log(`[Logelse] Log sent successfully:`, response.status);
        }

        return; // Success
      } catch (error) {
        lastError = this.handleError(error);

        if (attempt < this.options.retryAttempts) {
          if (this.options.debug) {
            console.log(`[Logelse] Attempt ${attempt} failed, retrying in ${this.options.retryDelay}ms...`);
          }
          await this.delay(this.options.retryDelay);
        }
      }
    }

    // All attempts failed
    throw new Error(`Failed to send log after ${this.options.retryAttempts} attempts: ${lastError.message}`);
  }

  /**
   * Handles and formats errors from HTTP requests
   * @param error - The error to handle
   * @returns Formatted error
   */
  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      
      if (axiosError.response) {
        // Server responded with error status
        const status = axiosError.response.status;
        const data = axiosError.response.data as any;
        
        if (data && data.message) {
          return new Error(`HTTP ${status}: ${data.message}`);
        }
        
        return new Error(`HTTP ${status}: ${axiosError.message}`);
      } else if (axiosError.request) {
        // Request was made but no response received
        return new Error(`Network error: ${axiosError.message}`);
      }
    }

    return error instanceof Error ? error : new Error(String(error));
  }

  /**
   * Utility method to create a delay
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
