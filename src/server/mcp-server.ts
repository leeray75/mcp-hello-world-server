/**
 * @fileoverview Main MCP server configuration and setup module
 * @module server/mcpServer
 * @author MCP Hello World Server Team
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { ToolHandlers } from '../handlers/tool-handlers.js';
import { ResourceHandlers } from '../handlers/resource-handlers.js';
import { PromptHandlers } from '../handlers/prompt-handlers.js';
import { ToolService } from '../services/tool-service.js';
import { ResourceService } from '../services/resource-service.js';
import { PromptService } from '../services/prompt-service.js';
import { TransportManager } from './transport.js';
import { createLogger } from '../utils/logger.js';
import { SERVER_INFO } from '../utils/constants.js';
import type { ServerConfig } from '../types/server-types.js';

/**
 * Main MCP server class that orchestrates all components
 * @description Manages the MCP server lifecycle, request handlers, and service coordination
 * @example
 * ```typescript
 * const mcpServer = new MCPServer();
 * await mcpServer.start();
 * ```
 */
export class MCPServer {
  private server: Server;
  private transportManager: TransportManager;
  private toolHandlers: ToolHandlers;
  private resourceHandlers: ResourceHandlers;
  private promptHandlers: PromptHandlers;
  private logger = createLogger('MCPServer');
  private isRunning = false;

  /**
   * Creates a new MCP server instance
   * @param config Optional server configuration
   */
  constructor(config?: ServerConfig) {
    this.logger.info('Initializing MCP server', { config });

    // Initialize server with capabilities
    this.server = new Server(SERVER_INFO, {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    });

    // Initialize services with proper configurations
    const toolService = new ToolService({
      logger: createLogger('ToolService'),
      validateArguments: true,
    });
    const resourceService = new ResourceService({
      logger: createLogger('ResourceService'),
      validateUris: true,
    });
    const promptService = new PromptService({
      logger: createLogger('PromptService'),
      validateArguments: true,
    });

    // Initialize handlers with proper configurations
    this.toolHandlers = new ToolHandlers({
      logger: createLogger('ToolHandlers'),
      toolService,
      logRequests: true,
    });
    this.resourceHandlers = new ResourceHandlers({
      logger: createLogger('ResourceHandlers'),
      resourceService,
      logRequests: true,
    });
    this.promptHandlers = new PromptHandlers({
      logger: createLogger('PromptHandlers'),
      promptService,
      logRequests: true,
    });

    // Determine transport type from environment variable
    const transportType = (process.env.TRANSPORT as 'stdio' | 'http') || 'stdio';
    
    // Get port from environment variable or use default
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
    
    // Initialize transport manager with proper configuration
    this.transportManager = new TransportManager({
      type: transportType,
      logger: createLogger('Transport'),
      options: transportType === 'http' ? { port } : {},
    });

    this.setupRequestHandlers();
    this.setupErrorHandling();
  }

  /**
   * Sets up MCP request handlers for all supported operations
   * @description Binds tool, resource, and prompt handlers to the MCP server
   * @private
   */
  private setupRequestHandlers(): void {
    this.logger.debug('Setting up request handlers');

    // Tool handlers - convert our types to SDK types
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const response = await this.toolHandlers.handleListTools();
      return { tools: response.tools };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const response = await this.toolHandlers.handleCallTool(request);
      return { content: response.content };
    });

    // Resource handlers - convert our types to SDK types
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      const response = await this.resourceHandlers.handleListResources();
      return { resources: response.resources };
    });

    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const response = await this.resourceHandlers.handleReadResource(request);
      return { contents: response.contents };
    });

    // Prompt handlers - convert our types to SDK types
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      const response = await this.promptHandlers.handleListPrompts();
      return { prompts: response.prompts };
    });

    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const response = await this.promptHandlers.handleGetPrompt(request);
      return { 
        description: response.description,
        messages: response.messages 
      };
    });

    this.logger.info('Request handlers configured successfully');
  }

  /**
   * Sets up error handling and graceful shutdown
   * @description Configures signal handlers for clean server shutdown
   * @private
   */
  private setupErrorHandling(): void {
    // Handle graceful shutdown signals
    process.on('SIGINT', this.handleShutdown.bind(this));
    process.on('SIGTERM', this.handleShutdown.bind(this));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      this.logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      this.handleShutdown();
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      this.logger.error('Unhandled promise rejection', { reason, promise });
    });

    this.logger.debug('Error handling configured');
  }

  /**
   * Starts the MCP server with the configured transport
   * @description Initializes transport and connects the server
   * @throws {Error} If server is already running or fails to start
   * @example
   * ```typescript
   * try {
   *   await mcpServer.start();
   *   console.log('Server started successfully');
   * } catch (error) {
   *   console.error('Failed to start server:', error);
   * }
   * ```
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Server is already running');
    }

    try {
      this.logger.info('Starting MCP server');

      const transportType = this.transportManager.getConfig().type;

      if (transportType === 'stdio') {
        // Create and connect STDIO transport
        const transport = this.transportManager.createTransport();
        if (!transport) {
          throw new Error('Failed to create STDIO transport');
        }
        await this.server.connect(transport);
      } else if (transportType === 'http') {
        // Create HTTP transport and start it
        this.transportManager.createTransport(); // This creates the HTTP transport internally
        await this.transportManager.start(); // This starts the HTTP server
        
        // Register MCP handlers with HTTP transport
        const httpTransport = this.transportManager.getHttpTransport();
        if (httpTransport) {
          // Attach the MCP server instance to the HTTP transport so it can create/
          // manage StreamableHTTPServerTransport sessions for the inspector (initialize flow).
          if (typeof (httpTransport as any).setMCPServer === 'function') {
            (httpTransport as any).setMCPServer(this.server);
            this.logger.info('Attached MCP server to HTTP transport for streamable sessions');
          }

          httpTransport.setMCPHandlers({
            handleToolsList: async () => {
              const response = await this.toolHandlers.handleListTools();
              return { tools: response.tools };
            },
            handleToolsCall: async (request: any) => {
              const response = await this.toolHandlers.handleCallTool(request);
              return { content: response.content };
            },
            handleResourcesList: async () => {
              const response = await this.resourceHandlers.handleListResources();
              return { resources: response.resources };
            },
            handleResourcesRead: async (request: any) => {
              const response = await this.resourceHandlers.handleReadResource(request);
              return { contents: response.contents };
            },
            handlePromptsList: async () => {
              const response = await this.promptHandlers.handleListPrompts();
              return { prompts: response.prompts };
            },
            handlePromptsGet: async (request: any) => {
              const response = await this.promptHandlers.handleGetPrompt(request);
              return { 
                description: response.description,
                messages: response.messages 
              };
            },
          });
          this.logger.info('MCP handlers registered with HTTP transport');
        }
        // For HTTP mode, we don't connect a transport to the MCP server
        // The HTTP endpoints handle MCP requests directly
      } else {
        throw new Error(`Unsupported transport type: ${transportType}`);
      }

      this.isRunning = true;
      this.logger.info('MCP server started successfully', {
        serverName: SERVER_INFO.name,
        version: SERVER_INFO.version,
        transport: transportType,
      });
    } catch (error) {
      this.logger.error('Failed to start MCP server', { error });
      throw error;
    }
  }

  /**
   * Stops the MCP server and cleans up resources
   * @description Gracefully shuts down the server and transport
   * @throws {Error} If server fails to stop cleanly
   * @example
   * ```typescript
   * await mcpServer.stop();
   * console.log('Server stopped');
   * ```
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      this.logger.warn('Server is not running');
      return;
    }

    try {
      this.logger.info('Stopping MCP server');

      // Close server connection
      await this.server.close();

      // Cleanup transport
      await this.transportManager.cleanup();

      this.isRunning = false;
      this.logger.info('MCP server stopped successfully');
    } catch (error) {
      this.logger.error('Error stopping MCP server', { error });
      throw error;
    }
  }

  /**
   * Handles shutdown signals for graceful server termination
   * @description Internal method for processing shutdown signals
   * @private
   */
  private async handleShutdown(): Promise<void> {
    this.logger.info('Received shutdown signal, shutting down gracefully...');

    try {
      await this.stop();
      process.exit(0);
    } catch (error) {
      this.logger.error('Error during shutdown', { error });
      process.exit(1);
    }
  }

  /**
   * Gets the current server status
   * @returns Object containing server status information
   * @example
   * ```typescript
   * const status = mcpServer.getStatus();
   * console.log(`Server running: ${status.isRunning}`);
   * ```
   */
  getStatus(): { isRunning: boolean; serverInfo: typeof SERVER_INFO } {
    return {
      isRunning: this.isRunning,
      serverInfo: SERVER_INFO,
    };
  }
}
