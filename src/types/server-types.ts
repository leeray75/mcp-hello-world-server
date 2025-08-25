/**
 * @fileoverview Server-specific type definitions for the Hello World Server
 * @module types/serverTypes
 * @author MCP Hello World Server
 * @since 1.0.0
 */

import { Logger } from '../utils/logger.js';
import { MCPServerInfo, MCPServerCapabilities } from './mcp-types.js';

/**
 * Server configuration options
 * @description Configuration structure for server initialization
 */
export interface ServerConfig {
  /** Server identification information */
  info: MCPServerInfo;
  /** Server capabilities configuration */
  capabilities: MCPServerCapabilities;
  /** Enable debug logging */
  debug?: boolean;
  /** Custom logger instance */
  logger?: Logger;
}

/**
 * Tool service configuration
 * @description Configuration for the tool service
 */
export interface ToolServiceConfig {
  /** Logger instance for the service */
  logger: Logger;
  /** Enable validation of tool arguments */
  validateArguments?: boolean;
}

/**
 * Resource service configuration
 * @description Configuration for the resource service
 */
export interface ResourceServiceConfig {
  /** Logger instance for the service */
  logger: Logger;
  /** Enable validation of resource URIs */
  validateUris?: boolean;
}

/**
 * Prompt service configuration
 * @description Configuration for the prompt service
 */
export interface PromptServiceConfig {
  /** Logger instance for the service */
  logger: Logger;
  /** Enable validation of prompt arguments */
  validateArguments?: boolean;
}

/**
 * Handler configuration base
 * @description Base configuration for all handlers
 */
export interface BaseHandlerConfig {
  /** Logger instance for the handler */
  logger: Logger;
  /** Enable request/response logging */
  logRequests?: boolean;
}

/**
 * Tool handler configuration
 * @description Configuration for the tool request handler
 */
export interface ToolHandlerConfig extends BaseHandlerConfig {
  /** Tool service instance */
  toolService: import('../services/tool-service.js').ToolService;
}

/**
 * Resource handler configuration
 * @description Configuration for the resource request handler
 */
export interface ResourceHandlerConfig extends BaseHandlerConfig {
  /** Resource service instance */
  resourceService: import('../services/resource-service.js').ResourceService;
}

/**
 * Prompt handler configuration
 * @description Configuration for the prompt request handler
 */
export interface PromptHandlerConfig extends BaseHandlerConfig {
  /** Prompt service instance */
  promptService: import('../services/prompt-service.js').PromptService;
}

/**
 * Transport configuration
 * @description Configuration for server transport
 */
export interface TransportConfig {
  /** Transport type */
  type: 'stdio' | 'sse' | 'websocket';
  /** Logger instance */
  logger: Logger;
  /** Additional transport options */
  options?: Record<string, unknown>;
}

/**
 * Server lifecycle hooks
 * @description Optional hooks for server lifecycle events
 */
export interface ServerLifecycleHooks {
  /** Called before server starts */
  onBeforeStart?: () => Promise<void> | void;
  /** Called after server starts successfully */
  onAfterStart?: () => Promise<void> | void;
  /** Called before server stops */
  onBeforeStop?: () => Promise<void> | void;
  /** Called after server stops */
  onAfterStop?: () => Promise<void> | void;
  /** Called when an error occurs */
  onError?: (error: Error) => Promise<void> | void;
}

/**
 * Server state enumeration
 * @description Possible states of the server
 */
export enum ServerState {
  /** Server is not initialized */
  UNINITIALIZED = 'uninitialized',
  /** Server is initializing */
  INITIALIZING = 'initializing',
  /** Server is ready but not started */
  READY = 'ready',
  /** Server is starting */
  STARTING = 'starting',
  /** Server is running */
  RUNNING = 'running',
  /** Server is stopping */
  STOPPING = 'stopping',
  /** Server is stopped */
  STOPPED = 'stopped',
  /** Server encountered an error */
  ERROR = 'error',
}

/**
 * Server instance interface
 * @description Main server instance contract
 */
export interface ServerInstance {
  /** Current server state */
  readonly state: ServerState;
  /** Server configuration */
  readonly config: ServerConfig;
  /** Start the server */
  start(): Promise<void>;
  /** Stop the server */
  stop(): Promise<void>;
  /** Get server health status */
  getHealth(): ServerHealth;
}

/**
 * Server health information
 * @description Health status of the server
 */
export interface ServerHealth {
  /** Whether the server is healthy */
  healthy: boolean;
  /** Current server state */
  state: ServerState;
  /** Uptime in milliseconds */
  uptime: number;
  /** Start timestamp */
  startTime: Date;
  /** Memory usage information */
  memory: {
    /** Used memory in bytes */
    used: number;
    /** Total memory in bytes */
    total: number;
  };
  /** Error information if unhealthy */
  error?: string;
}

/**
 * Service registry interface
 * @description Registry for managing server services
 */
export interface ServiceRegistry {
  /** Register a service */
  register<T>(name: string, service: T): void;
  /** Get a registered service */
  get<T>(name: string): T | undefined;
  /** Check if a service is registered */
  has(name: string): boolean;
  /** Unregister a service */
  unregister(name: string): boolean;
  /** Get all registered service names */
  getServiceNames(): string[];
}

/**
 * Request context interface
 * @description Context information for request processing
 */
export interface RequestContext {
  /** Unique request identifier */
  requestId: string;
  /** Request timestamp */
  timestamp: Date;
  /** Request type */
  type: 'tool' | 'resource' | 'prompt' | 'list';
  /** Client information if available */
  client?: {
    /** Client identifier */
    id: string;
    /** Client version */
    version?: string;
  };
}

/**
 * Error context interface
 * @description Context information for error handling
 */
export interface ErrorContext {
  /** The original error */
  error: Error;
  /** Request context if available */
  request?: RequestContext;
  /** Additional context data */
  context?: Record<string, unknown>;
  /** Error severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Middleware function interface
 * @description Function signature for request middleware
 */
export interface MiddlewareFunction {
  /** The middleware function */
  (context: RequestContext, next: () => Promise<any>): Promise<any>;
}

/**
 * Server metrics interface
 * @description Performance and usage metrics
 */
export interface ServerMetrics {
  /** Total number of requests processed */
  totalRequests: number;
  /** Number of successful requests */
  successfulRequests: number;
  /** Number of failed requests */
  failedRequests: number;
  /** Average request processing time in milliseconds */
  averageResponseTime: number;
  /** Request counts by type */
  requestsByType: {
    tool: number;
    resource: number;
    prompt: number;
    list: number;
  };
  /** Error counts by type */
  errorsByType: Record<string, number>;
  /** Last reset timestamp */
  lastReset: Date;
}

/**
 * Server options interface
 * @description Complete server initialization options
 */
export interface ServerOptions {
  /** Server configuration */
  config: ServerConfig;
  /** Transport configuration */
  transport: TransportConfig;
  /** Lifecycle hooks */
  hooks?: ServerLifecycleHooks;
  /** Middleware functions */
  middleware?: MiddlewareFunction[];
  /** Enable metrics collection */
  enableMetrics?: boolean;
}
