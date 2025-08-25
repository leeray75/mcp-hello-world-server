#!/bin/bash
set -e

# Parse command line arguments
TRANSPORT=${TRANSPORT:-http}
PORT=${PORT:-3000}
CONTAINER_NAME="mcp-hello-world"

# Help function
show_help() {
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --transport=TYPE    Set transport type (stdio|http) [default: http]"
  echo "  --port=PORT         Set HTTP port [default: 3000]"
  echo "  --stdio             Use STDIO transport (shorthand for --transport=stdio)"
  echo "  --http              Use HTTP transport (shorthand for --transport=http)"
  echo "  --help              Show this help message"
  echo ""
  echo "Environment Variables:"
  echo "  TRANSPORT           Transport type (stdio|http)"
  echo "  PORT                HTTP port number"
  echo ""
  echo "Examples:"
  echo "  $0                           # HTTP transport on port 3000 (default)"
  echo "  $0 --stdio                   # STDIO transport"
  echo "  $0 --port=3001               # HTTP transport on port 3001"
  echo "  TRANSPORT=stdio $0           # STDIO transport via env var"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --transport=*)
      TRANSPORT="${1#*=}"
      shift
      ;;
    --port=*)
      PORT="${1#*=}"
      shift
      ;;
    --stdio)
      TRANSPORT="stdio"
      shift
      ;;
    --http)
      TRANSPORT="http"
      shift
      ;;
    --help)
      show_help
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Validate transport type
if [[ "$TRANSPORT" != "stdio" && "$TRANSPORT" != "http" ]]; then
  echo "❌ Error: Invalid transport type '$TRANSPORT'. Must be 'stdio' or 'http'."
  exit 1
fi

# Stop existing container if running
echo "🛑 Stopping existing container if running..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

echo "🚀 Starting MCP Hello World Server in Docker..."
echo "   Transport: $TRANSPORT"
if [[ "$TRANSPORT" == "http" ]]; then
  echo "   Port: $PORT"
fi

# Build docker run command based on transport type
DOCKER_CMD="docker run -d -it --name $CONTAINER_NAME --restart unless-stopped"

# Add environment variables
DOCKER_CMD="$DOCKER_CMD -e TRANSPORT=$TRANSPORT"

# Add port mapping for HTTP transport
if [[ "$TRANSPORT" == "http" ]]; then
  DOCKER_CMD="$DOCKER_CMD -e PORT=$PORT -p $PORT:$PORT"
fi

# Add image name
DOCKER_CMD="$DOCKER_CMD mcp-hello-world-server:latest"

# Execute the command
eval $DOCKER_CMD

echo "✅ Container started successfully!"
echo ""
echo "📋 Container Details:"
echo "  Name: $CONTAINER_NAME"
echo "  Image: mcp-hello-world-server:latest"
echo "  Transport: $TRANSPORT"
if [[ "$TRANSPORT" == "http" ]]; then
  echo "  HTTP Port: $PORT"
  echo "  Health Check: http://localhost:$PORT/health"
  echo "  SSE Endpoint: http://localhost:$PORT/mcp/events"
fi
echo ""
echo "📝 Useful Commands:"
echo "  View logs: docker logs -f $CONTAINER_NAME"
echo "  Stop: npm run docker:stop"
echo "  Restart: docker restart $CONTAINER_NAME"
if [[ "$TRANSPORT" == "http" ]]; then
  echo "  Test health: curl http://localhost:$PORT/health"
fi
echo ""

# Show container status
echo "📊 Container Status:"
docker ps --filter name=$CONTAINER_NAME --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
