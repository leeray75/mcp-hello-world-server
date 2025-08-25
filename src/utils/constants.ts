/**
 * @fileoverview Constants and configuration data for the MCP Hello World Server
 * @module utils/constants
 * @author MCP Hello World Server
 * @since 1.0.0
 */

/**
 * Server information and metadata
 * @description Core server identification and versioning information
 */
export const SERVER_INFO = {
  /** The name of the MCP server */
  name: 'mcp-hello-world-server',
  /** The current version of the server */
  version: '1.0.0',
} as const;

/**
 * User data structure for demonstration purposes
 * @description Sample user object with required fields
 * @example
 * ```typescript
 * const user: User = {
 *   id: 1,
 *   name: 'Alice',
 *   email: 'alice@example.com'
 * };
 * ```
 */
export interface User {
  /** Unique identifier for the user */
  id: number;
  /** Display name of the user */
  name: string;
  /** Email address of the user */
  email: string;
}

/**
 * Server configuration structure
 * @description Configuration object containing server metadata and feature flags
 */
export interface ServerConfig {
  /** Human-readable server name */
  serverName: string;
  /** Server version string */
  version: string;
  /** List of enabled server features */
  features: string[];
}

/**
 * Sample data for resources and demonstrations
 * @description Contains mock data used by various server resources
 * @example
 * ```typescript
 * // Access user data
 * const users = SAMPLE_DATA.users;
 * console.log(`Found ${users.length} users`);
 * 
 * // Access server config
 * const config = SAMPLE_DATA.config;
 * console.log(`Server: ${config.serverName}`);
 * ```
 */
export const SAMPLE_DATA = {
  /** Array of sample users for demonstration */
  users: [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
  ] as User[],
  
  /** Server configuration and metadata */
  config: {
    serverName: 'Hello World MCP Server',
    version: '1.0.0',
    features: ['tools', 'resources', 'prompts'],
  } as ServerConfig,
} as const;

/**
 * Welcome message content for the text resource
 * @description Multi-line welcome text explaining server capabilities
 */
export const WELCOME_MESSAGE = `Welcome to the MCP Hello World Server!

This is a minimal example demonstrating:
- Tools (say_hello, get_time)
- Resources (users, config, welcome)
- Prompts (greeting, introduction)

Try using the MCP Inspector to explore all features!`;

/**
 * Resource URI constants
 * @description Standardized URIs for server resources
 */
export const RESOURCE_URIS = {
  /** URI for user data resource */
  USERS: 'data://users',
  /** URI for configuration resource */
  CONFIG: 'data://config',
  /** URI for welcome message resource */
  WELCOME: 'text://welcome',
} as const;

/**
 * Tool names as constants
 * @description Standardized tool identifiers
 */
export const TOOL_NAMES = {
  /** Say hello tool identifier */
  SAY_HELLO: 'say_hello',
  /** Get time tool identifier */
  GET_TIME: 'get_time',
} as const;

/**
 * Prompt names as constants
 * @description Standardized prompt identifiers
 */
export const PROMPT_NAMES = {
  /** Greeting prompt identifier */
  GREETING: 'greeting',
  /** Introduction prompt identifier */
  INTRODUCTION: 'introduction',
} as const;

/**
 * Greeting style options
 * @description Available styles for greeting generation
 */
export const GREETING_STYLES = {
  /** Formal business greeting */
  FORMAL: 'formal',
  /** Casual friendly greeting */
  CASUAL: 'casual',
  /** Standard friendly greeting */
  FRIENDLY: 'friendly',
} as const;

/**
 * Target audience options for introductions
 * @description Available audience types for MCP introductions
 */
export const AUDIENCE_TYPES = {
  /** Technical developer audience */
  DEVELOPER: 'developer',
  /** End user audience */
  USER: 'user',
  /** Management audience */
  MANAGER: 'manager',
} as const;
