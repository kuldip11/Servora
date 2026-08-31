# Servora

Servora is a pre-production, multi-tenant restaurant operating platform built as a TypeScript monorepo. It combines POS/admin workflows, waiter operations, kitchen display, customer QR ordering, menu and pricing, billing and payments, inventory and recipes, analytics, realtime updates, RBAC, and a public website.

> **Current status: pre-production / not yet released.**
>
> There are no live users or production data to preserve. The repository should favor a clean v1 architecture over backward-compatibility, phased-rollout, backfill, or legacy-client machinery that has never been required in production.

## Product roadmap

Future product opportunities are captured in [`PRODUCT_FEATURE_ROADMAP.md`](./PRODUCT_FEATURE_ROADMAP.md). Security findings, remediation history, and remaining production-certification work are tracked in [`SECURITY_AUDIT.md`](./SECURITY_AUDIT.md).

## Applications

| Application     | Package                | Local dev               |
| --------------- | ---------------------- | ----------------------- |
| API             | `@pos/api`             | `http://localhost:3000` |
| POS / Admin Web | `@pos/web`             | `http://localhost:5173` |
| Kitchen Display | `@pos/kitchen-display` | `http://localhost:5174` |
| Waiter App      | `@pos/waiter-app`      | `http://localhost:5175` |
| Customer QR App | `@pos/customer-app`    | `http://localhost:5176` |
| Public Website  | `@pos/website`         | `http://localhost:3001` |

## Shared packages

- `@pos/api-client` — shared HTTP client and authentication refresh handling.
- `@pos/config` — shared application configuration.
- `@pos/realtime` — shared realtime client/hooks.
- `@pos/types` — shared domain TypeScript types.
- `@pos/ui` — shared React UI system.
- `@pos/validation` — shared validation schemas.

## Core stack

- **Runtime:** Bun
- **Language:** TypeScript
- **Backend:** Elysia
- **Database:** PostgreSQL + Drizzle ORM
- **Realtime / cache:** Redis + WebSockets
- **Frontend:** React 19, Vite, TanStack Router, TanStack Query, Zustand
- **Website:** Next.js
- **Styling:** Tailwind CSS
- **Validation:** Zod / TypeBox
- **Tests:** Vitest + Playwright
- **Monorepo:** Turborepo + Bun workspaces

## Repository structure

```text
.
├── apps/
│   ├── api/
│   ├── web/
│   ├── kitchen-display/
│   ├── waiter-app/
│   ├── customer-app/
│   └── website/
├── packages/
│   ├── api-client/
│   ├── config/
│   ├── realtime/
│   ├── types/
│   ├── ui/
│   └── validation/
├── scripts/
├── docker/
├── docker-compose.yml
├── package.json
├── bun.lock
├── README.md
├── PRODUCT_FEATURE_ROADMAP.md
└── SECURITY_AUDIT.md
```

## Local setup

Install dependencies:

```bash
bun install
```

Create the required environment files from each application's `.env.example` and configure local PostgreSQL/Redis URLs and development secrets.

Start infrastructure when using the local Compose stack:

```bash
bun run docker:up
```

Reset and migrate a disposable development database:

```bash
bun run db:reset
bun run db:migrate
```

Optional development data:

```bash
bun run db:seed
```

Start all applications:

```bash
bun run dev
```

## Database state

The current pre-v1 repository contains **78 ordered SQL migrations, `0000` through `0077`**.

Because Servora has not been released and has no production data, schema changes should continue to target the clean intended v1 model rather than adding compatibility backfills or phased migration machinery for historical production states that do not exist.

Migration integrity is verified by the repository's migration verification tooling. A schema change is not complete until the application schema, SQL migration, migration metadata/snapshots used by the project, and verification checks agree.

## Verification

Run the main quality gates before accepting a change:

```bash
bun run typecheck
bun run lint
bun run test
bun run build
```

Additional verification:

```bash
bun run test:coverage
bun run test:e2e
bun run test:a11y
bun run verify:migrations
bun run audit:rbac
```

For the broad release baseline:

```bash
bun run verify:baseline:all
```

Static/source verifiers are architecture guards only. They do not replace TypeScript, unit/integration tests, browser E2E, database validation, or production smoke testing.

## Architecture principles

1. Keep tenant, branch, permission, pricing, order, inventory, and payment decisions server-authoritative.
2. Maintain one canonical database model with direct final constraints while the product remains unreleased.
3. Preserve immutable order, pricing, payment, and inventory evidence where historical correctness matters.
4. Do not add compatibility paths for users, data, tokens, APIs, or schema versions that have never existed in production.
5. Keep shared contracts typed from API through clients and applications.
6. Keep business logic in domain services/pure engines, persistence in repositories, and routes/controllers thin.
7. Use feature-level structure consistently (`components`, `constants`, `hooks`, `pages`, `services`, `types`, `utils`, and tests only where needed).
8. Prefer the configured `@/...` aliases over parent-relative application imports.
9. Keep reusable static feature configuration in feature-level `constants` modules rather than embedding it in UI components.
10. Treat realtime connectivity, failure handling, permissions, and cross-tenant isolation as product-critical behavior.
11. Critical restaurant workflows require vertical integration/browser coverage, not only unit or source-verification tests.

## Documentation policy

The active repository intentionally keeps only two Markdown documents:

- `README.md` — project entry point, architecture conventions, setup, and verification commands.
- `PRODUCT_FEATURE_ROADMAP.md` — product ideas reserved for later prioritization.
- `SECURITY_AUDIT.md` — security findings, remediation status, and production-certification follow-up.

Historical engineering reviews, implementation-status reports, phase plans, runbooks, completion notes, and audit commentary are not retained in the active source tree. Operational runbook content that becomes necessary for production should be represented by executable scripts/configuration or reintroduced only when it is an active release requirement.
