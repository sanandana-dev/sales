# -------------------------------------------------------------
# Stage 1: Build the production frontend client
# -------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and workspace manifests
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
COPY shared/package*.json ./shared/

# Install build dependencies
RUN npm ci

# Copy full repository source
COPY . .

# Build client production bundle
RUN npm run build

# -------------------------------------------------------------
# Stage 2: Minimal production runtime
# -------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=5000

# Install sqlite runtime dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++ sqlite

# Create dedicated non-root application user and group
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy package manifests for production dependencies
COPY package*.json ./
COPY client/package*.json ./client/
COPY server/package*.json ./server/
COPY shared/package*.json ./shared/

# Install only production dependencies
RUN npm ci --omit=dev

# Copy built frontend client assets from builder stage
COPY --from=builder /app/client/dist ./client/dist

# Copy backend server and shared modules
COPY server ./server
COPY shared ./shared

# Change ownership to non-root appuser
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "server/src/index.js"]
