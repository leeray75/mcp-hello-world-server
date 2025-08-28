/**
 * @fileoverview Transport management for MCP server
 * @module server/transport
 * @author MCP Hello World Server
 * @since 1.0.0
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
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
  // Streamable HTTP transports created per inspector session
  private transports: Record<string, StreamableHTTPServerTransport> = {};
  // SSE transports stored by session ID (legacy SSE)
  private sseTransports: Record<string, any> = {};
  // Attached MCP Server instance (set by MCPServer) so we can connect Streamable transports
  private mcpServer?: any;
  private logger: Logger;
  private options: HttpTransportOptions;

  constructor(logger: Logger, options: HttpTransportOptions = {}) {
    this.logger = logger;
    this.options = {
      port: 3001,
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
    // Apply JSON/urlencoded parsing for all endpoints except streamable endpoints
    this.app.use((req, res, next) => {
      // Skip parsing for streamable endpoints so SDK transports can access raw request streams
      if (req.path === '/mcp' || req.path === '/sse' || req.path === '/mcp/events' || req.path === '/messages') {
        return next();
      }
      express.json({
        limit: '10mb',
        verify: (req: any, res: any, buf: Buffer) => {
          this.logger.debug(`JSON parsing: received ${buf.length} bytes for ${req.path}`);
          (req as any).rawBody = buf;
        }
      })(req as any, res as any, next);
    });

    this.app.use((req, res, next) => {
      if (req.path === '/mcp' || req.path === '/sse' || req.path === '/mcp/events' || req.path === '/messages') {
        return next();
      }
      express.urlencoded({
        extended: true,
        limit: '10mb',
        verify: (req: any, res: any, buf: Buffer) => {
          this.logger.debug(`URL encoded parsing: received ${buf.length} bytes for ${req.path}`);
          (req as any).rawBody = buf;
        }
      })(req as any, res as any, next);
    });

    // Ensure basic CORS and header exposure for Inspector (may run on different origin)
    // Keep this permissive for local/dev usage; in production you may want to scope origins.
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Cache-Control, mcp-session-id, Mcp-Session-Id');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
      res.header('Access-Control-Expose-Headers', 'mcp-session-id, Mcp-Session-Id');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
      }
      next();
    });

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
    // Add debug logging for incoming SSE requests (headers) to assist inspector troubleshooting
    this.app.get('/mcp/events', (req, res) => {
      this.logger.debug('Incoming SSE request', { path: req.path, headers: req.headers });
      // Delegate to the SSE handler
      this.handleSSE(req as Request, res as Response);
    });
    // Also expose canonical /sse path for inspector parity
    this.app.get('/sse', (req, res) => {
      this.logger.debug('Incoming /sse request', { path: req.path, headers: req.headers });
      this.handleSSE(req as Request, res as Response);
    });

    // Legacy Messages endpoint for SSE transport (backwards compatibility)
    // Do NOT consume the request body here (no body parser) so the SDK transport can read the raw request stream.
    this.app.post('/messages', (req: Request, res: Response) => {
      try {
        const sessionId =
          (req.query.sessionId as string | undefined) ||
          req.get('mcp-session-id') ||
          req.get('Mcp-Session-Id') ||
          req.get('MCP-SESSION-ID');

        this.logger.info('POST /messages received', { sessionId, headers: req.headers });

        if (!sessionId) {
          res.status(400).json({ error: 'sessionId is required (query param or mcp-session-id header)' });
          return;
        }

        const transport = this.sseTransports[sessionId];
        // Avoid logging the full transport object (it can contain circular references such as Socket/HTTP objects).
        // Log only lightweight identifying information to prevent JSON.stringify errors in the logger.
        this.logger.debug('transportPresent', { hasTransport: !!transport, sessionId: transport?.sessionId });
        if (!transport) {
          this.logger.error(`Transport not found for session ID: ${sessionId}`);
          res.status(404).json({ error: 'Session not found' });
          return;
        }

        // Let the SDK transport read the raw request stream and respond
        transport.handlePostMessage(req, res);
      } catch (error) {
        this.logger.error('Failed to handle POST /messages', { error: error instanceof Error ? error.message : String(error) });
        if (!res.headersSent) {
          res.status(500).json({ error: 'Internal error' });
        }
      }
    });

    // MCP HTTP endpoints will be added by the MCP server
    // Modern Streamable HTTP endpoint for inspector parity
    // POST /mcp - handles initialize (creates StreamableHTTPServerTransport) and regular POSTs to the transport
    this.app.post(
      '/mcp',
      // Preserve raw request body for streamable initialize by using express.raw for this route
      express.raw({ type: 'application/json', limit: '10mb' }),
      async (req: Request, res: Response) => {
        this.logger.info('POST /mcp request received', { headers: req.headers });
        // Try to parse JSON body if present (raw buffer will be available on req.body)
        let parsedBody: any = undefined;
        try {
          if (req.body && Buffer.isBuffer(req.body)) {
            parsedBody = JSON.parse(req.body.toString());
          } else {
            parsedBody = req.body;
          }
        } catch (e) {
          this.logger.debug('Failed to parse raw request body as JSON', { error: String(e) });
          parsedBody = undefined;
        }

        const headerSessionId =
          (req.get('mcp-session-id') as string | undefined) ||
          (req.get('Mcp-Session-Id') as string | undefined);

        try {
          let transport: StreamableHTTPServerTransport | undefined;

          if (headerSessionId && this.transports[headerSessionId]) {
            transport = this.transports[headerSessionId];
            this.logger.info(`Reusing existing transport for session: ${headerSessionId}`);
          } else if (parsedBody && parsedBody.method === 'initialize') {
            this.logger.info('Creating new Streamable HTTP transport for initialization');

            const sessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
            transport = new StreamableHTTPServerTransport({
              sessionIdGenerator: () => sessionId,
              onsessioninitialized: (sid: string) => {
                this.logger.info(`Streamable session initialized: ${sid}`);
                this.transports[sid] = transport as StreamableHTTPServerTransport;
              },
              enableDnsRebindingProtection: false,
            });

            transport.onclose = () => {
              if (transport && transport.sessionId && this.transports[transport.sessionId]) {
                this.logger.info(`Cleaning up streamable transport for session: ${transport.sessionId}`);
                delete this.transports[transport.sessionId];
              }
            };

            if (!this.mcpServer) {
              this.logger.error('No MCP server attached to HTTP transport; cannot initialize Streamable transport');
              res.status(500).json({
                jsonrpc: '2.0',
                id: parsedBody?.id || null,
                error: { code: -32000, message: 'Server not ready for initialization' }
              });
              return;
            }

            await this.mcpServer.connect(transport);
            this.logger.info('MCP server connected to new StreamableHTTP transport');
          } else {
            // Not an initialize and no session header - route to standard handlers if possible
            if (parsedBody && parsedBody.method) {
              // Fallback to JSON-RPC handling for non-streamable requests
              await this.createJSONRPCHandler()(req, res);
              return;
            }

            res.status(400).json({
              jsonrpc: '2.0',
              id: parsedBody?.id || null,
              error: { code: -32000, message: 'Bad Request: No valid session ID or initialize payload' }
            });
            return;
          }

          // Delegate to transport to handle the request (pass parsedBody if available, otherwise raw)
          await (transport as StreamableHTTPServerTransport).handleRequest(req, res, parsedBody || req.body);
        } catch (error) {
          this.logger.error('Error handling POST /mcp', { error: error instanceof Error ? error.message : String(error) });
          if (!res.headersSent) {
            res.status(500).json({
              jsonrpc: '2.0',
              id: parsedBody?.id || null,
              error: { code: -32603, message: 'Internal error', data: error instanceof Error ? error.message : String(error) }
            });
          }
        }
      }
    );

    // Support GET for server->client notifications and DELETE for session termination
    this.app.get('/mcp', async (req, res) => {
      try {
        const sessionId =
          (req.get('mcp-session-id') as string | undefined) ||
          (req.get('Mcp-Session-Id') as string | undefined);
        if (!sessionId || !this.transports[sessionId]) {
          res.status(400).send('Invalid or missing session ID');
          return;
        }
        const transport = this.transports[sessionId];
        await transport.handleRequest(req, res);
      } catch (error) {
        this.logger.error('Failed to handle POST /messages', { error: error instanceof Error ? error.message : String(error) });
        if (!res.headersSent) {
          res.status(500).json({ error: 'Internal error' });
        }
      }
    });

    this.app.delete('/mcp', async (req, res) => {
      try {
        const sessionId =
          (req.get('mcp-session-id') as string | undefined) ||
          (req.get('Mcp-Session-Id') as string | undefined);
        if (!sessionId || !this.transports[sessionId]) {
          res.status(400).send('Invalid or missing session ID');
          return;
        }
        const transport = this.transports[sessionId];
        await transport.handleRequest(req, res);
      } catch (error) {
        this.logger.error('Error handling MCP DELETE request:', { error });
        if (!res.headersSent) {
          res.status(500).send('Internal server error');
        }
      }
    });

    // Accept POSTs to /sse as Streamable HTTP as well (inspector sometimes POSTs to the provided URL)
    this.app.post('/sse', express.raw({ type: 'application/json', limit: '10mb' }), async (req: Request, res: Response) => {
      // Reuse the same logic as POST /mcp by delegating to the /mcp handler
      await (this.app as any)._router.handle(req, res);
    });

    // Keep existing JSON-RPC-style endpoints for simple RPC routes
    this.app.post('/mcp/tools/list', this.createMCPHandler('tools/list'));
    this.app.post('/mcp/tools/call', this.createMCPHandler('tools/call'));
    this.app.post('/mcp/resources/list', this.createMCPHandler('resources/list'));
    this.app.post('/mcp/resources/read', this.createMCPHandler('resources/read'));
    this.app.post('/mcp/prompts/list', this.createMCPHandler('prompts/list'));
    this.app.post('/mcp/prompts/get', this.createMCPHandler('prompts/get'));
  }

  private handleSSE(req: Request, res: Response): void {
    // Use the SDK's SSEServerTransport to manage MCP <-> client SSE behavior
    (async () => {
      try {
        const clientIP = req.ip || (req.connection && (req.connection as any).remoteAddress);
        this.logger.info(`New SSE connection established from ${clientIP}`);

        // Ensure the mcp-session-id header will be visible to cross-origin clients
        try {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Expose-Headers', 'mcp-session-id, Mcp-Session-Id');
        } catch (e) {
          // ignore if headers cannot be set
        }

        // Create SSE transport instance with the correct message endpoint
        const transport = new SSEServerTransport('/messages', res);

        // Store transport by session ID
        this.sseTransports[transport.sessionId] = transport;
        this.logger.info(`SSE transport created with session ID: ${transport.sessionId}`);

        // Add periodic SSE comment pings to keep intermediate proxies alive
        const pingIntervalMs = 25_000; // 25 seconds
        const pingTimer = setInterval(() => {
          try {
            res.write(': ping\n\n');
          } catch (err) {
            this.logger.error('Failed to send SSE ping', { error: err instanceof Error ? err.message : String(err) });
          }
        }, pingIntervalMs);

        // Connect the MCP server to the SSE transport
        if (!this.mcpServer) {
          this.logger.error('No MCP server attached to HTTP transport; cannot connect SSE transport');
          if (!res.headersSent) {
            res.status(500).json({ error: 'Server not ready for SSE transport' });
          }
          clearInterval(pingTimer);
          return;
        }

        await this.mcpServer.connect(transport);
        this.logger.info(`MCP server connected successfully for session ${transport.sessionId}`);

        // Clean up transport and ping timer when connection closes or errors
        const cleanupTransport = () => {
          try {
            clearInterval(pingTimer);
          } catch (e) {
            // ignore errors during cleanup
          }
          this.logger.info(`SSE connection cleanup for session ${transport.sessionId}`);
          delete this.sseTransports[transport.sessionId];
        };

        res.on('close', () => {
          this.logger.info(`SSE connection close for session ${transport.sessionId}`);
          cleanupTransport();
        });

        res.on('error', (error) => {
          this.logger.error(`SSE connection error for session ${transport.sessionId}:`, { error: error instanceof Error ? error.message : String(error) });
          cleanupTransport();
        });
      } catch (error) {
        this.logger.error('Failed to handle SSE connection:', { error: error instanceof Error ? error.message : String(error) });
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to establish SSE connection' });
        }
      }
    })();
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
        try {
          // Attempt to notify client of error in SSE format before closing
          connection.response.write(`event: error\n`);
          connection.response.write(`data: ${JSON.stringify({ message: 'Failed to send message', detail: String(error) })}\n\n`);
        } catch (e) {
          // ignore write errors
        }
        this.sseConnections.delete(connectionId);
      }
    }
  }

  private createMCPHandler(endpoint: string) {
    return async (req: Request, res: Response) => {
      // Debug incoming request headers and parsed body to help inspector troubleshooting
      this.logger.debug('Incoming MCP HTTP request headers', { endpoint, headers: req.headers });
      this.logger.debug('Incoming MCP HTTP request body (parsed)', { endpoint, body: req.body });
      try {
        this.logger.debug('MCP HTTP request', { endpoint, body: req.body });
        
        // Route to appropriate handler based on endpoint
        let result;
        switch (endpoint) {
          case 'tools/list':
            if (!this.handleToolsList) throw new Error('Tools list handler not registered');
            result = await this.handleToolsList(req.body);
            break;
          case 'tools/call':
            if (!this.handleToolsCall) throw new Error('Tools call handler not registered');
            result = await this.handleToolsCall(req.body);
            break;
          case 'resources/list':
            if (!this.handleResourcesList) throw new Error('Resources list handler not registered');
            result = await this.handleResourcesList(req.body);
            break;
          case 'resources/read':
            if (!this.handleResourcesRead) throw new Error('Resources read handler not registered');
            result = await this.handleResourcesRead(req.body);
            break;
          case 'prompts/list':
            if (!this.handlePromptsList) throw new Error('Prompts list handler not registered');
            result = await this.handlePromptsList(req.body);
            break;
          case 'prompts/get':
            if (!this.handlePromptsGet) throw new Error('Prompts get handler not registered');
            result = await this.handlePromptsGet(req.body);
            break;
          default:
            throw new Error(`Unknown endpoint: ${endpoint}`);
        }
        
        res.json({
          jsonrpc: '2.0',
          id: req.body.id || null,
          result
        });
      } catch (error) {
        this.logger.error('MCP HTTP request failed', { endpoint, error: error instanceof Error ? error.message : String(error) });
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

  /**
   * Generic JSON-RPC handler for /mcp streamable endpoints
   * Supports methods like "tools/list", "tools/call", "resources/list", "resources/read",
   * "prompts/list", "prompts/get".
   */
  private createJSONRPCHandler() {
    return async (req: Request, res: Response) => {
      this.logger.debug('Incoming MCP JSON-RPC request headers', { headers: req.headers });
      this.logger.debug('Incoming MCP JSON-RPC request body (parsed)', { body: req.body });
      try {
        const method = req.body?.method || req.body?.rpcMethod || '';
        this.logger.debug('MCP JSON-RPC request', { method, body: req.body });

        let result;
        switch (method) {
          case 'tools/list':
            if (!this.handleToolsList) throw new Error('Tools list handler not registered');
            result = await this.handleToolsList(req.body.params || req.body);
            break;
          case 'tools/call':
            if (!this.handleToolsCall) throw new Error('Tools call handler not registered');
            result = await this.handleToolsCall(req.body.params || req.body);
            break;
          case 'resources/list':
            if (!this.handleResourcesList) throw new Error('Resources list handler not registered');
            result = await this.handleResourcesList(req.body.params || req.body);
            break;
          case 'resources/read':
            if (!this.handleResourcesRead) throw new Error('Resources read handler not registered');
            result = await this.handleResourcesRead(req.body.params || req.body);
            break;
          case 'prompts/list':
            if (!this.handlePromptsList) throw new Error('Prompts list handler not registered');
            result = await this.handlePromptsList(req.body.params || req.body);
            break;
          case 'prompts/get':
            if (!this.handlePromptsGet) throw new Error('Prompts get handler not registered');
            result = await this.handlePromptsGet(req.body.params || req.body);
            break;
          default:
            this.logger.warn('Unknown JSON-RPC method', { method });
            res.status(404).json({ error: 'Unknown method' });
            return;
        }

        res.json({
          jsonrpc: '2.0',
          id: req.body.id || null,
          result
        });
      } catch (error) {
        this.logger.error('MCP JSON-RPC request failed', { error: error instanceof Error ? error.message : String(error) });
        res.status(500).json({
          jsonrpc: '2.0',
          id: req.body?.id || null,
          error: {
            code: -32603,
            message: 'Internal error',
            data: error instanceof Error ? error.message : String(error)
          }
        });
      }
    };
  }

  // MCP handler methods - these will be set by the MCP server
  private handleToolsList?: (request: any) => Promise<any>;
  private handleToolsCall?: (request: any) => Promise<any>;
  private handleResourcesList?: (request: any) => Promise<any>;
  private handleResourcesRead?: (request: any) => Promise<any>;
  private handlePromptsList?: (request: any) => Promise<any>;
  private handlePromptsGet?: (request: any) => Promise<any>;

  /**
   * Set MCP handlers to be called by HTTP endpoints
   */
  setMCPHandlers(handlers: {
    handleToolsList: (request: any) => Promise<any>;
    handleToolsCall: (request: any) => Promise<any>;
    handleResourcesList: (request: any) => Promise<any>;
    handleResourcesRead: (request: any) => Promise<any>;
    handlePromptsList: (request: any) => Promise<any>;
    handlePromptsGet: (request: any) => Promise<any>;
  }) {
    this.handleToolsList = handlers.handleToolsList;
    this.handleToolsCall = handlers.handleToolsCall;
    this.handleResourcesList = handlers.handleResourcesList;
    this.handleResourcesRead = handlers.handleResourcesRead;
    this.handlePromptsList = handlers.handlePromptsList;
    this.handlePromptsGet = handlers.handlePromptsGet;
    this.logger.info('MCP handlers registered with HTTP transport');
  }

  /**
   * Attach the MCP server instance to this HTTP transport so it can create Streamable transports
   */
  setMCPServer(mcpServer: any) {
    this.mcpServer = mcpServer;
    this.logger.info('MCP server attached to HTTP transport');
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const port = this.options.port || 3000;
      const host = this.options.host || '0.0.0.0';
      
      this.server = this.app.listen(port, host, () => {
        // Configure server timeouts for long-lived SSE/streamable connections
        try {
          (this.server as any).timeout = 0;
          (this.server as any).keepAliveTimeout = 0;
          (this.server as any).headersTimeout = 0;
        } catch (e) {
          // ignore if platform doesn't support settings
        }

        this.logger.info('HTTP transport started', {
          port,
          host
        });
        resolve();
      });

      this.server.on('error', (error) => {
        this.logger.error('HTTP server error', { error: error instanceof Error ? error.message : String(error) });
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
   * Get the HTTP transport instance
   * @returns The HTTP transport or undefined if not created or not in HTTP mode
   * @example
   * ```typescript
   * const httpTransport = transportManager.getHttpTransport();
   * if (httpTransport) {
   *   httpTransport.setMCPHandlers(handlers);
   * }
   * ```
   */
  getHttpTransport(): HttpTransport | undefined {
    return this.httpTransport;
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
    // Consider HTTP transport as ready when httpTransport exists, or stdio when transport exists
    return !!this.transport || !!this.httpTransport;
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
