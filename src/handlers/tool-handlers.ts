/**
 * @fileoverview Tool request handlers for MCP protocol
 * @module handlers/toolHandlers
 * @author MCP Hello World Server
 * @since 1.0.0
 */

import { createLogger, Logger } from '../utils/logger.js';
import { ToolService } from '../services/tool-service.js';
import { MCPListToolsResponse, MCPToolResponse } from '../types/mcp-types.js';
import { ToolHandlerConfig } from '../types/server-types.js';

/**
 * Tool handlers class for processing MCP tool requests
 * @description Handles routing and processing of tool-related MCP requests
 * @example
 * ```typescript
 * const toolHandlers = new ToolHandlers({
 *   logger: createLogger('ToolHandlers'),
 *   toolService: toolService
 * });
 * ```
 */
export class ToolHandlers {
  /** Logger instance for this handler */
  private readonly logger: Logger;
  /** Tool service instance */
  private readonly toolService: ToolService;
  /** Whether to log requests and responses */
  private readonly logRequests: boolean;

  /**
   * Create a new tool handlers instance
   * @param config - Configuration for the tool handlers
   * @example
   * ```typescript
   * const toolHandlers = new ToolHandlers({
   *   logger: createLogger('ToolHandlers'),
   *   toolService: toolService,
   *   logRequests: true
   * });
   * ```
   */
  constructor(config: ToolHandlerConfig) {
    this.logger = config.logger;
    this.toolService = config.toolService;
    this.logRequests = config.logRequests ?? true;
    this.logger.info('Tool handlers initialized', { 
      logRequests: this.logRequests 
    });
  }

  /**
   * Handle list tools request
   * @returns Promise resolving to list of available tools
   * @throws Error if tool listing fails
   * @example
   * ```typescript
   * const response = await toolHandlers.handleListTools();
   * console.log(`Found ${response.tools.length} tools`);
   * ```
   */
  async handleListTools(): Promise<MCPListToolsResponse> {
    const startTime = Date.now();
    
    if (this.logRequests) {
      this.logger.info('Handling list tools request');
    }

    try {
      const tools = this.toolService.getAvailableTools();
      
      const response: MCPListToolsResponse = {
        tools,
      };

      const processingTime = Date.now() - startTime;
      
      if (this.logRequests) {
        this.logger.info('List tools request completed', { 
          toolCount: tools.length,
          processingTime,
          success: true 
        });
      }

      return response;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error('List tools request failed', { 
        processingTime,
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }

  /**
   * Handle call tool request
   * @param request - The tool call request containing tool name and arguments
   * @returns Promise resolving to tool execution response
   * @throws Error if tool execution fails
   * @example
   * ```typescript
   * const response = await toolHandlers.handleCallTool({
   *   params: {
   *     name: 'say_hello',
   *     arguments: { name: 'Alice' }
   *   }
   * });
   * ```
   */
  async handleCallTool(request: {
    params: {
      name: string;
      arguments?: Record<string, unknown>;
    };
  }): Promise<MCPToolResponse> {
    const startTime = Date.now();
    const { name: toolName, arguments: args } = request.params;
    
    if (this.logRequests) {
      this.logger.info('Handling call tool request', { 
        toolName, 
        hasArguments: !!args 
      });
    }

    try {
      // Validate request structure
      if (!toolName || typeof toolName !== 'string') {
        throw new Error('Tool name is required and must be a string');
      }

      // Execute the tool
      const response = await this.toolService.executeTool(
        toolName, 
        args || {}
      );

      const processingTime = Date.now() - startTime;
      
      if (this.logRequests) {
        this.logger.info('Call tool request completed', { 
          toolName,
          processingTime,
          contentItems: response.content.length,
          success: true 
        });
      }

      return response;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error('Call tool request failed', { 
        toolName,
        processingTime,
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }

  /**
   * Handle tool-related requests with automatic routing
   * @param requestType - The type of tool request
   * @param request - The request data
   * @returns Promise resolving to appropriate response
   * @throws Error if request type is unsupported or execution fails
   * @example
   * ```typescript
   * // List tools
   * const listResponse = await toolHandlers.handleRequest('list', {});
   * 
   * // Call tool
   * const callResponse = await toolHandlers.handleRequest('call', {
   *   params: { name: 'say_hello', arguments: { name: 'Alice' } }
   * });
   * ```
   */
  async handleRequest(
    requestType: 'list' | 'call',
    request: any
  ): Promise<MCPListToolsResponse | MCPToolResponse> {
    this.logger.debug('Routing tool request', { requestType });

    switch (requestType) {
      case 'list':
        return await this.handleListTools();
      case 'call':
        return await this.handleCallTool(request);
      default:
        throw new Error(`Unsupported tool request type: ${requestType}`);
    }
  }

  /**
   * Validate tool call request structure
   * @param request - The request to validate
   * @returns True if request is valid
   * @throws Error if request is invalid
   * @example
   * ```typescript
   * const isValid = toolHandlers.validateCallToolRequest({
   *   params: { name: 'say_hello', arguments: { name: 'Alice' } }
   * });
   * ```
   */
  validateCallToolRequest(request: any): boolean {
    if (!request || typeof request !== 'object') {
      throw new Error('Request must be an object');
    }

    if (!request.params || typeof request.params !== 'object') {
      throw new Error('Request must have a params object');
    }

    if (!request.params.name || typeof request.params.name !== 'string') {
      throw new Error('Tool name is required and must be a string');
    }

    if (request.params.arguments !== undefined && 
        (typeof request.params.arguments !== 'object' || 
         request.params.arguments === null)) {
      throw new Error('Tool arguments must be an object if provided');
    }

    return true;
  }

  /**
   * Get handler statistics
   * @returns Handler usage statistics
   * @example
   * ```typescript
   * const stats = toolHandlers.getStats();
   * console.log(`Tools handled: ${stats.toolsHandled}`);
   * ```
   */
  getStats(): {
    handlersActive: boolean;
    toolService: any;
    lastRequest?: Date;
  } {
    return {
      handlersActive: true,
      toolService: this.toolService.getHealth(),
    };
  }

  /**
   * Get handler health information
   * @returns Handler health status
   * @example
   * ```typescript
   * const health = toolHandlers.getHealth();
   * console.log(`Handlers healthy: ${health.healthy}`);
   * ```
   */
  getHealth(): { 
    healthy: boolean; 
    handlersInitialized: boolean;
    serviceHealth: any;
  } {
    const serviceHealth = this.toolService.getHealth();
    
    return {
      healthy: serviceHealth.healthy,
      handlersInitialized: true,
      serviceHealth,
    };
  }

  /**
   * Check if a tool is available
   * @param toolName - The name of the tool to check
   * @returns True if tool is available
   * @example
   * ```typescript
   * const available = toolHandlers.isToolAvailable('say_hello');
   * if (available) {
   *   console.log('Tool can be called');
   * }
   * ```
   */
  isToolAvailable(toolName: string): boolean {
    return this.toolService.hasToolSync(toolName);
  }

  /**
   * Get available tool names
   * @returns Array of available tool names
   * @example
   * ```typescript
   * const toolNames = toolHandlers.getAvailableToolNames();
   * console.log(`Available tools: ${toolNames.join(', ')}`);
   * ```
   */
  getAvailableToolNames(): string[] {
    const tools = this.toolService.getAvailableTools();
    return tools.map(tool => tool.name);
  }
}

/**
 * Create tool handlers with default configuration
 * @param toolService - The tool service instance to use
 * @param config - Optional configuration overrides
 * @returns Configured tool handlers instance
 * @example
 * ```typescript
 * const toolHandlers = createToolHandlers(toolService);
 * // or with custom config
 * const toolHandlers = createToolHandlers(toolService, {
 *   logger: createLogger('MyToolHandlers'),
 *   logRequests: false
 * });
 * ```
 */
export function createToolHandlers(
  toolService: ToolService,
  config?: Partial<Omit<ToolHandlerConfig, 'toolService'>>
): ToolHandlers {
  const defaultConfig: ToolHandlerConfig = {
    logger: createLogger('ToolHandlers'),
    logRequests: true,
    toolService,
    ...config,
  };

  return new ToolHandlers(defaultConfig);
}
