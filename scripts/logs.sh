#!/usr/bin/env sh
set -eu

# Tail logs for the mcp-hello-world-server container
# Usage: ./logs.sh

CONTAINER_NAME="mcp-hello-world-server"

if [ "$(docker ps -q -f name=^/${CONTAINER_NAME}$)" = "" ]; then
  echo "No running container named $CONTAINER_NAME"
  exit 0
fi

docker logs -f "$CONTAINER_NAME"
