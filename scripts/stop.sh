#!/usr/bin/env sh
set -eu

# Stop and remove the mcp-hello-world-server container
# Usage: ./stop.sh

CONTAINER_NAME="mcp-hello-world-server"

if [ "$(docker ps -q -f name=^/${CONTAINER_NAME}$)" = "" ]; then
  echo "No running container named $CONTAINER_NAME"
else
  echo "Stopping container $CONTAINER_NAME"
  docker rm -f "$CONTAINER_NAME"
  echo "Stopped and removed $CONTAINER_NAME"
fi
