#!/bin/bash
set -e

echo "🛑 Stopping MCP Hello World Server container..."

docker stop mcp-hello-world 2>/dev/null || {
  echo "⚠️  Container 'mcp-hello-world' not running"
  exit 0
}

docker rm mcp-hello-world 2>/dev/null || true

echo "✅ Container stopped and removed successfully!"
