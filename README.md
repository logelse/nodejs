# @logelse/nodejs

A Node.js SDK for the Logelse log ingest API. This library provides a simple, non-blocking way to send logs to your Logelse instance.

## Features

- 🚀 **Non-blocking**: All operations are asynchronous and won't block your application
- 🔄 **Automatic retries**: Built-in retry logic with configurable attempts and delays
- 📝 **TypeScript support**: Full TypeScript definitions included
- ✅ **Comprehensive validation**: Input validation with helpful error messages
- 🛡️ **Error handling**: Graceful error handling with detailed error information
- 📦 **Lightweight**: Minimal dependencies
- 🧪 **Well tested**: Comprehensive test suite with high coverage

## Installation

```bash
npm install @logelse/nodejs
```

## Quick Start

```typescript
import { LogelseClient } from '@logelse/nodejs';

// Initialize the client
const client = new LogelseClient('YOUR_API_KEY');

// Send a log entry
await client.log({
  timestamp: new Date().toISOString(),
  log_level: 'INFO',
  message: 'Application started successfully',
  app_name: 'my-app',
  app_uuid: 'my-app-uuid'
});
```

## API Reference

### LogelseClient

#### Constructor

```typescript
new LogelseClient(apiKey: string, options?: LogelseClientOptions)
```

**Parameters:**
- `apiKey` (string): Your Logelse API key
- `options` (LogelseClientOptions, optional): Configuration options

**Options:**
```typescript
interface LogelseClientOptions {
  baseUrl?: string;        // Default: 'https://ingst.logelse.com'
  timeout?: number;        // Default: 5000 (ms)
  retryAttempts?: number;  // Default: 3
  retryDelay?: number;     // Default: 1000 (ms)
  debug?: boolean;         // Default: false
}
```

#### Methods

##### `log(entry: LogEntry): Promise<void>`

Sends a single log entry to the Logelse API.

```typescript
await client.log({
  timestamp: '2026-06-03T18:04:05Z',
  log_level: 'ERROR',
  message: 'Database connection failed',
  app_name: 'my-app',
  app_uuid: 'my-app-uuid'
});
```

##### `logBatch(entries: LogEntry[]): Promise<void>`

Sends multiple log entries to the Logelse API.

```typescript
await client.logBatch([
  {
    timestamp: '2026-06-03T18:04:05Z',
    log_level: 'INFO',
    message: 'User logged in',
    app_name: 'my-app',
    app_uuid: 'my-app-uuid'
  },
  {
    timestamp: '2026-06-03T18:04:06Z',
    log_level: 'DEBUG',
    message: 'Processing request',
    app_name: 'my-app',
    app_uuid: 'my-app-uuid'
  }
]);
```

##### `logMessage(level: string, message: string, appName: string, appUuid: string): Promise<void>`

Convenience method to log a message with automatic timestamp generation.

```typescript
await client.logMessage('WARN', 'High memory usage detected', 'my-app', 'my-app-uuid');
```

##### `createLogEntry(level: string, message: string, appName: string, appUuid: string): LogEntry`

Creates a log entry object with the current timestamp.

```typescript
const entry = client.createLogEntry('INFO', 'Task completed', 'my-app', 'my-app-uuid');
await client.log(entry);
```

### Types

#### LogEntry

```typescript
interface LogEntry {
  timestamp: string;    // ISO 8601 timestamp
  log_level: string;    // Log level (e.g., 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL')
  message: string;      // Log message
  app_name: string;     // Application name
  app_uuid: string;     // Application UUID
}
```

#### LogLevel

```typescript
type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
```

## Usage Examples

### Basic Usage

```typescript
import { LogelseClient } from '@logelse/nodejs';

const client = new LogelseClient('your-api-key');

// Simple logging
await client.logMessage('INFO', 'Application started', 'my-app', 'app-123');
```

### Custom Configuration

```typescript
import { LogelseClient } from '@logelse/nodejs';

const client = new LogelseClient('your-api-key', {
  baseUrl: 'https://custom.logelse.com',
  timeout: 10000,
  retryAttempts: 5,
  retryDelay: 2000,
  debug: true
});
```

### Error Handling

```typescript
import { LogelseClient } from '@logelse/nodejs';

const client = new LogelseClient('your-api-key');

try {
  await client.log({
    timestamp: new Date().toISOString(),
    log_level: 'ERROR',
    message: 'Something went wrong',
    app_name: 'my-app',
    app_uuid: 'app-123'
  });
} catch (error) {
  console.error('Failed to send log:', error.message);
}
```

### Batch Logging

```typescript
import { LogelseClient } from '@logelse/nodejs';

const client = new LogelseClient('your-api-key');

const logs = [
  client.createLogEntry('INFO', 'User login', 'auth-service', 'auth-123'),
  client.createLogEntry('DEBUG', 'Token validated', 'auth-service', 'auth-123'),
  client.createLogEntry('INFO', 'Session created', 'auth-service', 'auth-123')
];

await client.logBatch(logs);
```

### Express.js Integration

```typescript
import express from 'express';
import { LogelseClient } from '@logelse/nodejs';

const app = express();
const logger = new LogelseClient('your-api-key');

// Middleware for request logging
app.use(async (req, res, next) => {
  try {
    await logger.logMessage(
      'INFO',
      `${req.method} ${req.path}`,
      'web-server',
      'server-123'
    );
  } catch (error) {
    console.error('Logging failed:', error);
  }
  next();
});

// Error handling middleware
app.use(async (err, req, res, next) => {
  try {
    await logger.logMessage(
      'ERROR',
      `Error: ${err.message}`,
      'web-server',
      'server-123'
    );
  } catch (logError) {
    console.error('Error logging failed:', logError);
  }
  res.status(500).send('Internal Server Error');
});
```

### Winston Integration

```typescript
import winston from 'winston';
import { LogelseClient } from '@logelse/nodejs';

const logelseClient = new LogelseClient('your-api-key');

// Custom Winston transport
class LogelseTransport extends winston.Transport {
  constructor(options = {}) {
    super(options);
  }

  async log(info, callback) {
    try {
      await logelseClient.logMessage(
        info.level.toUpperCase(),
        info.message,
        'my-app',
        'app-123'
      );
      callback();
    } catch (error) {
      callback(error);
    }
  }
}

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
    new LogelseTransport()
  ]
});

logger.info('This will be sent to both console and Logelse');
```

## Error Handling

The SDK includes comprehensive error handling:

- **Validation errors**: Thrown immediately for invalid input
- **Network errors**: Automatically retried with exponential backoff
- **API errors**: Detailed error messages from the Logelse API
- **Timeout errors**: Configurable request timeouts

All errors include descriptive messages to help with debugging.

## Testing

Run the test suite:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the project: `npm run build`
4. Run tests: `npm test`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Support

For support, please contact the Logelse team or create an issue in the repository.
