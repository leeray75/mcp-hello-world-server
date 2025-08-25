/**
 * @fileoverview Resource request handlers for MCP protocol
 * @module handlers/resourceHandlers
 * @author MCP Hello World Server
 * @since 1.0.0
 */

import { createLogger, Logger } from '../utils/logger.js';
import { ResourceService } from '../services/resource-service.js';
import { MCPListResourcesResponse, MCPResourceResponse } from '../types/mcp-types.js';
import { ResourceHandlerConfig } from '../types/server-types.js';

/**
 * Resource handlers class for processing MCP resource requests
 * @description Handles routing and processing of resource-related MCP requests
 * @example
 * ```typescript
 * const resourceHandlers = new ResourceHandlers({
 *   logger: createLogger('ResourceHandlers'),
 *   resourceService: resourceService
 * });
 * ```
 */
export class ResourceHandlers {
  /** Logger instance for this handler */
  private readonly logger: Logger;
  /** Resource service instance */
  private readonly resourceService: ResourceService;
  /** Whether to log requests and responses */
  private readonly logRequests: boolean;

  /**
   * Create a new resource handlers instance
   * @param config - Configuration for the resource handlers
   * @example
   * ```typescript
   * const resourceHandlers = new ResourceHandlers({
   *   logger: createLogger('ResourceHandlers'),
   *   resourceService: resourceService,
   *   logRequests: true
   * });
   * ```
   */
  constructor(config: ResourceHandlerConfig) {
    this.logger = config.logger;
    this.resourceService = config.resourceService;
    this.logRequests = config.logRequests ?? true;
    this.logger.info('Resource handlers initialized', { 
      logRequests: this.logRequests 
    });
  }

  /**
   * Handle list resources request
   * @returns Promise resolving to list of available resources
   * @throws Error if resource listing fails
   * @example
   * ```typescript
   * const response = await resourceHandlers.handleListResources();
   * console.log(`Found ${response.resources.length} resources`);
   * ```
   */
  async handleListResources(): Promise<MCPListResourcesResponse> {
    const startTime = Date.now();
    
    if (this.logRequests) {
      this.logger.info('Handling list resources request');
    }

    try {
      const resources = this.resourceService.getAvailableResources();
      
      const response: MCPListResourcesResponse = {
        resources,
      };

      const processingTime = Date.now() - startTime;
      
      if (this.logRequests) {
        this.logger.info('List resources request completed', { 
          resourceCount: resources.length,
          processingTime,
          success: true 
        });
      }

      return response;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error('List resources request failed', { 
        processingTime,
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }

  /**
   * Handle read resource request
   * @param request - The resource read request containing URI
   * @returns Promise resolving to resource content response
   * @throws Error if resource reading fails
   * @example
   * ```typescript
   * const response = await resourceHandlers.handleReadResource({
   *   params: {
   *     uri: 'data://users'
   *   }
   * });
   * ```
   */
  async handleReadResource(request: {
    params: {
      uri: string;
    };
  }): Promise<MCPResourceResponse> {
    const startTime = Date.now();
    const { uri } = request.params;
    
    if (this.logRequests) {
      this.logger.info('Handling read resource request', { uri });
    }

    try {
      // Validate request structure
      if (!uri || typeof uri !== 'string') {
        throw new Error('Resource URI is required and must be a string');
      }

      // Read the resource
      const response = await this.resourceService.readResource(uri);

      const processingTime = Date.now() - startTime;
      
      if (this.logRequests) {
        this.logger.info('Read resource request completed', { 
          uri,
          processingTime,
          contentItems: response.contents.length,
          success: true 
        });
      }

      return response;
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error('Read resource request failed', { 
        uri,
        processingTime,
        error: error instanceof Error ? error.message : String(error) 
      });
      
      throw error;
    }
  }

  /**
   * Handle resource-related requests with automatic routing
   * @param requestType - The type of resource request
   * @param request - The request data
   * @returns Promise resolving to appropriate response
   * @throws Error if request type is unsupported or execution fails
   * @example
   * ```typescript
   * // List resources
   * const listResponse = await resourceHandlers.handleRequest('list', {});
   * 
   * // Read resource
   * const readResponse = await resourceHandlers.handleRequest('read', {
   *   params: { uri: 'data://users' }
   * });
   * ```
   */
  async handleRequest(
    requestType: 'list' | 'read',
    request: any
  ): Promise<MCPListResourcesResponse | MCPResourceResponse> {
    this.logger.debug('Routing resource request', { requestType });

    switch (requestType) {
      case 'list':
        return await this.handleListResources();
      case 'read':
        return await this.handleReadResource(request);
      default:
        throw new Error(`Unsupported resource request type: ${requestType}`);
    }
  }

  /**
   * Validate read resource request structure
   * @param request - The request to validate
   * @returns True if request is valid
   * @throws Error if request is invalid
   * @example
   * ```typescript
   * const isValid = resourceHandlers.validateReadResourceRequest({
   *   params: { uri: 'data://users' }
   * });
   * ```
   */
  validateReadResourceRequest(request: any): boolean {
    if (!request || typeof request !== 'object') {
      throw new Error('Request must be an object');
    }

    if (!request.params || typeof request.params !== 'object') {
      throw new Error('Request must have a params object');
    }

    if (!request.params.uri || typeof request.params.uri !== 'string') {
      throw new Error('Resource URI is required and must be a string');
    }

    return true;
  }

  /**
   * Get handler statistics
   * @returns Handler usage statistics
   * @example
   * ```typescript
   * const stats = resourceHandlers.getStats();
   * console.log(`Resources handled: ${stats.resourcesHandled}`);
   * ```
   */
  getStats(): {
    handlersActive: boolean;
    resourceService: any;
    lastRequest?: Date;
  } {
    return {
      handlersActive: true,
      resourceService: this.resourceService.getHealth(),
    };
  }

  /**
   * Get handler health information
   * @returns Handler health status
   * @example
   * ```typescript
   * const health = resourceHandlers.getHealth();
   * console.log(`Handlers healthy: ${health.healthy}`);
   * ```
   */
  getHealth(): { 
    healthy: boolean; 
    handlersInitialized: boolean;
    serviceHealth: any;
  } {
    const serviceHealth = this.resourceService.getHealth();
    
    return {
      healthy: serviceHealth.healthy,
      handlersInitialized: true,
      serviceHealth,
    };
  }

  /**
   * Check if a resource is available
   * @param uri - The URI of the resource to check
   * @returns True if resource is available
   * @example
   * ```typescript
   * const available = resourceHandlers.isResourceAvailable('data://users');
   * if (available) {
   *   console.log('Resource can be read');
   * }
   * ```
   */
  isResourceAvailable(uri: string): boolean {
    return this.resourceService.hasResourceSync(uri);
  }

  /**
   * Get available resource URIs
   * @returns Array of available resource URIs
   * @example
   * ```typescript
   * const resourceUris = resourceHandlers.getAvailableResourceUris();
   * console.log(`Available resources: ${resourceUris.join(', ')}`);
   * ```
   */
  getAvailableResourceUris(): string[] {
    const resources = this.resourceService.getAvailableResources();
    return resources.map(resource => resource.uri);
  }

  /**
   * Get resource statistics from service
   * @returns Resource statistics
   * @example
   * ```typescript
   * const stats = resourceHandlers.getResourceStats();
   * console.log(`Total resources: ${stats.totalResources}`);
   * ```
   */
  getResourceStats(): {
    totalResources: number;
    resourcesByType: Record<string, number>;
    lastAccessed?: Date;
  } {
    return this.resourceService.getResourceStats();
  }

  /**
   * Get sample data for testing
   * @returns Sample data object
   * @example
   * ```typescript
   * const sampleData = resourceHandlers.getSampleData();
   * console.log(`Users: ${sampleData.users.length}`);
   * ```
   */
  getSampleData() {
    return this.resourceService.getSampleData();
  }
}

/**
 * Create resource handlers with default configuration
 * @param resourceService - The resource service instance to use
 * @param config - Optional configuration overrides
 * @returns Configured resource handlers instance
 * @example
 * ```typescript
 * const resourceHandlers = createResourceHandlers(resourceService);
 * // or with custom config
 * const resourceHandlers = createResourceHandlers(resourceService, {
 *   logger: createLogger('MyResourceHandlers'),
 *   logRequests: false
 * });
 * ```
 */
export function createResourceHandlers(
  resourceService: ResourceService,
  config?: Partial<Omit<ResourceHandlerConfig, 'resourceService'>>
): ResourceHandlers {
  const defaultConfig: ResourceHandlerConfig = {
    logger: createLogger('ResourceHandlers'),
    logRequests: true,
    resourceService,
    ...config,
  };

  return new ResourceHandlers(defaultConfig);
}
