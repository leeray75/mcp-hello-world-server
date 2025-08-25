/**
 * @fileoverview Resource service containing business logic for MCP resources
 * @module services/resourceService
 * @author MCP Hello World Server
 * @since 1.0.0
 */

import { createLogger, Logger } from '../utils/logger.js';
import { RESOURCE_URIS, SAMPLE_DATA, WELCOME_MESSAGE } from '../utils/constants.js';
import { validateResourceUri } from '../utils/validators.js';
import { MCPResource, MCPResourceResponse, ResourceAccessContext } from '../types/mcp-types.js';
import { ResourceServiceConfig } from '../types/server-types.js';

/**
 * Resource service class for handling resource business logic
 * @description Encapsulates all resource-related business operations
 * @example
 * ```typescript
 * const resourceService = new ResourceService({ logger: createLogger('ResourceService') });
 * const resources = resourceService.getAvailableResources();
 * const content = await resourceService.readResource('data://users');
 * ```
 */
export class ResourceService {
  /** Logger instance for this service */
  private readonly logger: Logger;
  /** Whether to validate resource URIs */
  private readonly validateUris: boolean;

  /**
   * Create a new resource service instance
   * @param config - Configuration for the resource service
   * @example
   * ```typescript
   * const resourceService = new ResourceService({
   *   logger: createLogger('ResourceService'),
   *   validateUris: true
   * });
   * ```
   */
  constructor(config: ResourceServiceConfig) {
    this.logger = config.logger;
    this.validateUris = config.validateUris ?? true;
    this.logger.info('Resource service initialized', { 
      validateUris: this.validateUris 
    });
  }

  /**
   * Get all available resources
   * @returns Array of available MCP resources
   * @example
   * ```typescript
   * const resources = resourceService.getAvailableResources();
   * console.log(`Found ${resources.length} resources`);
   * ```
   */
  getAvailableResources(): MCPResource[] {
    this.logger.debug('Getting available resources');
    
    return [
      {
        uri: RESOURCE_URIS.USERS,
        mimeType: 'application/json',
        name: 'User List',
        description: 'A list of sample users',
      },
      {
        uri: RESOURCE_URIS.CONFIG,
        mimeType: 'application/json',
        name: 'Server Configuration',
        description: 'Server configuration and metadata',
      },
      {
        uri: RESOURCE_URIS.WELCOME,
        mimeType: 'text/plain',
        name: 'Welcome Message',
        description: 'A simple welcome message',
      },
    ];
  }

  /**
   * Read a resource by URI
   * @param uri - The URI of the resource to read
   * @returns Promise resolving to resource response
   * @throws Error if URI is invalid or resource access fails
   * @example
   * ```typescript
   * const response = await resourceService.readResource('data://users');
   * console.log(response.contents[0].text);
   * ```
   */
  async readResource(uri: string): Promise<MCPResourceResponse> {
    const context: ResourceAccessContext = {
      uri,
      startTime: new Date(),
    };

    this.logger.info('Reading resource', { 
      uri,
      requestId: context.requestId 
    });

    try {
      // Validate URI if enabled
      if (this.validateUris) {
        const validation = validateResourceUri(uri);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }
      }

      // Read the specific resource
      let response: MCPResourceResponse;
      switch (uri) {
        case RESOURCE_URIS.USERS:
          response = await this.readUsersResource(context);
          break;
        case RESOURCE_URIS.CONFIG:
          response = await this.readConfigResource(context);
          break;
        case RESOURCE_URIS.WELCOME:
          response = await this.readWelcomeResource(context);
          break;
        default:
          throw new Error(`Unknown resource: ${uri}`);
      }

      const accessTime = Date.now() - context.startTime.getTime();
      this.logger.info('Resource access completed', { 
        uri, 
        accessTime,
        success: true 
      });

      return response;
    } catch (error) {
      const accessTime = Date.now() - context.startTime.getTime();
      this.logger.error('Resource access failed', { 
        uri, 
        accessTime,
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }

  /**
   * Read the users resource
   * @param context - Access context
   * @returns Promise resolving to resource response
   * @private
   * @example
   * ```typescript
   * // Internal usage only
   * const response = await this.readUsersResource(context);
   * ```
   */
  private async readUsersResource(context: ResourceAccessContext): Promise<MCPResourceResponse> {
    this.logger.debug('Reading users resource');

    const userData = JSON.stringify(SAMPLE_DATA.users, null, 2);
    
    this.logger.debug('Generated users response', { 
      userCount: SAMPLE_DATA.users.length 
    });

    return {
      contents: [
        {
          uri: context.uri,
          mimeType: 'application/json',
          text: userData,
        },
      ],
    };
  }

  /**
   * Read the config resource
   * @param context - Access context
   * @returns Promise resolving to resource response
   * @private
   * @example
   * ```typescript
   * // Internal usage only
   * const response = await this.readConfigResource(context);
   * ```
   */
  private async readConfigResource(context: ResourceAccessContext): Promise<MCPResourceResponse> {
    this.logger.debug('Reading config resource');

    const configData = JSON.stringify(SAMPLE_DATA.config, null, 2);
    
    this.logger.debug('Generated config response', { 
      serverName: SAMPLE_DATA.config.serverName,
      features: SAMPLE_DATA.config.features.length 
    });

    return {
      contents: [
        {
          uri: context.uri,
          mimeType: 'application/json',
          text: configData,
        },
      ],
    };
  }

  /**
   * Read the welcome resource
   * @param context - Access context
   * @returns Promise resolving to resource response
   * @private
   * @example
   * ```typescript
   * // Internal usage only
   * const response = await this.readWelcomeResource(context);
   * ```
   */
  private async readWelcomeResource(context: ResourceAccessContext): Promise<MCPResourceResponse> {
    this.logger.debug('Reading welcome resource');

    this.logger.debug('Generated welcome response', { 
      messageLength: WELCOME_MESSAGE.length 
    });

    return {
      contents: [
        {
          uri: context.uri,
          mimeType: 'text/plain',
          text: WELCOME_MESSAGE,
        },
      ],
    };
  }

  /**
   * Check if a resource exists
   * @param uri - The URI of the resource to check
   * @returns True if the resource exists, false otherwise
   * @example
   * ```typescript
   * const exists = resourceService.hasResourceSync('data://users');
   * if (exists) {
   *   console.log('Resource is available');
   * }
   * ```
   */
  hasResourceSync(uri: string): boolean {
    const validUris = Object.values(RESOURCE_URIS);
    return validUris.includes(uri as typeof validUris[number]);
  }

  /**
   * Get resource definition by URI
   * @param uri - The URI of the resource
   * @returns Resource definition or undefined if not found
   * @example
   * ```typescript
   * const resource = resourceService.getResourceDefinition('data://users');
   * if (resource) {
   *   console.log(resource.description);
   * }
   * ```
   */
  getResourceDefinition(uri: string): MCPResource | undefined {
    const resources = this.getAvailableResources();
    return resources.find(resource => resource.uri === uri);
  }

  /**
   * Get sample data for testing purposes
   * @returns Sample data object
   * @example
   * ```typescript
   * const sampleData = resourceService.getSampleData();
   * console.log(`Users: ${sampleData.users.length}`);
   * ```
   */
  getSampleData() {
    return {
      users: [...SAMPLE_DATA.users],
      config: { ...SAMPLE_DATA.config },
      welcome: WELCOME_MESSAGE,
    };
  }

  /**
   * Get resource statistics
   * @returns Resource usage statistics
   * @example
   * ```typescript
   * const stats = resourceService.getResourceStats();
   * console.log(`Total resources: ${stats.totalResources}`);
   * ```
   */
  getResourceStats(): {
    totalResources: number;
    resourcesByType: Record<string, number>;
    lastAccessed?: Date;
  } {
    const resources = this.getAvailableResources();
    const resourcesByType: Record<string, number> = {};

    // Count resources by MIME type
    resources.forEach(resource => {
      const type = resource.mimeType.split('/')[0];
      resourcesByType[type] = (resourcesByType[type] || 0) + 1;
    });

    return {
      totalResources: resources.length,
      resourcesByType,
    };
  }

  /**
   * Get service health information
   * @returns Service health status
   * @example
   * ```typescript
   * const health = resourceService.getHealth();
   * console.log(`Service healthy: ${health.healthy}`);
   * ```
   */
  getHealth(): { healthy: boolean; resources: number; lastAccessed?: Date } {
    const resources = this.getAvailableResources();
    return {
      healthy: true,
      resources: resources.length,
    };
  }
}

/**
 * Create a resource service instance with default configuration
 * @param config - Optional configuration overrides
 * @returns Configured resource service instance
 * @example
 * ```typescript
 * const resourceService = createResourceService();
 * // or with custom config
 * const resourceService = createResourceService({ 
 *   logger: createLogger('MyResourceService'),
 *   validateUris: false
 * });
 * ```
 */
export function createResourceService(config?: Partial<ResourceServiceConfig>): ResourceService {
  const defaultConfig: ResourceServiceConfig = {
    logger: createLogger('ResourceService'),
    validateUris: true,
    ...config,
  };

  return new ResourceService(defaultConfig);
}
