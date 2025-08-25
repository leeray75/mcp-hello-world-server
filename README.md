# MCP Hello World Server

A minimal Model Context Protocol (MCP) server demonstrating all core MCP features: Tools, Resources, and Prompts with dual transport support (STDIO and HTTP/SSE).

## 🚀 Features

### Tools (Interactive Functions)
- **`say_hello`**: Personalized greeting with optional custom message
- **`get_time`**: Returns current server time

### Resources (Data Sources)
- **`data://users`**: Sample user data (JSON format)
- **`data://config`**: Server configuration metadata (JSON format)
- **`text://welcome`**: Welcome message (plain text format)

### Prompts (Template Generation)
- **`greeting`**: Generate personalized greetings with different styles
- **`introduction`**: Generate MCP explanations for different audiences

## 🚄 Transport Modes

This server supports two transport modes:

### STDIO Transport (Default for Local)
- **Use Case**: Claude Desktop integration, local development
- **Protocol**: stdin/stdout communication
- **Start Command**: `npm start` or `TRANSPORT=stdio npm start`

### HTTP/SSE Transport (Default for Docker)
- **Use Case**: Web services, containerized deployments, remote access
- **Protocol**: HTTP with Server-Sent Events for real-time communication
- **Start Command**: `TRANSPORT=http npm start` or `npm run start:http`
- **Default Port**: 3000 (configurable via `PORT` environment variable)
- **Health Check**: `GET /health` endpoint available

## 📋 Prerequisites

- Node.js 22+ (LTS recommended)
- npm or yarn package manager
- Docker (for containerized deployment)
- curl (for HTTP transport health checks in Docker)

## ⚡ Quick Start

### Local Development (STDIO)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Start server (STDIO mode):**
   ```bash
   npm start
   # or explicitly
   npm run start:stdio
   ```

4. **Test with MCP Inspector:**
   ```bash
   npm run inspect
   ```

### Local Development (HTTP)

1. **Start server (HTTP mode):**
   ```bash
   npm run start:http
   # or
   TRANSPORT=http npm start
   ```

2. **Test health endpoint:**
   ```bash
   curl http://localhost:3000/health
   ```

3. **Custom port:**
   ```bash
   PORT=8080 npm run start:http
   ```

### Docker Deployment

1. **Build Docker image:**
   ```bash
   npm run docker:build
   ```

2. **Run HTTP server (default for Docker):**
   ```bash
   npm run docker:run
   # or with custom options
   ./scripts/docker-run.sh --transport=http --port=3000
   ```

3. **Run STDIO server:**
   ```bash
   npm run docker:run:stdio
   # or
   ./scripts/docker-run.sh --stdio
   ```

4. **Stop the container:**
   ```bash
   npm run docker:stop
   ```

## 🧪 Testing & Development

### MCP Inspector Testing
The included MCP Inspector provides a web-based interface to test all server capabilities:

```bash
npm run inspect
```

This will:
- Build the server automatically
- Launch MCP Inspector in your browser
- Connect to your server for interactive testing
- Allow you to test tools, resources, and prompts

### Development Mode
For development with auto-rebuild:

```bash
npm run dev
```

## 🐳 Docker Usage

### Production Deployment
```bash
# Build optimized production image
npm run docker:build

# Run with restart policy
npm run docker:run

# Test with MCP Inspector
npm run docker:inspect

# Monitor logs
docker logs -f mcp-hello-world

# Stop cleanly
npm run docker:stop
```

### Manual Docker Commands
```bash
# Build image
docker build -t mcp-hello-world-server .

# Run container
docker run -d --name mcp-hello-world -p 3000:3000 mcp-hello-world-server

# View logs
docker logs mcp-hello-world

# Stop and remove
docker stop mcp-hello-world && docker rm mcp-hello-world
```

## 🔌 Integration

### Claude Desktop Integration (STDIO)
Add this server to your Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "hello-world": {
      "command": "node",
      "args": ["/absolute/path/to/your/project/build/index.js"]
    }
  }
}
```

### HTTP Transport Integration
For web services and remote access:

```bash
# Start HTTP server
TRANSPORT=http PORT=3000 npm start

# Health check endpoint
curl http://localhost:3000/health

# Environment variables
TRANSPORT=http    # Enable HTTP transport
PORT=3000         # Server port (default: 3000)
```

### MCP Client Compatibility
- **STDIO Transport**: Compatible with Claude Desktop and any MCP client supporting stdio
- **HTTP Transport**: Compatible with web-based MCP clients and custom integrations
- **Docker**: Runs HTTP transport by default for containerized deployments

## 🏗️ Architecture

- **Transport**: Dual support for stdio and HTTP/SSE
  - **STDIO**: stdin/stdout communication (default for local)
  - **HTTP**: Express.js with Server-Sent Events (default for Docker)
- **Protocol**: Model Context Protocol v2024-11-05
- **Runtime**: Node.js 22+ with ES modules
- **Language**: TypeScript with strict type checking
- **Container**: Multi-stage Docker build with Alpine Linux + curl
- **Port**: 3000 (configurable via PORT environment variable)
- **Health Check**: `/health` endpoint for HTTP transport

## 📚 API Reference

### Tools

#### `say_hello`
```json
{
  "name": "say_hello",
  "parameters": {
    "name": "string (required) - Person's name",
    "message": "string (optional) - Custom message"
  }
}
```

#### `get_time`
```json
{
  "name": "get_time",
  "parameters": {}
}
```

### Resources

#### `data://users`
- **Type**: application/json
- **Content**: Array of user objects with id, name, email

#### `data://config`
- **Type**: application/json  
- **Content**: Server configuration and metadata

#### `text://welcome`
- **Type**: text/plain
- **Content**: Multi-line welcome message

### Prompts

#### `greeting`
```json
{
  "name": "greeting",
  "arguments": {
    "name": "string (required) - Person's name",
    "style": "string (optional) - formal|casual|friendly"
  }
}
```

#### `introduction`
```json
{
  "name": "introduction", 
  "arguments": {
    "audience": "string (optional) - developer|user|manager"
  }
}
```

## 🛠️ Development

### Project Structure
```
mcp-hello-world-server/
├── src/
│   └── index.ts          # Main server implementation
├── scripts/
│   ├── docker-build.sh   # Docker build script
│   ├── docker-run.sh     # Docker run script
│   └── docker-stop.sh    # Docker stop script
├── build/                # Compiled TypeScript output
├── Dockerfile            # Multi-stage Docker configuration
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

### Available Scripts

#### Core Scripts
- `npm run build` - Compile TypeScript
- `npm run start` - Start server (STDIO transport by default)
- `npm run dev` - Development mode with auto-rebuild

#### Transport-Specific Scripts
- `npm run start:stdio` - Start server with STDIO transport
- `npm run start:http` - Start server with HTTP transport

#### Development & Testing
- `npm run inspect` - Launch MCP Inspector for testing

#### Docker Scripts
- `npm run docker:build` - Build Docker image
- `npm run docker:run` - Run HTTP server in Docker (default)
- `npm run docker:run:stdio` - Run STDIO server in Docker
- `npm run docker:run:http` - Run HTTP server in Docker (explicit)
- `npm run docker:stop` - Stop Docker container
- `npm run docker:inspect` - Test Docker container with MCP Inspector

## 🐛 Troubleshooting

### Build Issues
- Ensure Node.js 22+ is installed: `node --version`
- Clear build cache: `rm -rf build/ node_modules/ && npm install`
- Check TypeScript errors: `npx tsc --noEmit`

### MCP Inspector Issues
- Ensure server builds first: `npm run build`
- Check for port conflicts (Inspector uses random ports)
- Try restarting: Kill Inspector and run `npm run inspect` again

### HTTP Transport Issues
- **Port conflicts**: Change port with `PORT=8080 npm run start:http`
- **Health check fails**: Verify server is running: `curl http://localhost:3000/health`
- **CORS issues**: Server has basic CORS enabled for development
- **Connection refused**: Ensure no firewall blocking port 3000

### Docker Issues
- Verify Docker is running: `docker info`
- Check image exists: `docker images | grep mcp-hello-world`
- View container logs: `docker logs mcp-hello-world`
- Health check: `docker exec mcp-hello-world curl -f http://localhost:3000/health`
- Rebuild image: `npm run docker:build`

### Environment Variables
- `TRANSPORT=stdio` (default for local) or `TRANSPORT=http`
- `PORT=3000` (default port for HTTP transport)
- `NODE_ENV=production` (for production builds)

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Test thoroughly: `npm run inspect` and `npm run docker:build`
5. Submit a pull request

---

**Built with the Model Context Protocol SDK**
