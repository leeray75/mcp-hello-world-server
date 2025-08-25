# Multi-stage build for production optimization
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mcp -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/build ./build

# Change ownership to non-root user
RUN chown -R mcp:nodejs /app
USER mcp

# Environment variables
ENV TRANSPORT=http
ENV PORT=3000

# Health check - checks HTTP health endpoint when in HTTP mode, falls back to simple check for STDIO
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD if [ "$TRANSPORT" = "http" ]; then \
        curl -f http://localhost:${PORT:-3000}/health || exit 1; \
      else \
        node -e "console.log('Server is healthy')" || exit 1; \
      fi

# Expose port for HTTP transport
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
