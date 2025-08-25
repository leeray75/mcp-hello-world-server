/**
 * @fileoverview Tool service containing business logic for MCP tools
 * @module services/toolService
 * @author MCP Hello World Server
 * @since 1.0.0
 */

import { createLogger, Logger } from '../utils/logger.js';
import { TOOL_NAMES } from '../utils/constants.js';
import { validateToolArguments, ToolArguments } from '../utils/validators.js';
import { MCPTool, MCPToolResponse, ToolExecutionContext } from '../types/mcp-types.js';
import { ToolServiceConfig } from '../types/server-types.js';

/**
 * Tool service class for handling tool business logic
 * @description Encapsulates all tool-related business operations
 * @example
 * ```typescript
 * const toolService = new ToolService({ logger: createLogger('ToolService') });
 * const tools = toolService.getAvailableTools();
 * const result = await toolService.executeTool('say_hello', { name: 'Alice' });
 * ```
 */
export class ToolService {
  /** Logger instance for this service */
  private readonly logger: Logger;
  /** Whether to validate tool arguments */
  private readonly validateArguments: boolean;

  /**
   * Create a new tool service instance
   * @param config - Configuration for the tool service
   * @example
   * ```typescript
   * const toolService = new ToolService({
   *   logger: createLogger('ToolService'),
   *   validateArguments: true
   * });
   * ```
   */
  constructor(config: ToolServiceConfig) {
    this.logger = config.logger;
    this.validateArguments = config.validateArguments ?? true;
    this.logger.info('Tool service initialized', { 
      validateArguments: this.validateArguments 
    });
  }

  /**
   * Get all available tools
   * @returns Array of available MCP tools
   * @example
   * ```typescript
   * const tools = toolService.getAvailableTools();
   * console.log(`Found ${tools.length} tools`);
   * ```
   */
  getAvailableTools(): MCPTool[] {
    this.logger.debug('Getting available tools');
    
    return [
      {
        name: TOOL_NAMES.SAY_HELLO,
        description: 'Says hello to a person with an optional custom message',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'The name of the person to greet',
            },
            message: {
              type: 'string',
              description: 'Optional custom message',
            },
          },
          required: ['name'],
        },
      },
      {
        name: TOOL_NAMES.GET_TIME,
        description: 'Returns the current server time',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ];
  }

  /**
   * Execute a tool with the given arguments
   * @param toolName - The name of the tool to execute
   * @param args - The arguments to pass to the tool
   * @returns Promise resolving to tool response
   * @throws Error if tool name is invalid or execution fails
   * @example
   * ```typescript
   * const response = await toolService.executeTool('say_hello', { 
   *   name: 'Alice', 
   *   message: 'Good morning' 
   * });
   * console.log(response.content[0].text);
   * ```
   */
  async executeTool(toolName: string, args: ToolArguments): Promise<MCPToolResponse> {
    const context: ToolExecutionContext = {
      toolName,
      arguments: args,
      startTime: new Date(),
    };

    this.logger.info('Executing tool', { 
      toolName, 
      arguments: args,
      requestId: context.requestId 
    });

    try {
      // Validate arguments if enabled
      if (this.validateArguments) {
        const validation = validateToolArguments(toolName, args);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }
      }

      // Execute the specific tool
      let response: MCPToolResponse;
      switch (toolName) {
        case TOOL_NAMES.SAY_HELLO:
          response = await this.executeSayHello(args, context);
          break;
        case TOOL_NAMES.GET_TIME:
          response = await this.executeGetTime(args, context);
          break;
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }

      const executionTime = Date.now() - context.startTime.getTime();
      this.logger.info('Tool execution completed', { 
        toolName, 
        executionTime,
        success: true 
      });

      return response;
    } catch (error) {
      const executionTime = Date.now() - context.startTime.getTime();
      this.logger.error('Tool execution failed', { 
        toolName, 
        executionTime,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Execute the say_hello tool
   * @param args - Tool arguments
   * @param context - Execution context
   * @returns Promise resolving to tool response
   * @private
   * @example
   * ```typescript
   * // Internal usage only
   * const response = await this.executeSayHello({ name: 'Alice' }, context);
   * ```
   */
  private async executeSayHello(
    args: ToolArguments, 
    context: ToolExecutionContext
  ): Promise<MCPToolResponse> {
    this.logger.debug('Executing say_hello tool', { args });

    const personName = args.name as string;
    const customMessage = args.message as string | undefined;
    
    const greeting = customMessage 
      ? `${customMessage}, ${personName}!`
      : `Hello, ${personName}! Welcome to the MCP Hello World Server.`;
    
    this.logger.debug('Generated greeting', { greeting, personName, customMessage });

    return {
      content: [
        {
          type: 'text',
          text: greeting,
        },
      ],
    };
  }

  /**
   * Execute the get_time tool
   * @param args - Tool arguments (unused for this tool)
   * @param context - Execution context
   * @returns Promise resolving to tool response
   * @private
   * @example
   * ```typescript
   * // Internal usage only
   * const response = await this.executeGetTime({}, context);
   * ```
   */
  private async executeGetTime(
    args: ToolArguments, 
    context: ToolExecutionContext
  ): Promise<MCPToolResponse> {
    this.logger.debug('Executing get_time tool');

    const currentTime = new Date().toISOString();
    
    this.logger.debug('Generated time response', { currentTime });

    return {
      content: [
        {
          type: 'text',
          text: `Current server time: ${currentTime}`,
        },
      ],
    };
  }

  /**
   * Check if a tool exists
   * @param toolName - The name of the tool to check
   * @returns True if the tool exists, false otherwise
   * @example
   * ```typescript
   * const exists = toolService.hasToolSync('say_hello');
   * if (exists) {
   *   console.log('Tool is available');
   * }
   * ```
   */
  hasToolSync(toolName: string): boolean {
    const validTools = Object.values(TOOL_NAMES);
    return validTools.includes(toolName as typeof validTools[number]);
  }

  /**
   * Get tool definition by name
   * @param toolName - The name of the tool
   * @returns Tool definition or undefined if not found
   * @example
   * ```typescript
   * const tool = toolService.getToolDefinition('say_hello');
   * if (tool) {
   *   console.log(tool.description);
   * }
   * ```
   */
  getToolDefinition(toolName: string): MCPTool | undefined {
    const tools = this.getAvailableTools();
    return tools.find(tool => tool.name === toolName);
  }

  /**
   * Get service health information
   * @returns Service health status
   * @example
   * ```typescript
   * const health = toolService.getHealth();
   * console.log(`Service healthy: ${health.healthy}`);
   * ```
   */
  getHealth(): { healthy: boolean; tools: number; lastExecuted?: Date } {
    const tools = this.getAvailableTools();
    return {
      healthy: true,
      tools: tools.length,
    };
  }
}

/**
 * Create a tool service instance with default configuration
 * @param config - Optional configuration overrides
 * @returns Configured tool service instance
 * @example
 * ```typescript
 * const toolService = createToolService();
 * // or with custom config
 * const toolService = createToolService({ 
 *   logger: createLogger('MyToolService'),
 *   validateArguments: false
 * });
 * ```
 */
export function createToolService(config?: Partial<ToolServiceConfig>): ToolService {
  const defaultConfig: ToolServiceConfig = {
    logger: createLogger('ToolService'),
    validateArguments: true,
    ...config,
  };

  return new ToolService(defaultConfig);
}
