# Development Guide

## Setup for Development

### Prerequisites
- Node.js 22+
- Docker (Rancher Desktop or Docker Desktop)
- Git

### Initial Setup
```bash
git clone <your-repo>
cd mcp-hello-world-server
npm install
npm run build
```

### Development Workflow
1. Make changes in `src/index.ts`
2. Test with: `npm run inspect`
3. Build for production: `npm run build`
4. Test Docker: `npm run docker:build && npm run docker:run`

### Code Structure
- **Tools**: Functions that LLMs can call
- **Resources**: Data that LLMs can read
- **Prompts**: Templates for LLM interactions

### Adding New Features
1. Tools: Add to `ListToolsRequestSchema` and `CallToolRequestSchema` handlers
2. Resources: Add to `ListResourcesRequestSchema` and `ReadResourceRequestSchema` handlers  
3. Prompts: Add to `ListPromptsRequestSchema` and `GetPromptRequestSchema` handlers

### Testing
- Use MCP Inspector for visual testing
- Test all three capabilities (tools, resources, prompts)
- Verify Docker build and run
