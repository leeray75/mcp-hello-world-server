#!/usr/bin/env sh
set -eu

# Run the Model Context Protocol Inspector against this server.
# Usage:
#   ./inspector.sh dev        # run inspector against local source (tsx)
#   ./inspector.sh http       # run inspector against http endpoint (http://localhost:3001/mcp)
#   ./inspector.sh sse        # run inspector against sse endpoint (http://localhost:3001/sse)
#   ./inspector.sh build      # build then run inspector against built artifact
#
MODE=${1:-dev}

case "$MODE" in
  dev)
    echo "Running inspector against local source (tsx)"
    npx @modelcontextprotocol/inspector tsx src/index.ts
    ;;
  build)
    echo "Building project..."
    npm run build
    echo "Running inspector against built artifact"
    npx @modelcontextprotocol/inspector node build/index.js
    ;;
  http)
    echo "Running inspector against HTTP endpoint http://localhost:3001/mcp"
    npx @modelcontextprotocol/inspector http://localhost:3001/mcp
    ;;
  sse)
    echo "Running inspector against SSE endpoint http://localhost:3001/sse"
    npx @modelcontextprotocol/inspector http://localhost:3001/sse
    ;;
  *)
    echo "Unknown mode: $MODE"
    echo "Usage: ./inspector.sh [dev|build|http|sse]"
    exit 2
    ;;
esac
