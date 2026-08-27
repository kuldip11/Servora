# Servora Foundation Contract

Phase 1 foundation is the contract every Servora application follows.

## Application URLs

All cross-application links use environment configuration. The public website uses `NEXT_PUBLIC_*_APP_URL`; Vite applications use the corresponding `VITE_*_APP_URL` variables. Runtime code resolves them through `@pos/config`.

## API responses

Successful JSON API responses use `{ success: true, data }` through the response helpers in `apps/api/src/core/response`. Errors use the typed `AppError` hierarchy and `{ success: false, code, message, details?, timestamp }`.

Infrastructure health endpoints are intentionally separate:

- `GET /health/live` — process liveness.
- `GET /health/ready` — database readiness.

## Environment validation

Run:

```bash
bun run validate:env
```

Production website variables are additionally checked with:

```bash
bun --cwd apps/website run validate:production-env
```

## Quality gates

```bash
bun run verify:foundation
bun run verify
```

`verify:foundation` validates environment examples, linting, application typechecks and application builds. `verify` adds the workspace test suite.
