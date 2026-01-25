# Backend Dockerfile - Bun + Hono server
# Multi-stage build for optimized production image

# Stage 1: Install dependencies and build
FROM oven/bun:1 AS builder
WORKDIR /app

# Copy all package files for monorepo
COPY package.json bun.lock* ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/
COPY pnpm-workspace.yaml ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source files
COPY packages/shared ./packages/shared
COPY apps/backend ./apps/backend
COPY tsconfig.base.json ./

# Build shared package first
WORKDIR /app/packages/shared
RUN bun run build

# Build backend
WORKDIR /app/apps/backend
RUN bun run build

# Stage 2: Production runtime
FROM oven/bun:1-slim AS runner
WORKDIR /app

# Create non-root user for security
RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid nodejs bunjs

# Copy built application
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/package.json ./

# Create data directory for SQLite with proper permissions
RUN mkdir -p /app/data && chown -R bunjs:nodejs /app/data

# Switch to non-root user
USER bunjs

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV DATABASE_PATH=/app/data/data.db

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD bun --eval "fetch('http://localhost:3000/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

# Start the application
CMD ["bun", "run", "dist/index.js"]
