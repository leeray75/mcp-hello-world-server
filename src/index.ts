#!/usr/bin/env node

/**
 * @fileoverview Main entry point for the MCP Hello World Server
 * @module index
 * @author MCP Hello World Server Team
 * @since 1.0.0
 */

import { MCPServer } from './server/mcp-server.js';
import { createLogger } from './utils/logger.js';

/**
 * Main application logger
 */
const logger = createLogger('App');

/**
 * Main application entry point
 * @description Initializes and starts the MCP Hello World Server
 * @example
 * ```bash
 * node build/index.js
 * ```
 */
async function main(): Promise<void> {
  logger.info('Starting MCP Hello World Server');

  try {
    // Create and start the MCP server
    const mcpServer = new MCPServer();
    await mcpServer.start();

    logger.info('MCP Hello World Server is running');
  } catch (error) {
    logger.error('Failed to start MCP Hello World Server', { 
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    process.exit(1);
  }
}

/**
 * Handle uncaught exceptions and unhandled rejections
 * @description Global error handlers for process-level errors
 */
function setupGlobalErrorHandlers(): void {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception - shutting down', { 
      error: error.message, 
      stack: error.stack 
    });
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled promise rejection - shutting down', { 
      reason: String(reason),
      promise: String(promise)
    });
    process.exit(1);
  });
}

// Set up global error handling
setupGlobalErrorHandlers();

// Run the server
main().catch((error) => {
  logger.error('Application startup failed', { 
    error: error instanceof Error ? error.message : String(error) 
  });
  process.exit(1);
});
