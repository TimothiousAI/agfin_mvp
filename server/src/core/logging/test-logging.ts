/**
 * Test script for logging utility
 * Run with: npx ts-node src/core/logging/test-logging.ts
 */

import { logger } from './index';

console.log('=== Testing Structured Logging ===\n');

// Test basic log levels
logger.debug('Debug message', { debugInfo: 'Extra debug details' });
logger.info('Info message', { userId: 123, action: 'login' });
logger.warn('Warning message', { warning: 'High memory usage' });
logger.error('Error message', { error: 'Database connection failed' });

console.log('\n=== Testing Request ID Tracking ===\n');

// Test request ID logging
const reqLogger = logger.withRequestId('req-abc-123');
reqLogger.info('Processing request', { endpoint: '/api/users' });
reqLogger.error('Request failed', { statusCode: 500 });

console.log('\n=== Testing Sensitive Data Redaction ===\n');

// Test sensitive data redaction
logger.info('User login attempt', {
  username: 'john@example.com',
  password: 'super-secret-password', // Should be redacted
  token: 'jwt-token-here', // Should be redacted
  apiKey: 'sk-abc123', // Should be redacted
  publicData: 'This is safe to log',
});

console.log('\n=== Nested Object Redaction ===\n');

logger.info('Request details', {
  headers: {
    authorization: 'Bearer token123', // Should be redacted
    contentType: 'application/json',
  },
  body: {
    username: 'jane@example.com',
    secret: 'my-secret-value', // Should be redacted
  },
});

console.log('\n✅ All logging tests complete!');
console.log('Note: In production (NODE_ENV=production), logs will be JSON formatted.');
