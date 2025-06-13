import axios, { AxiosInstance, AxiosError } from 'axios';
import { LogEntry, LogelseClientOptions, LogelseApiResponse, LogelseApiError } from './types';

/**
 * Logelse SDK Client for sending logs to the Logelse API
 */
export class LogelseClient {
  private readonly apiKey: string;
  private readonly httpClient: AxiosInstance;
  private readonly options: Required<LogelseClientOptions>;

  /**
   * Creates a new Logelse client instance
   * @param apiKey - Your Logelse API key
   * @param options - Optional configuration options
   */
  constructor(apiKey: string, options: LogelseClientOptions = {}) {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new Error('API key is required and must be a string');
    }

    this.apiKey = apiKey;
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
   * Sends a single log entry to the Logelse API
   * @param entry - The log entry to send
   * @returns Promise that resolves when the log is sent successfully
   */
  async log(entry: LogEntry): Promise<void> {
    this.validateLogEntry(entry);
    await this.sendWithRetry('/logs', entry);
  }

  /**
   * Sends multiple log entries to the Logelse API
   * @param entries - Array of log entries to send
   * @returns Promise that resolves when all logs are sent successfully
   */
  async logBatch(entries: LogEntry[]): Promise<void> {
    if (!Array.isArray(entries) || entries.length === 0) {
      throw new Error('Entries must be a non-empty array');
    }

    entries.forEach((entry, index) => {
      try {
        this.validateLogEntry(entry);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Invalid log entry at index ${index}: ${errorMessage}`);
      }
    });

    // Send each entry individually for now
    // In the future, this could be optimized to use a batch endpoint
    await Promise.all(entries.map(entry => this.sendWithRetry('/logs', entry)));
  }

  /**
   * Creates a log entry with the current timestamp
   * @param level - Log level
   * @param message - Log message
   * @param appName - Application name
   * @param appUuid - Application UUID
   * @returns LogEntry object
   */
  createLogEntry(
    level: string,
    message: string,
    appName: string,
    appUuid: string
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      log_level: level,
      message,
      app_name: appName,
      app_uuid: appUuid,
    };
  }

  /**
   * Convenience method to log with automatic timestamp
   * @param level - Log level
   * @param message - Log message
   * @param appName - Application name
   * @param appUuid - Application UUID
   */
  async logMessage(
    level: string,
    message: string,
    appName: string,
    appUuid: string
  ): Promise<void> {
    const entry = this.createLogEntry(level, message, appName, appUuid);
    await this.log(entry);
  }

  /**
   * Validates a log entry
   * @param entry - Log entry to validate
   */
  private validateLogEntry(entry: LogEntry): void {
    if (!entry || typeof entry !== 'object') {
      throw new Error('Log entry must be an object');
    }

    // Check required fields with proper typing
    if (!entry.timestamp || typeof entry.timestamp !== 'string') {
      throw new Error("Field 'timestamp' is required and must be a string");
    }
    if (!entry.log_level || typeof entry.log_level !== 'string') {
      throw new Error("Field 'log_level' is required and must be a string");
    }
    if (!entry.message || typeof entry.message !== 'string') {
      throw new Error("Field 'message' is required and must be a string");
    }
    if (!entry.app_name || typeof entry.app_name !== 'string') {
      throw new Error("Field 'app_name' is required and must be a string");
    }
    if (!entry.app_uuid || typeof entry.app_uuid !== 'string') {
      throw new Error("Field 'app_uuid' is required and must be a string");
    }

    // Validate timestamp format (basic ISO 8601 check)
    if (isNaN(Date.parse(entry.timestamp))) {
      throw new Error('Timestamp must be a valid ISO 8601 date string');
    }
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
