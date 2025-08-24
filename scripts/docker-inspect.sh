#!/bin/bash

echo "🐳 Testing Docker container with MCP Inspector..."

# Check if Docker container is running
if ! docker ps --format "table {{.Names}}" | grep -q "mcp-hello-world"; then
    echo "⚠️  Container 'mcp-hello-world' is not running."
    echo "   Starting container first..."
    ./scripts/docker-run.sh
    echo ""
    sleep 2
fi

echo "🔍 Launching MCP Inspector to test Docker container..."
echo "   This will connect MCP Inspector to the containerized server"
echo ""

# Use docker exec to run the server in the container and pipe to inspector
docker exec -i mcp-hello-world node build/index.js | npx @modelcontextprotocol/inspector

echo ""
echo "✅ Docker MCP Inspector session completed!"
