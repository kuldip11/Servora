# ─── Build stage ──────────────────────────────────────────────────────────────
FROM oven/bun:1.3.14-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package.json bun.lockb turbo.json tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Install all deps
RUN bun install --frozen-lockfile

# Build the API
WORKDIR /app/apps/api
RUN bun run build

# ─── Production stage ─────────────────────────────────────────────────────────
FROM oven/bun:1.3.14-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy built output
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./

# Install prod deps only
RUN bun install --production --frozen-lockfile

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD bun -e "fetch('http://localhost:3000/health').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

CMD ["bun", "run", "dist/index.js"]
