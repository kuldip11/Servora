# Servora Production Runbook

## Deployment topology

Servora's production Compose stack binds application ports to `127.0.0.1` only. A single external TLS reverse proxy/load balancer is the public ingress and routes the public HTTPS/WSS hostnames to those loopback ports. PostgreSQL and Redis are internal Compose services and must not be published publicly.

Recommended public hosts:

- `www.<domain>` → website
- `app.<domain>` → web POS/admin
- `kitchen.<domain>` → kitchen display
- `waiter.<domain>` → waiter app
- `order.<domain>` → customer ordering
- `api.<domain>` → API and websocket endpoints

TLS terminates at the trusted ingress. Configure `TRUST_PROXY_HOPS=1` for this one-proxy topology. Set it to `0` when the API is reached directly. Increase it only when every additional proxy hop is controlled by the operator. The API ignores forwarding headers when the value is `0`, preventing clients from spoofing rate-limit/audit IPs.

## Authentication cookie

Refresh tokens are rotated through the host-only `servora_refresh` HttpOnly cookie on the API origin. They are never returned in JSON or persisted in browser JavaScript storage. Production cookies are `Secure`, `HttpOnly`, `SameSite=None`, and scoped to `/api/auth`. CORS must list the exact frontend HTTPS origins and keep credentials enabled.

## Security headers

The four nginx-served apps include `deploy/nginx/security-headers.conf`. The API and website emit the same baseline protections: content type sniffing disabled, framing denied, restrictive referrer/permissions policy, COOP/CORP, and CSP. Razorpay/Google Analytics origins are explicitly allowlisted where required by the current product.

## Health checks

- `/health/live`: process liveness only.
- `/health/ready`: requires PostgreSQL and Redis and returns HTTP 503 when either dependency is unavailable.
- `/health`: versioned basic health endpoint.
- nginx apps expose `/health`; the website container health-checks its root route.

The load balancer should use API `/health/ready` for traffic readiness and container orchestrators should use the Docker health checks. Do not restart a healthy process solely because an external dependency has a short outage; remove it from traffic until readiness recovers.

## Backup and restore

Create a custom-format PostgreSQL backup with:

```bash
DATABASE_URL='...' bun run db:backup
```

Backups must be encrypted at rest by the storage platform, copied off-host, access-controlled, and retained according to the operator's retention policy. Record the PostgreSQL major version with each backup.

Restore only into an explicitly selected target:

```bash
DATABASE_URL='postgresql://.../restore_target' \
BACKUP_FILE='./backups/servora-....dump' \
RESTORE_CONFIRMATION=RESTORE_SERVORA_DATABASE \
bun run db:restore
```

Before a release, restore the newest backup into a disposable database using the same PostgreSQL major version, run the migration/reference-data verifier against it, and execute the production smoke suite. A backup is not considered valid until a restore has succeeded.

## Release smoke

First validate environment configuration:

```bash
bun run validate:production-env
```

After deploying, run HTTP readiness for every public application:

```bash
SMOKE_API_URL=https://api.<domain> \
SMOKE_WEB_URL=https://app.<domain> \
SMOKE_KITCHEN_URL=https://kitchen.<domain> \
SMOKE_WAITER_URL=https://waiter.<domain> \
SMOKE_CUSTOMER_URL=https://order.<domain> \
SMOKE_WEBSITE_URL=https://www.<domain> \
bun run smoke:production
```

Then run the existing POS Playwright critical path against the deployment. Release certification requires login/refresh, one complete order → kitchen → bill → payment → inventory flow, and confirmation that Redis/realtime plus the Razorpay webhook worker are healthy.

## Incident checks

When the API is unhealthy, check `/health/ready`, API structured logs by `x-request-id`, PostgreSQL connectivity, Redis connectivity, and the webhook worker. During auth incidents, verify exact CORS origins and that the API response sets `servora_refresh`; never ask operators or users to expose refresh-token values.

## Metrics

The API exposes Prometheus text format at `/metrics`. The endpoint deliberately returns 404 unless the request includes `Authorization: Bearer <METRICS_TOKEN>`. Keep the metrics route reachable only from the monitoring network at the ingress layer as an additional control.

Current production signals include:

- `servora_api_request_duration_ms` — API request duration summary by method/status.
- `servora_db_query_duration_ms{operation="readiness"}` — PostgreSQL readiness-query latency.
- `servora_websocket_connections{kind="staff|customer"}` — active websocket gauges.
- `servora_redis_available` — Redis connectivity gauge.
- `servora_payment_webhook_failures_total` — Razorpay ingress/worker/queue failures.
- `servora_order_processing_errors_total` — order persistence/inventory-side-effect failures.

Alerting should at minimum cover sustained API 5xx/latency increases, database readiness latency, Redis availability dropping to zero, websocket connection collapse, webhook failure growth, and order-processing error growth.
