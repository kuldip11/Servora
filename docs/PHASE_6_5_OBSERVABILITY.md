# Phase 6.5 — Observability

Status: **COMPLETE**

Implemented:
- Preserved request IDs and response-time headers.
- Added structured `request.completed` events for method, path, status and duration.
- Added structured startup/shutdown lifecycle logging.
- `/health` reports `APP_VERSION`.
- `/health/ready` exposes dependency state for PostgreSQL and Redis without exposing credentials or connection strings.
- Existing logger redaction continues to remove password/token/secret-like metadata.
