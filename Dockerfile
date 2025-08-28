# Multi-stage build based on rules-mcp-server pattern
FROM node:22-alpine AS builder

# Install build tools for any native deps
RUN apk add --no-cache python3 make g++ git

WORKDIR /app

# Copy package manifests and install dev dependencies for build
COPY package*.json ./
RUN npm ci

# Copy source & build
COPY . .
RUN npm run build
# Remove dev deps to keep builder small for copy
RUN npm prune --omit=dev

# Production stage
FROM node:22-alpine AS production

# Install curl for HEALTHCHECK
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcp -u 1001 -G nodejs

WORKDIR /app

# Copy only what's needed from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Ensure correct ownership
RUN chown -R mcp:nodejs /app
USER mcp

# Default runtime env
ENV NODE_ENV=production
ENV PORT=3001
ENV TRANSPORT=http

# Expose the configured HTTP port
EXPOSE 3001

# Health check: check HTTP /health when using HTTP transport
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD if [ "$TRANSPORT" = "http" ]; then \
        curl -f http://localhost:${PORT}/health || exit 1; \
      else \
        # For non-HTTP transports (stdio), assume container is healthy if process is running
        ps aux | grep -v grep | grep node >/dev/null || exit 1; \
      fi

# Start the server
CMD ["node", "build/index.js"]
