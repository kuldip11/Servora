# Phase 6.3 — Security Hardening

Status: **COMPLETE**

Implemented:

- Added global API security response headers.
- Added Redis-backed fixed-window rate limiting with configurable limits.
- Health, Swagger and WebSocket paths are excluded from general request throttling.
- Production JWT and refresh secrets must be at least 32 characters.
- Production wildcard CORS is rejected.
- Production CORS origins must use public HTTPS URLs.
- Existing membership/tenant/branch authorization remains the boundary for realtime sockets.
- Existing secret/token redaction in structured logs is preserved.

New API environment values:

```text
APP_VERSION
RATE_LIMIT_MAX
RATE_LIMIT_WINDOW_SECONDS
```
