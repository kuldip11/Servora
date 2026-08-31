FROM oven/bun:1.3.14-alpine AS builder
WORKDIR /app

COPY package.json bun.lock turbo.json tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/

RUN bun install --frozen-lockfile

ARG VITE_API_URL
ARG VITE_WS_URL

ENV VITE_API_URL=$VITE_API_URL \
    VITE_WS_URL=$VITE_WS_URL

WORKDIR /app/apps/kitchen-display
RUN bun run build

FROM nginx:alpine AS runner
COPY --from=builder /app/apps/kitchen-display/dist /usr/share/nginx/html
COPY apps/kitchen-display/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/health >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
