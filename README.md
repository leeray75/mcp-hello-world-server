# MCP Hello World Server

A minimal Model Context Protocol (MCP) server demonstrating all core MCP features: Tools, Resources, and Prompts.

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

## 📋 Prerequisites

- Node.js 22+ (LTS recommended)
- npm or yarn package manager
- Docker (for containerized deployment)

## ⚡ Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Test with MCP Inspector:**
   ```bash
   npm run inspect
   ```

### Docker Deployment

1. **Build Docker image:**
   ```bash
   npm run docker:build
   ```

2. **Run in production mode:**
   ```bash
   npm run docker:run
   ```

3. **Stop the container:**
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

### Claude Desktop Integration
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

### Other MCP Clients
This server uses stdio transport and is compatible with any MCP client that supports the standard protocol.

## 🏗️ Architecture

- **Transport**: stdio (stdin/stdout communication)
- **Protocol**: Model Context Protocol v2024-11-05
- **Runtime**: Node.js 22+ with ES modules
- **Language**: TypeScript with strict type checking
- **Container**: Multi-stage Docker build with Alpine Linux

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
- `npm run build` - Compile TypeScript
- `npm run start` - Start the server
- `npm run dev` - Development mode with watch
- `npm run inspect` - Launch MCP Inspector
- `npm run docker:build` - Build Docker image
- `npm run docker:run` - Run Docker container
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

### Docker Issues
- Verify Docker is running: `docker info`
- Check image exists: `docker images | grep mcp-hello-world`
- View container logs: `docker logs mcp-hello-world`
- Rebuild image: `npm run docker:build`

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
