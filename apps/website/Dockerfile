FROM oven/bun:1.3.14-alpine AS builder
WORKDIR /app

COPY package.json bun.lock turbo.json tsconfig.base.json ./
COPY packages/ ./packages/
COPY apps/ ./apps/

RUN bun install --frozen-lockfile

ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_APP_SIGNIN_URL
ARG NEXT_PUBLIC_WEB_APP_URL
ARG NEXT_PUBLIC_KITCHEN_APP_URL
ARG NEXT_PUBLIC_WAITER_APP_URL
ARG NEXT_PUBLIC_CUSTOMER_APP_URL
ARG NEXT_PUBLIC_GA_ID

ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_APP_SIGNIN_URL=$NEXT_PUBLIC_APP_SIGNIN_URL \
    NEXT_PUBLIC_WEB_APP_URL=$NEXT_PUBLIC_WEB_APP_URL \
    NEXT_PUBLIC_KITCHEN_APP_URL=$NEXT_PUBLIC_KITCHEN_APP_URL \
    NEXT_PUBLIC_WAITER_APP_URL=$NEXT_PUBLIC_WAITER_APP_URL \
    NEXT_PUBLIC_CUSTOMER_APP_URL=$NEXT_PUBLIC_CUSTOMER_APP_URL \
    NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID

WORKDIR /app/apps/website
RUN bun run build

FROM oven/bun:1.3.14-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json /app/bun.lock ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/website ./apps/website

WORKDIR /app/apps/website
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:3000').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

CMD ["bun", "run", "start"]
