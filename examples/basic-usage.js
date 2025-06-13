/**
 * Basic usage example for @logelse/nodejs
 * This example shows the simplified API usage
 */

const { LogelseClient } = require('@logelse/nodejs');

async function basicExample() {
  // Initialize the client with API key and app info
  const logger = new LogelseClient('YOUR_API_KEY_HERE', {
    appName: 'my-app',
    appUuid: 'app-123'
  });

  try {
    // Simple logging with convenience methods
    await logger.info('Application started successfully');
    console.log('✓ Info log sent');

    await logger.error('Database connection failed');
    console.log('✓ Error log sent');

    await logger.debug('Processing user request');
    console.log('✓ Debug log sent');

    await logger.warn('High memory usage detected');
    console.log('✓ Warning log sent');

    // Using the main log method
    await logger.log('INFO', 'Custom log message');
    console.log('✓ Custom log sent');

    // With custom timestamp
    await logger.info('Historical event', '2024-01-01T12:00:00Z');
    console.log('✓ Log with custom timestamp sent');

  } catch (error) {
    console.error('❌ Failed to send logs:', error.message);
  }
}

// Run the example
basicExample();
