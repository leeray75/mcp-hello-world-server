#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Server info
const serverInfo = {
  name: 'mcp-hello-world-server',
  version: '1.0.0',
};

// Sample data for resources
const SAMPLE_DATA = {
  users: [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
  ],
  config: {
    serverName: 'Hello World MCP Server',
    version: '1.0.0',
    features: ['tools', 'resources', 'prompts'],
  },
};

async function main() {
  // Create server instance
  const server = new Server(serverInfo, {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  });

  // TOOLS IMPLEMENTATION
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'say_hello',
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
          name: 'get_time',
          description: 'Returns the current server time',
          inputSchema: {
            type: 'object',
            properties: {},
          },
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'say_hello': {
        const personName = args?.name as string;
        const customMessage = args?.message as string;
        const greeting = customMessage 
          ? `${customMessage}, ${personName}!`
          : `Hello, ${personName}! Welcome to the MCP Hello World Server.`;
        
        return {
          content: [
            {
              type: 'text',
              text: greeting,
            },
          ],
        };
      }

      case 'get_time': {
        const currentTime = new Date().toISOString();
        return {
          content: [
            {
              type: 'text',
              text: `Current server time: ${currentTime}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  });

  // RESOURCES IMPLEMENTATION
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: 'data://users',
          mimeType: 'application/json',
          name: 'User List',
          description: 'A list of sample users',
        },
        {
          uri: 'data://config',
          mimeType: 'application/json',
          name: 'Server Configuration',
          description: 'Server configuration and metadata',
        },
        {
          uri: 'text://welcome',
          mimeType: 'text/plain',
          name: 'Welcome Message',
          description: 'A simple welcome message',
        },
      ],
    };
  });

  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;

    switch (uri) {
      case 'data://users':
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(SAMPLE_DATA.users, null, 2),
            },
          ],
        };

      case 'data://config':
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(SAMPLE_DATA.config, null, 2),
            },
          ],
        };

      case 'text://welcome':
        return {
          contents: [
            {
              uri,
              mimeType: 'text/plain',
              text: 'Welcome to the MCP Hello World Server!\n\nThis is a minimal example demonstrating:\n- Tools (say_hello, get_time)\n- Resources (users, config, welcome)\n- Prompts (greeting, introduction)\n\nTry using the MCP Inspector to explore all features!',
            },
          ],
        };

      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  });

  // PROMPTS IMPLEMENTATION
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [
        {
          name: 'greeting',
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
          name: 'introduction',
          description: 'Generate an introduction to MCP concepts',
          arguments: [
            {
              name: 'audience',
              description: 'Target audience (developer, user, manager)',
              required: false,
            },
          ],
        },
      ],
    };
  });

  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'greeting': {
        const personName = args?.name as string || 'there';
        const style = args?.style as string || 'friendly';
        
        let promptText = '';
        switch (style) {
          case 'formal':
            promptText = `Generate a formal greeting for ${personName}. Use professional language and proper etiquette.`;
            break;
          case 'casual':
            promptText = `Generate a casual, relaxed greeting for ${personName}. Keep it informal and approachable.`;
            break;
          default:
            promptText = `Generate a friendly and warm greeting for ${personName}. Make it welcoming and positive.`;
        }

        return {
          description: `Personalized ${style} greeting for ${personName}`,
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

      case 'introduction': {
        const audience = args?.audience as string || 'developer';
        let promptText = '';
        
        switch (audience) {
          case 'user':
            promptText = 'Explain Model Context Protocol (MCP) in simple terms for end users. Focus on benefits and what it means for their AI experience.';
            break;
          case 'manager':
            promptText = 'Explain Model Context Protocol (MCP) for technical managers. Focus on business value, integration benefits, and strategic advantages.';
            break;
          default:
            promptText = 'Explain Model Context Protocol (MCP) for developers. Include technical details, implementation concepts, and practical examples.';
        }

        return {
          description: `MCP introduction for ${audience}`,
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

      default:
        throw new Error(`Unknown prompt: ${name}`);
    }
  });

  // SERVER STARTUP
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Error handling
  process.on('SIGINT', async () => {
    console.error('Received SIGINT, shutting down gracefully...');
    await server.close();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    console.error('Received SIGTERM, shutting down gracefully...');
    await server.close();
    process.exit(0);
  });
}

// Run the server
main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
