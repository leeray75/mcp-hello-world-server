#!/usr/bin/env sh
set -eu

# Build the Docker image for mcp-hello-world-server
# Usage: ./build.sh [tag]
# Defaults:
#   TAG=${1:-mcp-hello-world-server:latest}
#   PORT is set in Dockerfile / runtime (default 3001)

TAG=${1:-mcp-hello-world-server:latest}
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "Building Docker image $TAG from $ROOT_DIR"
docker build -t "$TAG" "$ROOT_DIR"
echo "Built $TAG"
