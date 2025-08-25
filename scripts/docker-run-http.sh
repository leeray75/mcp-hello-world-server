#!/bin/bash
set -e

# Dedicated script for running HTTP transport mode
# This script is a convenience wrapper around docker-run.sh for HTTP mode

# Default values
PORT=${PORT:-3000}

# Help function
show_help() {
  echo "Usage: $0 [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --port=PORT         Set HTTP port [default: 3000]"
  echo "  --help              Show this help message"
  echo ""
  echo "Environment Variables:"
  echo "  PORT                HTTP port number"
  echo ""
  echo "Examples:"
  echo "  $0                  # HTTP transport on port 3000 (default)"
  echo "  $0 --port=3001      # HTTP transport on port 3001"
  echo "  PORT=8080 $0        # HTTP transport on port 8080 via env var"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --port=*)
      PORT="${1#*=}"
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

echo "🌐 Starting MCP Hello World Server in HTTP mode..."

# Call the main docker-run script with HTTP transport
TRANSPORT=http PORT=$PORT ./scripts/docker-run.sh --transport=http --port=$PORT
