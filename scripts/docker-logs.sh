#!/bin/bash
set -e

echo "📋 Viewing MCP Hello World Server container logs..."
echo "   (Press Ctrl+C to exit log viewing)"
echo ""

# Check if container exists first
if ! docker ps -a --filter name=mcp-hello-world --format "{{.Names}}" | grep -q "mcp-hello-world"; then
  echo "⚠️  Container 'mcp-hello-world' not found"
  echo "   Run: npm run docker:run"
  exit 1
fi

# Follow the logs
docker logs -f mcp-hello-world
