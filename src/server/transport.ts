/**
 * @fileoverview Transport management for MCP server
 * @module server/transport
 * @author MCP Hello World Server
 * @since 1.0.0
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import express, { Request, Response } from 'express';
import { createLogger, Logger } from '../utils/logger.js';
import { TransportConfig, HttpTransportOptions } from '../types/server-types.js';
import { Server as HttpServer } from 'http';

/**
 * SSE connection interface for managing Server-Sent Events connections
 */
interface SSEConnection {
  id: string;
  response: Response;
  lastPing: Date;
}

/**
 * HTTP transport class for handling HTTP/SSE communication
 * @description Manages HTTP server with Express and SSE connections
 */
export class HttpTransport {
  private app: express.Application;
  private server?: HttpServer;
  private sseConnections: Map<string, SSEConnection> = new Map();
  private logger: Logger;
  private options: HttpTransportOptions;

  constructor(logger: Logger, options: HttpTransportOptions = {}) {
    this.logger = logger;
    this.options = {
      port: 3000,
      host: '0.0.0.0',
      cors: false,
      maxConnections: 100,
      connectionTimeout: 30000,
      ...options,
    };

    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    
    if (this.options.cors) {
      this.app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        if (req.method === 'OPTIONS') {
          res.sendStatus(200);
          return;
        }
        next();
      });
    }

    // Request logging
    this.app.use((req, res, next) => {
      this.logger.debug('HTTP request', { 
        method: req.method, 
        url: req.url,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        connections: this.sseConnections.size
      });
    });

    // SSE endpoint for real-time communication
    this.app.get('/mcp/events', this.handleSSE.bind(this));

    // MCP HTTP endpoints will be added by the MCP server
    this.app.post('/mcp/tools/list', this.createMCPHandler('tools/list'));
    this.app.post('/mcp/tools/call', this.createMCPHandler('tools/call'));
    this.app.post('/mcp/resources/list', this.createMCPHandler('resources/list'));
    this.app.post('/mcp/resources/read', this.createMCPHandler('resources/read'));
    this.app.post('/mcp/prompts/list', this.createMCPHandler('prompts/list'));
    this.app.post('/mcp/prompts/get', this.createMCPHandler('prompts/get'));
  }

  private handleSSE(req: Request, res: Response): void {
    const connectionId = `sse_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.logger.info('New SSE connection', { connectionId });

    // Check connection limit
    if (this.sseConnections.size >= (this.options.maxConnections || 100)) {
      res.status(503).json({ error: 'Too many connections' });
      return;
    }

    // Set SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    // Store connection
    const connection: SSEConnection = {
      id: connectionId,
      response: res,
      lastPing: new Date(),
    };
    this.sseConnections.set(connectionId, connection);

    // Send initial connection message
    this.sendSSEMessage(connectionId, 'connected', { connectionId });

    // Handle client disconnect
    req.on('close', () => {
      this.logger.info('SSE connection closed', { connectionId });
      this.sseConnections.delete(connectionId);
    });

    // Keep connection alive with periodic pings
    const pingInterval = setInterval(() => {
      if (this.sseConnections.has(connectionId)) {
        this.sendSSEMessage(connectionId, 'ping', { timestamp: new Date().toISOString() });
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);
  }

  private sendSSEMessage(connectionId: string, event: string, data: any): void {
    const connection = this.sseConnections.get(connectionId);
    if (connection) {
      try {
        connection.response.write(`event: ${event}\n`);
        connection.response.write(`data: ${JSON.stringify(data)}\n\n`);
        connection.lastPing = new Date();
      } catch (error) {
        this.logger.error('Failed to send SSE message', { connectionId, error });
        this.sseConnections.delete(connectionId);
      }
    }
  }

  private createMCPHandler(endpoint: string) {
    return async (req: Request, res: Response) => {
      try {
        this.logger.debug('MCP HTTP request', { endpoint, body: req.body });
        
        // For now, return a placeholder response
        // This will be properly implemented when we connect it to the MCP server
        res.json({
          jsonrpc: '2.0',
          id: req.body.id || null,
          result: { 
            message: `HTTP transport for ${endpoint} - not yet connected to MCP server`,
            endpoint,
            timestamp: new Date().toISOString()
          }
        });
      } catch (error) {
        this.logger.error('MCP HTTP request failed', { endpoint, error });
        res.status(500).json({
          jsonrpc: '2.0',
          id: req.body.id || null,
          error: {
            code: -32603,
            message: 'Internal error',
            data: error instanceof Error ? error.message : String(error)
          }
        });
      }
    };
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const port = this.options.port || 3000;
      const host = this.options.host || '0.0.0.0';
      
      this.server = this.app.listen(port, host, () => {
        this.logger.info('HTTP transport started', {
          port,
          host
        });
        resolve();
      });

      this.server.on('error', (error) => {
        this.logger.error('HTTP server error', { error });
        reject(error);
      });
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      // Close all SSE connections
      for (const connection of this.sseConnections.values()) {
        connection.response.end();
      }
      this.sseConnections.clear();

      if (this.server) {
        this.server.close(() => {
          this.logger.info('HTTP transport stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  getApp(): express.Application {
    return this.app;
  }

  getConnectionCount(): number {
    return this.sseConnections.size;
  }

  broadcastSSE(event: string, data: any): void {
    for (const connectionId of this.sseConnections.keys()) {
      this.sendSSEMessage(connectionId, event, data);
    }
  }
}

/**
 * Transport manager class for handling server transport connections
 * @description Manages STDIO and HTTP transports for MCP server communication
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
  /** HTTP transport instance for HTTP mode */
  private httpTransport?: HttpTransport;

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
   * @returns The created transport instance (for STDIO) or undefined (for HTTP mode)
   * @throws Error if transport type is unsupported
   * @example
   * ```typescript
   * const transport = transportManager.createTransport();
   * if (transport) {
   *   await server.connect(transport);
   * }
   * ```
   */
  createTransport(): StdioServerTransport | undefined {
    this.logger.info('Creating transport', { type: this.config.type });

    try {
      switch (this.config.type) {
        case 'stdio':
          this.transport = this.createStdioTransport();
          break;
        case 'http':
          this.httpTransport = this.createHttpTransport();
          return undefined; // HTTP transport doesn't return a StdioServerTransport
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
   * Create HTTP transport instance
   * @returns Configured HTTP transport
   * @private
   * @example
   * ```typescript
   * // Internal usage only
   * const httpTransport = this.createHttpTransport();
   * ```
   */
  private createHttpTransport(): HttpTransport {
    this.logger.debug('Creating HTTP transport');

    // Apply HTTP-specific options from config
    const options = this.config.options as HttpTransportOptions || {};
    
    this.logger.debug('HTTP transport options', { options });

    // Create the HTTP transport
    const transport = new HttpTransport(this.logger, options);

    this.logger.debug('HTTP transport created');

    return transport;
  }

  /**
   * Start the transport (for HTTP mode)
   * @example
   * ```typescript
   * await transportManager.start();
   * ```
   */
  async start(): Promise<void> {
    if (this.config.type === 'http' && this.httpTransport) {
      await this.httpTransport.start();
      this.logger.info('HTTP transport started successfully');
    } else if (this.config.type === 'stdio') {
      this.logger.info('STDIO transport ready (no start required)');
    } else {
      throw new Error(`Cannot start transport of type: ${this.config.type}`);
    }
  }

  /**
   * Stop the transport (for HTTP mode)
   * @example
   * ```typescript
   * await transportManager.stop();
   * ```
   */
  async stop(): Promise<void> {
    if (this.httpTransport) {
      await this.httpTransport.stop();
      this.httpTransport = undefined;
      this.logger.info('HTTP transport stopped');
    }
    this.transport = undefined;
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
      // Stop HTTP transport if running
      if (this.httpTransport) {
        await this.httpTransport.stop();
        this.httpTransport = undefined;
      }
      
      // Clean up STDIO transport
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
