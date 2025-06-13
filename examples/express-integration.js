/**
 * Express.js integration example for @logelse/nodejs
 * This example shows the simplified API with Express.js
 */

const express = require('express');
const { LogelseClient } = require('@logelse/nodejs');

const app = express();
const port = 3000;

// Initialize Logelse client with simplified API
const logger = new LogelseClient('YOUR_API_KEY_HERE', {
  appName: 'express-server',
  appUuid: 'server-001',
  debug: true // Enable debug logging
});

// Middleware to parse JSON
app.use(express.json());

// Request logging middleware
app.use(async (req, res, next) => {
  const startTime = Date.now();
  
  // Log the incoming request
  try {
    await logger.info(`${req.method} ${req.path} - ${req.ip}`);
  } catch (error) {
    console.error('Failed to log request:', error.message);
  }

  // Add response time logging
  res.on('finish', async () => {
    const duration = Date.now() - startTime;
    try {
      await logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
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
    
    await logger.info(`User ${userId} accessed`);
    res.json({ id: userId, name: `User ${userId}` });
  } catch (error) {
    // Log the error
    await logger.error(`Error accessing user ${userId}: ${error.message}`);
    res.status(404).json({ error: error.message });
  }
});

app.post('/test-logs', async (req, res) => {
  try {
    // Test different log levels
    await logger.debug('Debug message from test endpoint');
    await logger.info('Info message from test endpoint');
    await logger.warn('Warning message from test endpoint');
    await logger.error('Error message from test endpoint');
    
    res.json({ message: 'Test logs sent successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send test logs' });
  }
});

// Error handling middleware
app.use(async (err, req, res, next) => {
  // Log the error
  try {
    await logger.error(`Unhandled error: ${err.message} - ${req.method} ${req.path}`);
  } catch (logError) {
    console.error('Failed to log error:', logError.message);
  }
  
  res.status(500).json({ error: 'Internal Server Error' });
});

// 404 handler
app.use(async (req, res) => {
  try {
    await logger.warn(`404 - ${req.method} ${req.path}`);
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
    await logger.info(`Express server started on port ${port}`);
  } catch (error) {
    console.error('Failed to log server start:', error.message);
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  try {
    await logger.info('Express server shutting down');
  } catch (error) {
    console.error('Failed to log shutdown:', error.message);
  }
  process.exit(0);
});
