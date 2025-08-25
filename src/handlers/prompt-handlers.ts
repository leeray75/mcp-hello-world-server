/**
 * @fileoverview Prompt request handlers for MCP protocol
 * @module handlers/promptHandlers
 * @author MCP Hello World Server
 * @since 1.0.0
 */

import { createLogger, Logger } from '../utils/logger.js';
import { PromptService } from '../services/prompt-service.js';
import { MCPListPromptsResponse, MCPPromptResponse } from '../types/mcp-types.js';
import { PromptHandlerConfig } from '../types/server-types.js';

/**
 * Prompt handlers class for processing MCP prompt requests
 * @description Handles routing and processing of prompt-related MCP requests
 * @example
 * ```typescript
 * const promptHandlers = new PromptHandlers({
 *   logger: createLogger('PromptHandlers'),
 *   promptService: promptService
 * });
 * ```
 */
export class PromptHandlers {
  /** Logger instance for this handler */
  private readonly logger: Logger;
  /** Prompt service instance */
  private readonly promptService: PromptService;
  /** Whether to log requests and responses */
  private readonly logRequests: boolean;

  /**
   * Create a new prompt handlers instance
   * @param config - Configuration for the prompt handlers
   * @example
   * ```typescript
   * const promptHandlers = new PromptHandlers({
   *   logger: createLogger('PromptHandlers'),
   *   promptService: promptService,
   *   logRequests: true
   * });
   * ```
   */
  constructor(config: PromptHandlerConfig) {
    this.logger = config.logger;
    this.promptService = config.promptService;
    this.logRequests = config.logRequests ?? true;
    this.logger.info('Prompt handlers initialized', { 
      logRequests: this.logRequests 
    });
  }

  /**
   * Handle list prompts request
   * @returns Promise resolving to list of available prompts
   * @throws Error if prompt listing fails
   * @example
   * ```typescript
   * const response = await promptHandlers.handleListPrompts();
   * console.log(`Found ${response.prompts.length} prompts`);
   * ```
   */
  async handleListPrompts(): Promise<MCPListPromptsResponse> {
    const startTime = Date.now();
    
    if (this.logRequests) {
      this.logger.info('Handling list prompts request');
    }

    try {
      const prompts = this.promptService.getAvailablePrompts();
      
      const response: MCPListPromptsResponse = {
        prompts,
      };

      const processingTime = Date.now() - startTime;
      
      if (this.logRequests) {
        this.logger.info('List prompts request completed', { 
          promptCount: prompts.length,
          processingTime,
          success: true 
        });
      }

      return response;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error('List prompts request failed', { 
        processingTime,
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }

  /**
   * Handle get prompt request
   * @param request - The prompt generation request containing prompt name and arguments
   * @returns Promise resolving to prompt generation response
   * @throws Error if prompt generation fails
   * @example
   * ```typescript
   * const response = await promptHandlers.handleGetPrompt({
   *   params: {
   *     name: 'greeting',
   *     arguments: { name: 'Alice', style: 'formal' }
   *   }
   * });
   * ```
   */
  async handleGetPrompt(request: {
    params: {
      name: string;
      arguments?: Record<string, unknown>;
    };
  }): Promise<MCPPromptResponse> {
    const startTime = Date.now();
    const { name: promptName, arguments: args } = request.params;
    
    if (this.logRequests) {
      this.logger.info('Handling get prompt request', { 
        promptName, 
        hasArguments: !!args 
      });
    }

    try {
      // Validate request structure
      if (!promptName || typeof promptName !== 'string') {
        throw new Error('Prompt name is required and must be a string');
      }

      // Generate the prompt
      const response = await this.promptService.generatePrompt(
        promptName, 
        args || {}
      );

      const processingTime = Date.now() - startTime;
      
      if (this.logRequests) {
        this.logger.info('Get prompt request completed', { 
          promptName,
          processingTime,
          messageCount: response.messages.length,
          success: true 
        });
      }

      return response;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error('Get prompt request failed', { 
        promptName,
        processingTime,
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }

  /**
   * Handle prompt-related requests with automatic routing
   * @param requestType - The type of prompt request
   * @param request - The request data
   * @returns Promise resolving to appropriate response
   * @throws Error if request type is unsupported or execution fails
   * @example
   * ```typescript
   * // List prompts
   * const listResponse = await promptHandlers.handleRequest('list', {});
   * 
   * // Get prompt
   * const getResponse = await promptHandlers.handleRequest('get', {
   *   params: { name: 'greeting', arguments: { name: 'Alice' } }
   * });
   * ```
   */
  async handleRequest(
    requestType: 'list' | 'get',
    request: any
  ): Promise<MCPListPromptsResponse | MCPPromptResponse> {
    this.logger.debug('Routing prompt request', { requestType });

    switch (requestType) {
      case 'list':
        return await this.handleListPrompts();
      case 'get':
        return await this.handleGetPrompt(request);
      default:
        throw new Error(`Unsupported prompt request type: ${requestType}`);
    }
  }

  /**
   * Validate get prompt request structure
   * @param request - The request to validate
   * @returns True if request is valid
   * @throws Error if request is invalid
   * @example
   * ```typescript
   * const isValid = promptHandlers.validateGetPromptRequest({
   *   params: { name: 'greeting', arguments: { name: 'Alice' } }
   * });
   * ```
   */
  validateGetPromptRequest(request: any): boolean {
    if (!request || typeof request !== 'object') {
      throw new Error('Request must be an object');
    }

    if (!request.params || typeof request.params !== 'object') {
      throw new Error('Request must have a params object');
    }

    if (!request.params.name || typeof request.params.name !== 'string') {
      throw new Error('Prompt name is required and must be a string');
    }

    if (request.params.arguments !== undefined && 
        (typeof request.params.arguments !== 'object' || 
         request.params.arguments === null)) {
      throw new Error('Prompt arguments must be an object if provided');
    }

    return true;
  }

  /**
   * Get handler statistics
   * @returns Handler usage statistics
   * @example
   * ```typescript
   * const stats = promptHandlers.getStats();
   * console.log(`Prompts handled: ${stats.promptsHandled}`);
   * ```
   */
  getStats(): {
    handlersActive: boolean;
    promptService: any;
    lastRequest?: Date;
  } {
    return {
      handlersActive: true,
      promptService: this.promptService.getHealth(),
    };
  }

  /**
   * Get handler health information
   * @returns Handler health status
   * @example
   * ```typescript
   * const health = promptHandlers.getHealth();
   * console.log(`Handlers healthy: ${health.healthy}`);
   * ```
   */
  getHealth(): { 
    healthy: boolean; 
    handlersInitialized: boolean;
    serviceHealth: any;
  } {
    const serviceHealth = this.promptService.getHealth();
    
    return {
      healthy: serviceHealth.healthy,
      handlersInitialized: true,
      serviceHealth,
    };
  }

  /**
   * Check if a prompt is available
   * @param promptName - The name of the prompt to check
   * @returns True if prompt is available
   * @example
   * ```typescript
   * const available = promptHandlers.isPromptAvailable('greeting');
   * if (available) {
   *   console.log('Prompt can be generated');
   * }
   * ```
   */
  isPromptAvailable(promptName: string): boolean {
    return this.promptService.hasPromptSync(promptName);
  }

  /**
   * Get available prompt names
   * @returns Array of available prompt names
   * @example
   * ```typescript
   * const promptNames = promptHandlers.getAvailablePromptNames();
   * console.log(`Available prompts: ${promptNames.join(', ')}`);
   * ```
   */
  getAvailablePromptNames(): string[] {
    const prompts = this.promptService.getAvailablePrompts();
    return prompts.map(prompt => prompt.name);
  }

  /**
   * Get prompt statistics from service
   * @returns Prompt statistics
   * @example
   * ```typescript
   * const stats = promptHandlers.getPromptStats();
   * console.log(`Total prompts: ${stats.totalPrompts}`);
   * ```
   */
  getPromptStats(): {
    totalPrompts: number;
    promptsByType: Record<string, number>;
    lastGenerated?: Date;
  } {
    return this.promptService.getPromptStats();
  }

  /**
   * Get available greeting styles
   * @returns Array of greeting style options
   * @example
   * ```typescript
   * const styles = promptHandlers.getGreetingStyles();
   * console.log(`Available styles: ${styles.join(', ')}`);
   * ```
   */
  getGreetingStyles(): string[] {
    return this.promptService.getGreetingStyles();
  }

  /**
   * Get available audience types
   * @returns Array of audience type options
   * @example
   * ```typescript
   * const audiences = promptHandlers.getAudienceTypes();
   * console.log(`Available audiences: ${audiences.join(', ')}`);
   * ```
   */
  getAudienceTypes(): string[] {
    return this.promptService.getAudienceTypes();
  }
}

/**
 * Create prompt handlers with default configuration
 * @param promptService - The prompt service instance to use
 * @param config - Optional configuration overrides
 * @returns Configured prompt handlers instance
 * @example
 * ```typescript
 * const promptHandlers = createPromptHandlers(promptService);
 * // or with custom config
 * const promptHandlers = createPromptHandlers(promptService, {
 *   logger: createLogger('MyPromptHandlers'),
 *   logRequests: false
 * });
 * ```
 */
export function createPromptHandlers(
  promptService: PromptService,
  config?: Partial<Omit<PromptHandlerConfig, 'promptService'>>
): PromptHandlers {
  const defaultConfig: PromptHandlerConfig = {
    logger: createLogger('PromptHandlers'),
    logRequests: true,
    promptService,
    ...config,
  };

  return new PromptHandlers(defaultConfig);
}
