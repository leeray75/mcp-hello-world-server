#!/bin/bash
set -e

echo "🐳 Building MCP Hello World Server Docker image..."

# Build the Docker image
docker build -t mcp-hello-world-server:latest .

echo "✅ Docker image built successfully!"
echo "📦 Image: mcp-hello-world-server:latest"
echo ""
echo "Next steps:"
echo "  Run: npm run docker:run"
echo "  Or: ./scripts/docker-run.sh"
