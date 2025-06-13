/**
 * Basic usage example for @logelse/nodejs
 * This example shows how to use the SDK in a simple Node.js application
 */

const { LogelseClient } = require('@logelse/nodejs');

async function basicExample() {
  // Initialize the client with your API key
  const client = new LogelseClient('YOUR_API_KEY_HERE');

  try {
    // Example 1: Simple log message
    await client.logMessage('INFO', 'Application started successfully', 'my-app', 'app-123');
    console.log('✓ Log sent successfully');

    // Example 2: Manual log entry
    await client.log({
      timestamp: new Date().toISOString(),
      log_level: 'ERROR',
      message: 'Database connection failed',
      app_name: 'my-app',
      app_uuid: 'app-123'
    });
    console.log('✓ Error log sent successfully');

    // Example 3: Batch logging
    const logs = [
      client.createLogEntry('DEBUG', 'Processing user request', 'my-app', 'app-123'),
      client.createLogEntry('INFO', 'User authenticated', 'my-app', 'app-123'),
      client.createLogEntry('WARN', 'High memory usage detected', 'my-app', 'app-123')
    ];

    await client.logBatch(logs);
    console.log('✓ Batch logs sent successfully');

  } catch (error) {
    console.error('❌ Failed to send logs:', error.message);
  }
}

// Run the example
basicExample();
