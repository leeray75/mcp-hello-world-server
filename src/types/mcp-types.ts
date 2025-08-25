/**
 * @fileoverview MCP-specific type definitions for the Hello World Server
 * @module types/mcpTypes
 * @author MCP Hello World Server
 * @since 1.0.0
 */

/**
 * MCP Tool definition structure
 * @description Defines the schema for MCP tools
 */
export interface MCPTool {
  /** The name of the tool */
  name: string;
  /** Description of what the tool does */
  description: string;
  /** JSON schema for tool input parameters */
  inputSchema: {
    /** Schema type (always 'object' for tools) */
    type: 'object';
    /** Object properties definition */
    properties: Record<string, unknown>;
    /** Required property names */
    required?: string[];
  };
}

/**
 * MCP Resource definition structure
 * @description Defines the schema for MCP resources
 */
export interface MCPResource {
  /** The URI of the resource */
  uri: string;
  /** MIME type of the resource content */
  mimeType: string;
  /** Human-readable name of the resource */
  name: string;
  /** Description of the resource */
  description: string;
}

/**
 * MCP Prompt definition structure
 * @description Defines the schema for MCP prompts
 */
export interface MCPPrompt {
  /** The name of the prompt */
  name: string;
  /** Description of what the prompt does */
  description: string;
  /** Array of prompt arguments */
  arguments?: MCPPromptArgument[];
}

/**
 * MCP Prompt argument definition
 * @description Defines a single prompt argument
 */
export interface MCPPromptArgument {
  /** The name of the argument */
  name: string;
  /** Description of the argument */
  description: string;
  /** Whether the argument is required */
  required: boolean;
}

/**
 * MCP Tool response content
 * @description Structure for tool response content
 */
export interface MCPToolContent {
  /** Content type identifier */
  type: 'text' | 'image' | 'resource';
  /** The actual content (text, image data, etc.) */
  text?: string;
  /** Image data for image content */
  data?: string;
  /** MIME type for the content */
  mimeType?: string;
}

/**
 * MCP Tool response structure
 * @description Complete tool response format
 */
export interface MCPToolResponse {
  /** Array of content items */
  content: MCPToolContent[];
  /** Whether the tool call was an error */
  isError?: boolean;
}

/**
 * MCP Resource content structure
 * @description Structure for resource content responses
 */
export interface MCPResourceContent {
  /** The URI of the resource */
  uri: string;
  /** MIME type of the content */
  mimeType: string;
  /** Text content (for text resources) */
  text?: string;
  /** Binary data (for binary resources) */
  blob?: Uint8Array;
}

/**
 * MCP Resource response structure
 * @description Complete resource response format
 */
export interface MCPResourceResponse {
  /** Array of resource contents */
  contents: MCPResourceContent[];
}

/**
 * MCP Prompt message structure
 * @description Individual message in a prompt response
 */
export interface MCPPromptMessage {
  /** The role of the message sender */
  role: 'user' | 'assistant' | 'system';
  /** The message content */
  content: {
    /** Content type */
    type: 'text';
    /** The actual text content */
    text: string;
  };
}

/**
 * MCP Prompt response structure
 * @description Complete prompt response format
 */
export interface MCPPromptResponse {
  /** Description of the prompt */
  description?: string;
  /** Array of messages forming the prompt */
  messages: MCPPromptMessage[];
}

/**
 * MCP Server capabilities structure
 * @description Defines what capabilities the server supports
 */
export interface MCPServerCapabilities {
  /** Tool-related capabilities */
  tools?: Record<string, unknown>;
  /** Resource-related capabilities */
  resources?: Record<string, unknown>;
  /** Prompt-related capabilities */
  prompts?: Record<string, unknown>;
  /** Logging capabilities */
  logging?: Record<string, unknown>;
}

/**
 * MCP Server information structure
 * @description Basic server identification
 */
export interface MCPServerInfo {
  /** The name of the server */
  name: string;
  /** The version of the server */
  version: string;
}

/**
 * MCP List Tools response structure
 * @description Response format for listing available tools
 */
export interface MCPListToolsResponse {
  /** Array of available tools */
  tools: MCPTool[];
}

/**
 * MCP List Resources response structure
 * @description Response format for listing available resources
 */
export interface MCPListResourcesResponse {
  /** Array of available resources */
  resources: MCPResource[];
}

/**
 * MCP List Prompts response structure
 * @description Response format for listing available prompts
 */
export interface MCPListPromptsResponse {
  /** Array of available prompts */
  prompts: MCPPrompt[];
}

/**
 * Tool execution context
 * @description Context information for tool execution
 */
export interface ToolExecutionContext {
  /** The name of the tool being executed */
  toolName: string;
  /** The arguments passed to the tool */
  arguments: Record<string, unknown>;
  /** Timestamp when execution started */
  startTime: Date;
  /** Optional request identifier */
  requestId?: string;
}

/**
 * Resource access context
 * @description Context information for resource access
 */
export interface ResourceAccessContext {
  /** The URI of the resource being accessed */
  uri: string;
  /** Timestamp when access started */
  startTime: Date;
  /** Optional request identifier */
  requestId?: string;
}

/**
 * Prompt generation context
 * @description Context information for prompt generation
 */
export interface PromptGenerationContext {
  /** The name of the prompt being generated */
  promptName: string;
  /** The arguments passed to the prompt */
  arguments: Record<string, unknown>;
  /** Timestamp when generation started */
  startTime: Date;
  /** Optional request identifier */
  requestId?: string;
}
