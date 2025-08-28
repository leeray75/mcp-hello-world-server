# Development Guide

## Setup for Development

### Prerequisites
- Node.js 22+
- Docker (Rancher Desktop or Docker Desktop)
- Git
- curl (for HTTP transport testing)

### Initial Setup
```bash
git clone <your-repo>
cd mcp-hello-world-server
npm install
npm run build
```

## Transport Modes for Development

### STDIO Development (Default Local)
Best for Claude Desktop integration and local MCP Inspector testing:

```bash
# Start in STDIO mode
npm start
# or explicitly
npm run start:stdio

# Test with MCP Inspector
npm run inspect
```

### HTTP Development
Best for web service development and containerized testing:

```bash
# Start HTTP server
npm run start:http
# or with environment variable
TRANSPORT=http npm start

# Test health endpoint
curl http://localhost:3001/health

# Custom port
PORT=8080 npm run start:http
```

## Development Workflows

### STDIO Workflow (MCP Inspector)
1. Make changes in `src/index.ts` or related files
2. Build: `npm run build`
3. Test with MCP Inspector: `npm run inspect`
4. Iterate until functionality works correctly

### HTTP Workflow (Manual Testing)
1. Start HTTP server: `npm run start:http`
2. Test health endpoint: `curl http://localhost:3001/health`
3. Test MCP endpoints with HTTP client or custom tools
4. Monitor server logs for debugging

### Docker Development Workflow
1. Build image: `npm run docker:build`
2. Test HTTP in Docker: `npm run docker:run` (defaults to HTTP)
3. Test STDIO in Docker: `npm run docker:run:stdio`
4. View logs: `docker logs mcp-hello-world`
5. Health check: `docker exec mcp-hello-world curl -f http://localhost:3001/health`

### Code Structure
- **Tools**: Functions that LLMs can call
- **Resources**: Data that LLMs can read
- **Prompts**: Templates for LLM interactions

### Adding New Features
1. Tools: Add to `ListToolsRequestSchema` and `CallToolRequestSchema` handlers
2. Resources: Add to `ListResourcesRequestSchema` and `ReadResourceRequestSchema` handlers  
3. Prompts: Add to `ListPromptsRequestSchema` and `GetPromptRequestSchema` handlers

## Environment Variables

### Transport Configuration
- `TRANSPORT=stdio` (default for local development)
- `TRANSPORT=http` (for web services, default in Docker)

### HTTP Configuration
- `PORT=3001` (default HTTP port)
- `NODE_ENV=development|production`

### Example Configurations
```bash
# Local STDIO development
npm start

# Local HTTP development
TRANSPORT=http PORT=3001 npm start

# HTTP with custom port
TRANSPORT=http PORT=8080 npm start

# Production HTTP
NODE_ENV=production TRANSPORT=http npm start
```

## Testing Strategies

### STDIO Testing
- **MCP Inspector**: Visual interface for testing all capabilities
- **Manual Testing**: Direct integration with Claude Desktop
- **Automated Testing**: Jest tests with STDIO mock

### HTTP Testing
- **Health Checks**: `curl http://localhost:3000/health`
- **Manual HTTP**: Use Postman, curl, or custom HTTP clients
- **Load Testing**: Test HTTP endpoints under load
- **Docker Testing**: Test containerized HTTP deployment

### Testing Checklist
1. **Tools**: Verify all tools work via both transports
2. **Resources**: Confirm all resources are accessible
3. **Prompts**: Test prompt generation and customization
4. **Health**: Verify HTTP health endpoint responds correctly
5. **Docker**: Test both HTTP and STDIO in containers
6. **Environment**: Test different NODE_ENV settings

## Debugging

### STDIO Debugging
```bash
# Enable debug logging
DEBUG=mcp* npm start

# Use MCP Inspector for visual debugging
npm run inspect
```

### HTTP Debugging
```bash
# Start with verbose logging
TRANSPORT=http npm start

# Test health endpoint
curl -v http://localhost:3000/health

# Check Docker container logs
docker logs -f mcp-hello-world
```

### Common Issues
- **Port conflicts**: Change PORT environment variable
- **Transport mismatch**: Verify TRANSPORT environment variable
- **Docker networking**: Ensure port mapping is correct
- **CORS issues**: Server includes basic CORS for development

## Performance Considerations

### STDIO Transport
- Lower latency for local communication
- No network overhead
- Best for Claude Desktop integration

### HTTP Transport
- Network latency considerations
- Scalable for multiple clients
- Better for containerized deployments
- Health monitoring capabilities

## Security Notes

### Development Mode
- Basic CORS enabled for development
- No authentication required
- HTTP endpoints are unencrypted (use HTTPS in production)

### Production Considerations
- Add authentication middleware
- Use HTTPS with proper certificates
- Implement rate limiting
- Add proper error handling
- Consider API versioning
