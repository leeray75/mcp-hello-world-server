#!/usr/bin/env sh
set -eu

# Run the mcp-hello-world-server Docker container
# Usage: ./run.sh [--http|--stdio] [tag]
# Defaults:
#   MODE=--http
#   TAG=mcp-hello-world-server:latest
#   PORT defaults to 3001 inside container (exposed by Dockerfile)

MODE="http"
TAG=${2:-mcp-hello-world-server:latest}
# allow first arg to be tag if not a flag
if [ "${1:-}" != "" ]; then
  case "$1" in
    --http) MODE="http" ;;
    --stdio) MODE="stdio" ;;
    *)
      TAG="$1"
      ;;
  esac
fi

CONTAINER_NAME="mcp-hello-world-server"
HOST_PORT=${HOST_PORT:-3001}
INSPECTOR_PORT=${INSPECTOR_PORT:-9229}

echo "Running container $CONTAINER_NAME (mode=$MODE, tag=$TAG) -> host port $HOST_PORT"

# Remove existing container if present
if [ "$(docker ps -aq -f name=^/${CONTAINER_NAME}$)" != "" ]; then
  echo "Removing existing container $CONTAINER_NAME"
  docker rm -f "$CONTAINER_NAME" >/dev/null || true
fi

# Compose environment args
ENV_ARGS="-e PORT=3001"
if [ "$MODE" = "http" ]; then
  ENV_ARGS="$ENV_ARGS -e TRANSPORT=http"
else
  ENV_ARGS="$ENV_ARGS -e TRANSPORT=stdio"
fi

# Run container
docker run -d \
  --name "$CONTAINER_NAME" \
  -p "${HOST_PORT}:3001" \
  $ENV_ARGS \
  "$TAG"

echo "Container started. To view logs: ./scripts/logs.sh"
