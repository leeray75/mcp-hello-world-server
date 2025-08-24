#!/bin/bash
set -e

# Stop existing container if running
echo "🛑 Stopping existing container if running..."
docker stop mcp-hello-world 2>/dev/null || true
docker rm mcp-hello-world 2>/dev/null || true

echo "🚀 Starting MCP Hello World Server in Docker..."

# Run the container
docker run -d \
  --name mcp-hello-world \
  --restart unless-stopped \
  -p 3000:3000 \
  mcp-hello-world-server:latest

echo "✅ Container started successfully!"
echo ""
echo "📋 Container Details:"
echo "  Name: mcp-hello-world"
echo "  Image: mcp-hello-world-server:latest"
echo "  Port: 3000 (for future HTTP support)"
echo ""
echo "📝 Useful Commands:"
echo "  View logs: docker logs -f mcp-hello-world"
echo "  Stop: npm run docker:stop"
echo "  Restart: docker restart mcp-hello-world"
echo ""

# Show container status
echo "📊 Container Status:"
docker ps --filter name=mcp-hello-world --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
