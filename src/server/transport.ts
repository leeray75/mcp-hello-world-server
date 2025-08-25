/**
 * @fileoverview Transport management for MCP server
 * @module server/transport
 * @author MCP Hello World Server
 * @since 1.0.0
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createLogger, Logger } from '../utils/logger.js';
import { TransportConfig } from '../types/server-types.js';

/**
 * Transport manager class for handling server transport connections
 * @description Manages STDIO transport for MCP server communication
 * @example
 * ```typescript
 * const transportManager = new TransportManager({
 *   type: 'stdio',
 *   logger: createLogger('Transport')
 * });
 * const transport = transportManager.createTransport();
 * ```
 */
export class TransportManager {
  /** Logger instance for this transport manager */
  private readonly logger: Logger;
  /** Transport configuration */
  private readonly config: TransportConfig;
  /** Current transport instance */
  private transport?: StdioServerTransport;

  /**
   * Create a new transport manager instance
   * @param config - Configuration for the transport manager
   * @example
   * ```typescript
   * const transportManager = new TransportManager({
   *   type: 'stdio',
   *   logger: createLogger('Transport'),
   *   options: { bufferSize: 1024 }
   * });
   * ```
   */
  constructor(config: TransportConfig) {
    this.config = config;
    this.logger = config.logger;
    this.logger.info('Transport manager initialized', { 
      type: config.type,
      hasOptions: !!config.options 
    });
  }

  /**
   * Create a new transport instance
   * @returns The created transport instance
   * @throws Error if transport type is unsupported
   * @example
   * ```typescript
   * const transport = transportManager.createTransport();
   * await server.connect(transport);
   * ```
   */
  createTransport(): StdioServerTransport {
    this.logger.info('Creating transport', { type: this.config.type });

    try {
      switch (this.config.type) {
        case 'stdio':
          this.transport = this.createStdioTransport();
          break;
        case 'sse':
          throw new Error('SSE transport not implemented yet');
        case 'websocket':
          throw new Error('WebSocket transport not implemented yet');
        default:
          throw new Error(`Unsupported transport type: ${this.config.type}`);
      }

      this.logger.info('Transport created successfully', { 
        type: this.config.type 
      });

      return this.transport;
    } catch (error) {
      this.logger.error('Failed to create transport', { 
        type: this.config.type,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Create STDIO transport instance
   * @returns Configured STDIO transport
   * @private
   * @example
   * ```typescript
   * // Internal usage only
   * const stdioTransport = this.createStdioTransport();
   * ```
   */
  private createStdioTransport(): StdioServerTransport {
    this.logger.debug('Creating STDIO transport');

    // Apply any STDIO-specific options from config
    const options = this.config.options || {};
    
    this.logger.debug('STDIO transport options', { options });

    // Create the STDIO transport
    const transport = new StdioServerTransport();

    this.logger.debug('STDIO transport created');

    return transport;
  }

  /**
   * Get the current transport instance
   * @returns The current transport or undefined if not created
   * @example
   * ```typescript
   * const currentTransport = transportManager.getTransport();
   * if (currentTransport) {
   *   console.log('Transport is available');
   * }
   * ```
   */
  getTransport(): StdioServerTransport | undefined {
    return this.transport;
  }

  /**
   * Check if transport is created and ready
   * @returns True if transport is ready
   * @example
   * ```typescript
   * const isReady = transportManager.isReady();
   * if (isReady) {
   *   console.log('Transport is ready for connection');
   * }
   * ```
   */
  isReady(): boolean {
    return !!this.transport;
  }

  /**
   * Get transport configuration
   * @returns Transport configuration object
   * @example
   * ```typescript
   * const config = transportManager.getConfig();
   * console.log(`Transport type: ${config.type}`);
   * ```
   */
  getConfig(): TransportConfig {
    return { ...this.config };
  }

  /**
   * Clean up transport resources
   * @example
   * ```typescript
   * await transportManager.cleanup();
   * ```
   */
  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up transport resources');

    try {
      // Currently no cleanup needed for STDIO transport
      // This method is prepared for future transport types
      this.transport = undefined;
      
      this.logger.info('Transport cleanup completed');
    } catch (error) {
      this.logger.error('Transport cleanup failed', { 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Get transport health information
   * @returns Transport health status
   * @example
   * ```typescript
   * const health = transportManager.getHealth();
   * console.log(`Transport healthy: ${health.healthy}`);
   * ```
   */
  getHealth(): {
    healthy: boolean;
    type: string;
    ready: boolean;
    created?: Date;
  } {
    return {
      healthy: true,
      type: this.config.type,
      ready: this.isReady(),
    };
  }

  /**
   * Get transport statistics
   * @returns Transport usage statistics
   * @example
   * ```typescript
   * const stats = transportManager.getStats();
   * console.log(`Transport type: ${stats.type}`);
   * ```
   */
  getStats(): {
    type: string;
    ready: boolean;
    created: boolean;
    options?: Record<string, unknown>;
  } {
    return {
      type: this.config.type,
      ready: this.isReady(),
      created: !!this.transport,
      options: this.config.options,
    };
  }
}

/**
 * Create a transport manager with default STDIO configuration
 * @param config - Optional configuration overrides
 * @returns Configured transport manager instance
 * @example
 * ```typescript
 * const transportManager = createTransportManager();
 * // or with custom config
 * const transportManager = createTransportManager({
 *   type: 'stdio',
 *   logger: createLogger('MyTransport'),
 *   options: { bufferSize: 2048 }
 * });
 * ```
 */
export function createTransportManager(config?: Partial<TransportConfig>): TransportManager {
  const defaultConfig: TransportConfig = {
    type: 'stdio',
    logger: createLogger('Transport'),
    ...config,
  };

  return new TransportManager(defaultConfig);
}

/**
 * Create a STDIO transport directly
 * @param logger - Optional logger instance
 * @returns Configured STDIO transport
 * @example
 * ```typescript
 * const transport = createStdioTransport();
 * await server.connect(transport);
 * ```
 */
export function createStdioTransport(logger?: Logger): StdioServerTransport {
  const log = logger || createLogger('Transport');
  
  log.info('Creating STDIO transport directly');
  
  const transport = new StdioServerTransport();
  
  log.info('STDIO transport created');
  
  return transport;
}
