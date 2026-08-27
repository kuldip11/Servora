# Phase 6.4 — Reliability

Status: **COMPLETE**

Implemented:
- Readiness now validates both PostgreSQL and Redis instead of database-only readiness.
- Added explicit Redis connection shutdown.
- Added explicit database connection shutdown.
- SIGINT/SIGTERM now trigger one idempotent graceful shutdown sequence.
- The HTTP listener, webhook worker, Redis clients and database clients are closed during shutdown.
- Existing payment/customer idempotency and retry migrations remain intact.
- Rate-limit Redis failure is fail-open for request availability while readiness reports Redis unhealthy.
