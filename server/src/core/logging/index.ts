import { isDevelopment } from '../config/index';

/**
 * Log levels in order of severity
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Structured log entry
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  [key: string]: unknown;
}

/**
 * Sensitive field patterns to redact
 */
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'apiKey',
  'secret',
  'authorization',
  'cookie',
  'session',
];

/**
 * Redact sensitive data from log context
 */
function redactSensitive(data: Record<string, unknown>): Record<string, unknown> {
  const redacted = { ...data };

  for (const key in redacted) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field.toLowerCase()))) {
      redacted[key] = '***REDACTED***';
    } else if (typeof redacted[key] === 'object' && redacted[key] !== null) {
      redacted[key] = redactSensitive(redacted[key] as Record<string, unknown>);
    }
  }

  return redacted;
}

/**
 * Format log entry for console output
 */
function formatForConsole(entry: LogEntry): string {
  const { timestamp, level, message, requestId, ...context } = entry;

  const colors = {
    debug: '\x1b[36m', // Cyan
    info: '\x1b[32m',  // Green
    warn: '\x1b[33m',  // Yellow
    error: '\x1b[31m', // Red
    reset: '\x1b[0m',
  };

  const color = colors[level] || colors.reset;
  const levelStr = level.toUpperCase().padEnd(5);
  const timeStr = new Date(timestamp).toLocaleTimeString();

  let output = `${color}[${levelStr}]${colors.reset} ${timeStr} ${message}`;

  if (requestId) {
    output += ` ${colors.debug}(req: ${requestId})${colors.reset}`;
  }

  if (Object.keys(context).length > 0) {
    output += `\n${JSON.stringify(context, null, 2)}`;
  }

  return output;
}

/**
 * Core logging function
 */
function log(level: LogLevel, message: string, context: Record<string, unknown> = {}): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...redactSensitive(context),
  };

  if (isDevelopment) {
    // Pretty console logging for development
    console.log(formatForConsole(entry));
  } else {
    // Structured JSON logging for production
    console.log(JSON.stringify(entry));
  }
}

/**
 * Logger instance with convenience methods
 */
export const logger = {
  debug(message: string, context?: Record<string, unknown>): void {
    log(LogLevel.DEBUG, message, context);
  },

  info(message: string, context?: Record<string, unknown>): void {
    log(LogLevel.INFO, message, context);
  },

  warn(message: string, context?: Record<string, unknown>): void {
    log(LogLevel.WARN, message, context);
  },

  error(message: string, context?: Record<string, unknown>): void {
    log(LogLevel.ERROR, message, context);
  },

  /**
   * Create a child logger with a request ID
   */
  withRequestId(requestId: string) {
    return {
      debug: (message: string, context?: Record<string, unknown>) =>
        log(LogLevel.DEBUG, message, { ...context, requestId }),
      info: (message: string, context?: Record<string, unknown>) =>
        log(LogLevel.INFO, message, { ...context, requestId }),
      warn: (message: string, context?: Record<string, unknown>) =>
        log(LogLevel.WARN, message, { ...context, requestId }),
      error: (message: string, context?: Record<string, unknown>) =>
        log(LogLevel.ERROR, message, { ...context, requestId }),
    };
  },
};

export default logger;
