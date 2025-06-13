/**
 * Log level enumeration for Logelse API
 */
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

/**
 * Internal log entry interface matching the Logelse API format
 */
export interface LogEntry {
  /** ISO 8601 timestamp string */
  timestamp: string;
  /** Log level */
  log_level: LogLevel | string;
  /** Log message content */
  message: string;
  /** Application name */
  app_name: string;
  /** Application UUID identifier */
  app_uuid: string;
}

/**
 * Configuration options for the Logelse client
 */
export interface LogelseClientOptions {
  /** Application name (required) */
  appName: string;
  /** Application UUID (required) */
  appUuid: string;
  /** Base URL for the Logelse API (default: https://ingst.logelse.com) */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 5000) */
  timeout?: number;
  /** Number of retry attempts for failed requests (default: 3) */
  retryAttempts?: number;
  /** Delay between retry attempts in milliseconds (default: 1000) */
  retryDelay?: number;
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

/**
 * Error response from the Logelse API
 */
export interface LogelseApiError {
  message: string;
  code?: string;
  details?: any;
}

/**
 * Response from the Logelse API
 */
export interface LogelseApiResponse {
  success: boolean;
  message?: string;
  error?: LogelseApiError;
}
