/**
 * @fileoverview Prompt service containing business logic for MCP prompts
 * @module services/promptService
 * @author MCP Hello World Server
 * @since 1.0.0
 */

import { createLogger, Logger } from '../utils/logger.js';
import { PROMPT_NAMES, GREETING_STYLES, AUDIENCE_TYPES } from '../utils/constants.js';
import { validatePromptArguments, PromptArguments } from '../utils/validators.js';
import { MCPPrompt, MCPPromptResponse, PromptGenerationContext } from '../types/mcp-types.js';
import { PromptServiceConfig } from '../types/server-types.js';

/**
 * Prompt service class for handling prompt business logic
 * @description Encapsulates all prompt-related business operations
 * @example
 * ```typescript
 * const promptService = new PromptService({ logger: createLogger('PromptService') });
 * const prompts = promptService.getAvailablePrompts();
 * const result = await promptService.generatePrompt('greeting', { name: 'Alice' });
 * ```
 */
export class PromptService {
  /** Logger instance for this service */
  private readonly logger: Logger;
  /** Whether to validate prompt arguments */
  private readonly validateArguments: boolean;

  /**
   * Create a new prompt service instance
   * @param config - Configuration for the prompt service
   * @example
   * ```typescript
   * const promptService = new PromptService({
   *   logger: createLogger('PromptService'),
   *   validateArguments: true
   * });
   * ```
   */
  constructor(config: PromptServiceConfig) {
    this.logger = config.logger;
    this.validateArguments = config.validateArguments ?? true;
    this.logger.info('Prompt service initialized', { 
      validateArguments: this.validateArguments 
    });
  }

  /**
   * Get all available prompts
   * @returns Array of available MCP prompts
   * @example
   * ```typescript
   * const prompts = promptService.getAvailablePrompts();
   * console.log(`Found ${prompts.length} prompts`);
   * ```
   */
  getAvailablePrompts(): MCPPrompt[] {
    this.logger.debug('Getting available prompts');
    
    return [
      {
        name: PROMPT_NAMES.GREETING,
        description: 'Generate a personalized greeting message',
        arguments: [
          {
            name: 'name',
            description: 'The name of the person to greet',
            required: true,
          },
          {
            name: 'style',
            description: 'Greeting style (formal, casual, friendly)',
            required: false,
          },
        ],
      },
      {
        name: PROMPT_NAMES.INTRODUCTION,
        description: 'Generate an introduction to MCP concepts',
        arguments: [
          {
            name: 'audience',
            description: 'Target audience (developer, user, manager)',
            required: false,
          },
        ],
      },
    ];
  }

  /**
   * Generate a prompt with the given arguments
   * @param promptName - The name of the prompt to generate
   * @param args - The arguments to pass to the prompt
   * @returns Promise resolving to prompt response
   * @throws Error if prompt name is invalid or generation fails
   * @example
   * ```typescript
   * const response = await promptService.generatePrompt('greeting', { 
   *   name: 'Alice', 
   *   style: 'formal' 
   * });
   * console.log(response.description);
   * ```
   */
  async generatePrompt(promptName: string, args: PromptArguments): Promise<MCPPromptResponse> {
    const context: PromptGenerationContext = {
      promptName,
      arguments: args,
      startTime: new Date(),
    };

    this.logger.info('Generating prompt', { 
      promptName, 
      arguments: args,
      requestId: context.requestId 
    });

    try {
      // Validate arguments if enabled
      if (this.validateArguments) {
        const validation = validatePromptArguments(promptName, args);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }
      }

      // Generate the specific prompt
      let response: MCPPromptResponse;
      switch (promptName) {
        case PROMPT_NAMES.GREETING:
          response = await this.generateGreetingPrompt(args, context);
          break;
        case PROMPT_NAMES.INTRODUCTION:
          response = await this.generateIntroductionPrompt(args, context);
          break;
        default:
          throw new Error(`Unknown prompt: ${promptName}`);
      }

      const generationTime = Date.now() - context.startTime.getTime();
      this.logger.info('Prompt generation completed', { 
        promptName, 
        generationTime,
        success: true 
      });

      return response;
    } catch (error) {
      const generationTime = Date.now() - context.startTime.getTime();
      this.logger.error('Prompt generation failed', { 
        promptName, 
        generationTime,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Generate the greeting prompt
   * @param args - Prompt arguments
   * @param context - Generation context
   * @returns Promise resolving to prompt response
   * @private
   * @example
   * ```typescript
   * // Internal usage only
   * const response = await this.generateGreetingPrompt({ name: 'Alice' }, context);
   * ```
   */
  private async generateGreetingPrompt(
    args: PromptArguments, 
    context: PromptGenerationContext
  ): Promise<MCPPromptResponse> {
    this.logger.debug('Generating greeting prompt', { args });

    const personName = args.name as string || 'there';
    const style = args.style as string || GREETING_STYLES.FRIENDLY;
    
    let promptText = '';
    let description = '';
    
    switch (style) {
      case GREETING_STYLES.FORMAL:
        promptText = `Generate a formal greeting for ${personName}. Use professional language and proper etiquette.`;
        description = `Formal greeting for ${personName}`;
        break;
      case GREETING_STYLES.CASUAL:
        promptText = `Generate a casual, relaxed greeting for ${personName}. Keep it informal and approachable.`;
        description = `Casual greeting for ${personName}`;
        break;
      default:
        promptText = `Generate a friendly and warm greeting for ${personName}. Make it welcoming and positive.`;
        description = `Friendly greeting for ${personName}`;
    }

    this.logger.debug('Generated greeting prompt', { 
      personName, 
      style, 
      promptLength: promptText.length 
    });

    return {
      description,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: promptText,
          },
        },
      ],
    };
  }

  /**
   * Generate the introduction prompt
   * @param args - Prompt arguments
   * @param context - Generation context
   * @returns Promise resolving to prompt response
   * @private
   * @example
   * ```typescript
   * // Internal usage only
   * const response = await this.generateIntroductionPrompt({ audience: 'developer' }, context);
   * ```
   */
  private async generateIntroductionPrompt(
    args: PromptArguments, 
    context: PromptGenerationContext
  ): Promise<MCPPromptResponse> {
    this.logger.debug('Generating introduction prompt', { args });

    const audience = args.audience as string || AUDIENCE_TYPES.DEVELOPER;
    let promptText = '';
    let description = '';
    
    switch (audience) {
      case AUDIENCE_TYPES.USER:
        promptText = 'Explain Model Context Protocol (MCP) in simple terms for end users. Focus on benefits and what it means for their AI experience.';
        description = 'MCP introduction for end users';
        break;
      case AUDIENCE_TYPES.MANAGER:
        promptText = 'Explain Model Context Protocol (MCP) for technical managers. Focus on business value, integration benefits, and strategic advantages.';
        description = 'MCP introduction for managers';
        break;
      default:
        promptText = 'Explain Model Context Protocol (MCP) for developers. Include technical details, implementation concepts, and practical examples.';
        description = 'MCP introduction for developers';
    }

    this.logger.debug('Generated introduction prompt', { 
      audience, 
      promptLength: promptText.length 
    });

    return {
      description,
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: promptText,
          },
        },
      ],
    };
  }

  /**
   * Check if a prompt exists
   * @param promptName - The name of the prompt to check
   * @returns True if the prompt exists, false otherwise
   * @example
   * ```typescript
   * const exists = promptService.hasPromptSync('greeting');
   * if (exists) {
   *   console.log('Prompt is available');
   * }
   * ```
   */
  hasPromptSync(promptName: string): boolean {
    const validPrompts = Object.values(PROMPT_NAMES);
    return validPrompts.includes(promptName as typeof validPrompts[number]);
  }

  /**
   * Get prompt definition by name
   * @param promptName - The name of the prompt
   * @returns Prompt definition or undefined if not found
   * @example
   * ```typescript
   * const prompt = promptService.getPromptDefinition('greeting');
   * if (prompt) {
   *   console.log(prompt.description);
   * }
   * ```
   */
  getPromptDefinition(promptName: string): MCPPrompt | undefined {
    const prompts = this.getAvailablePrompts();
    return prompts.find(prompt => prompt.name === promptName);
  }

  /**
   * Get available greeting styles
   * @returns Array of greeting style options
   * @example
   * ```typescript
   * const styles = promptService.getGreetingStyles();
   * console.log(`Available styles: ${styles.join(', ')}`);
   * ```
   */
  getGreetingStyles(): string[] {
    return Object.values(GREETING_STYLES);
  }

  /**
   * Get available audience types for introductions
   * @returns Array of audience type options
   * @example
   * ```typescript
   * const audiences = promptService.getAudienceTypes();
   * console.log(`Available audiences: ${audiences.join(', ')}`);
   * ```
   */
  getAudienceTypes(): string[] {
    return Object.values(AUDIENCE_TYPES);
  }

  /**
   * Get prompt statistics
   * @returns Prompt usage statistics
   * @example
   * ```typescript
   * const stats = promptService.getPromptStats();
   * console.log(`Total prompts: ${stats.totalPrompts}`);
   * ```
   */
  getPromptStats(): {
    totalPrompts: number;
    promptsByType: Record<string, number>;
    lastGenerated?: Date;
  } {
    const prompts = this.getAvailablePrompts();
    const promptsByType: Record<string, number> = {};

    // Count prompts by category (could be extended)
    prompts.forEach(prompt => {
      const category = prompt.name.includes('greeting') ? 'greeting' : 'informational';
      promptsByType[category] = (promptsByType[category] || 0) + 1;
    });

    return {
      totalPrompts: prompts.length,
      promptsByType,
    };
  }

  /**
   * Get service health information
   * @returns Service health status
   * @example
   * ```typescript
   * const health = promptService.getHealth();
   * console.log(`Service healthy: ${health.healthy}`);
   * ```
   */
  getHealth(): { healthy: boolean; prompts: number; lastGenerated?: Date } {
    const prompts = this.getAvailablePrompts();
    return {
      healthy: true,
      prompts: prompts.length,
    };
  }
}

/**
 * Create a prompt service instance with default configuration
 * @param config - Optional configuration overrides
 * @returns Configured prompt service instance
 * @example
 * ```typescript
 * const promptService = createPromptService();
 * // or with custom config
 * const promptService = createPromptService({ 
 *   logger: createLogger('MyPromptService'),
 *   validateArguments: false
 * });
 * ```
 */
export function createPromptService(config?: Partial<PromptServiceConfig>): PromptService {
  const defaultConfig: PromptServiceConfig = {
    logger: createLogger('PromptService'),
    validateArguments: true,
    ...config,
  };

  return new PromptService(defaultConfig);
}
