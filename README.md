# @logelse/nodejs

Simple Node.js SDK for Logelse log ingest API.

## Installation

```bash
npm install @logelse/nodejs
```

## Quick Start

```javascript
import { LogelseClient } from '@logelse/nodejs';

// Initialize once with your API key and app info
const logger = new LogelseClient('YOUR_API_KEY', {
  appName: 'my-app',
  appUuid: 'my-app-uuid'
});

// Send logs (timestamp is automatic)
await logger.info('Application started');
await logger.error('Something went wrong');
await logger.debug('Debug information');
```

## API

### Initialize

```javascript
const logger = new LogelseClient(apiKey, options);
```

**Required:**
- `apiKey` - Your Logelse API key
- `options.appName` - Your application name
- `options.appUuid` - Your application UUID

**Optional:**
- `options.baseUrl` - Custom API URL (default: https://ingst.logelse.com)
- `options.timeout` - Request timeout in ms (default: 5000)
- `options.retryAttempts` - Retry attempts (default: 3)
- `options.debug` - Enable debug logs (default: false)

### Log Methods

```javascript
// Main method
await logger.log(level, message, timestamp?)

// Convenience methods
await logger.debug(message, timestamp?)
await logger.info(message, timestamp?)
await logger.warn(message, timestamp?)
await logger.error(message, timestamp?)
await logger.fatal(message, timestamp?)
```

All methods are async and non-blocking. Timestamp is optional (auto-generated if not provided).

## Examples

### Basic Usage

```javascript
import { LogelseClient } from '@logelse/nodejs';

const logger = new LogelseClient('your-api-key', {
  appName: 'my-app',
  appUuid: 'app-123'
});

// Simple logging
await logger.info('User logged in');
await logger.error('Database connection failed');

// With custom timestamp
await logger.warn('High memory usage', '2024-01-01T12:00:00Z');
```

### Express.js

```javascript
import express from 'express';
import { LogelseClient } from '@logelse/nodejs';

const app = express();
const logger = new LogelseClient('your-api-key', {
  appName: 'web-server',
  appUuid: 'server-001'
});

app.use(async (req, res, next) => {
  await logger.info(`${req.method} ${req.path}`);
  next();
});

app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});

app.listen(3000, async () => {
  await logger.info('Server started on port 3000');
});
```

### Error Handling

```javascript
try {
  await logger.info('Processing request');
  // Your code here
} catch (error) {
  // Logging errors are handled internally with retries
  // Your application continues normally
  console.log('Log may have failed, but app continues');
}
```

## Features

- ✅ **Simple API** - Just set app info once, then log with level and message
- ✅ **Non-blocking** - Never blocks your application
- ✅ **Auto-retry** - Automatic retries with backoff
- ✅ **TypeScript** - Full TypeScript support
- ✅ **Lightweight** - Minimal dependencies

## License

Apache 2.0
