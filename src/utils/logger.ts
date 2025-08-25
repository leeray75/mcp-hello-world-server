/**
 * @fileoverview Logging utilities for the MCP Hello World Server
 * @module utils/logger
 * @author MCP Hello World Server
 * @since 1.0.0
 */

/**
 * Log level enumeration
 * @description Available logging levels in order of severity
 */
export enum LogLevel {
  /** Debug level - detailed diagnostic information */
  DEBUG = 'debug',
  /** Info level - general information messages */
  INFO = 'info',
  /** Warning level - potentially harmful situations */
  WARN = 'warn',
  /** Error level - error events that might still allow the application to continue */
  ERROR = 'error',
}

/**
 * Log entry structure
 * @description Standard format for log messages
 */
export interface LogEntry {
  /** Timestamp of the log entry */
  timestamp: string;
  /** Severity level of the log */
  level: LogLevel;
  /** Log message content */
  message: string;
  /** Optional context data */
  context?: Record<string, unknown>;
}

/**
 * Logger class for structured logging
 * @description Provides structured logging with multiple levels and context support
 * @example
 * ```typescript
 * const logger = new Logger('ToolService');
 * logger.info('Processing tool request', { toolName: 'say_hello' });
 * logger.error('Tool execution failed', { error: 'Invalid parameters' });
 * ```
 */
export class Logger {
  /** The component name for this logger instance */
  private readonly component: string;

  /**
   * Create a new logger instance
   * @param component - The name of the component this logger represents
   * @example
   * ```typescript
   * const logger = new Logger('ServerSetup');
   * ```
   */
  constructor(component: string) {
    this.component = component;
  }

  /**
   * Log a debug message
   * @param message - The debug message to log
   * @param context - Optional context data
   * @example
   * ```typescript
   * logger.debug('Variable state', { userId: 123, status: 'active' });
   * ```
   */
  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log an info message
   * @param message - The info message to log
   * @param context - Optional context data
   * @example
   * ```typescript
   * logger.info('Server started successfully', { port: 3000 });
   * ```
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log a warning message
   * @param message - The warning message to log
   * @param context - Optional context data
   * @example
   * ```typescript
   * logger.warn('Deprecated feature used', { feature: 'oldApi' });
   * ```
   */
  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log an error message
   * @param message - The error message to log
   * @param context - Optional context data including error details
   * @example
   * ```typescript
   * logger.error('Database connection failed', { 
   *   error: error.message,
   *   retryCount: 3 
   * });
   * ```
   */
  error(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  /**
   * Core logging method
   * @param level - The log level
   * @param message - The message to log
   * @param context - Optional context data
   * @private
   */
  private log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: `[${this.component}] ${message}`,
      ...(context && { context }),
    };

    // Format log entry for console output
    const logMessage = this.formatLogEntry(entry);

    // Output to appropriate console method based on level
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.ERROR:
        console.error(logMessage);
        break;
    }
  }

  /**
   * Format a log entry for console output
   * @param entry - The log entry to format
   * @returns Formatted log string
   * @private
   */
  private formatLogEntry(entry: LogEntry): string {
    const contextStr = entry.context 
      ? ` ${JSON.stringify(entry.context)}`
      : '';
    
    return `${entry.timestamp} [${entry.level.toUpperCase()}] ${entry.message}${contextStr}`;
  }
}

/**
 * Create a logger instance for a specific component
 * @param component - The component name
 * @returns A new Logger instance
 * @example
 * ```typescript
 * const logger = createLogger('ResourceHandler');
 * logger.info('Handler initialized');
 * ```
 */
export function createLogger(component: string): Logger {
  return new Logger(component);
}

/**
 * Default server logger instance
 * @description Pre-configured logger for general server operations
 */
export const serverLogger = createLogger('Server');
