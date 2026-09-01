# ─── Build stage ──────────────────────────────────────────────────────────────
FROM oven/bun:1.3.14-alpine AS builder

WORKDIR /app

COPY package.json bun.lock turbo.json tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/

RUN bun install --frozen-lockfile

ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_WEB_APP_URL
ARG VITE_KITCHEN_APP_URL
ARG VITE_WAITER_APP_URL
ARG VITE_CUSTOMER_APP_URL

ENV VITE_API_URL=$VITE_API_URL \
    VITE_WS_URL=$VITE_WS_URL \
    VITE_WEB_APP_URL=$VITE_WEB_APP_URL \
    VITE_KITCHEN_APP_URL=$VITE_KITCHEN_APP_URL \
    VITE_WAITER_APP_URL=$VITE_WAITER_APP_URL \
    VITE_CUSTOMER_APP_URL=$VITE_CUSTOMER_APP_URL

WORKDIR /app/apps/web
RUN bun run build

# ─── Serve with nginx ─────────────────────────────────────────────────────────
FROM nginx:alpine AS runner

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/nginx/security-headers.conf /etc/nginx/snippets/servora-security-headers.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
