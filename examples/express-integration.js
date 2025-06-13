/**
 * Express.js integration example for @logelse/nodejs
 * This example shows how to integrate the SDK with an Express.js application
 */

const express = require('express');
const { LogelseClient } = require('@logelse/nodejs');

const app = express();
const port = 3000;

// Initialize Logelse client
const logger = new LogelseClient('YOUR_API_KEY_HERE', {
  debug: true, // Enable debug logging
  retryAttempts: 2,
  timeout: 3000
});

// Middleware to parse JSON
app.use(express.json());

// Request logging middleware
app.use(async (req, res, next) => {
  const startTime = Date.now();
  
  // Log the incoming request
  try {
    await logger.logMessage(
      'INFO',
      `${req.method} ${req.path} - ${req.ip}`,
      'express-server',
      'server-001'
    );
  } catch (error) {
    console.error('Failed to log request:', error.message);
  }

  // Add response time logging
  res.on('finish', async () => {
    const duration = Date.now() - startTime;
    try {
      await logger.logMessage(
        'INFO',
        `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`,
        'express-server',
        'server-001'
      );
    } catch (error) {
      console.error('Failed to log response:', error.message);
    }
  });

  next();
});

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Hello World!' });
});

app.get('/users/:id', async (req, res) => {
  const userId = req.params.id;
  
  try {
    // Simulate user lookup
    if (userId === '404') {
      throw new Error('User not found');
    }
    
    await logger.logMessage(
      'INFO',
      `User ${userId} accessed`,
      'express-server',
      'server-001'
    );
    
    res.json({ id: userId, name: `User ${userId}` });
  } catch (error) {
    // Log the error
    await logger.logMessage(
      'ERROR',
      `Error accessing user ${userId}: ${error.message}`,
      'express-server',
      'server-001'
    );
    
    res.status(404).json({ error: error.message });
  }
});

app.post('/logs/test', async (req, res) => {
  try {
    // Test batch logging
    const testLogs = [
      logger.createLogEntry('DEBUG', 'Test log 1', 'test-app', 'test-001'),
      logger.createLogEntry('INFO', 'Test log 2', 'test-app', 'test-001'),
      logger.createLogEntry('WARN', 'Test log 3', 'test-app', 'test-001')
    ];
    
    await logger.logBatch(testLogs);
    
    res.json({ message: 'Test logs sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send test logs' });
  }
});

// Error handling middleware
app.use(async (err, req, res, next) => {
  // Log the error
  try {
    await logger.logMessage(
      'ERROR',
      `Unhandled error: ${err.message} - ${req.method} ${req.path}`,
      'express-server',
      'server-001'
    );
  } catch (logError) {
    console.error('Failed to log error:', logError.message);
  }
  
  res.status(500).json({ error: 'Internal Server Error' });
});

// 404 handler
app.use(async (req, res) => {
  try {
    await logger.logMessage(
      'WARN',
      `404 - ${req.method} ${req.path}`,
      'express-server',
      'server-001'
    );
  } catch (error) {
    console.error('Failed to log 404:', error.message);
  }
  
  res.status(404).json({ error: 'Not Found' });
});

// Start server
app.listen(port, async () => {
  console.log(`Server running at http://localhost:${port}`);
  
  // Log server start
  try {
    await logger.logMessage(
      'INFO',
      `Express server started on port ${port}`,
      'express-server',
      'server-001'
    );
  } catch (error) {
    console.error('Failed to log server start:', error.message);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  try {
    await logger.logMessage(
      'INFO',
      'Express server shutting down',
      'express-server',
      'server-001'
    );
  } catch (error) {
    console.error('Failed to log shutdown:', error.message);
  }
  process.exit(0);
});
