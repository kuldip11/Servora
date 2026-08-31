# Servora

Servora is a pre-production, multi-tenant restaurant operating platform built as a TypeScript monorepo. It combines POS/admin workflows, waiter operations, kitchen display, customer QR ordering, menu/pricing, billing/payments, inventory/recipes, analytics, realtime updates, RBAC, and a public website.

> **Current status: pre-release / not deployed.**
>
> There are no live users or production data to preserve. The repository should therefore favor a clean v1 architecture over backward-compatibility, phased-rollout, backfill, or legacy-client machinery.

## Engineering review

The current senior-engineering audit, identified pre-v1 cleanup work, architectural risks, and release priorities are maintained in:

**[`PRE_V1_ENGINEERING_REVIEW.md`](./PRE_V1_ENGINEERING_REVIEW.md)**

That document is the authoritative consolidation plan before the first production release.

## Applications

| Application | Package | Local dev |
| --- | --- | --- |
| API | `@pos/api` | `http://localhost:3000` |
| POS / Admin Web | `@pos/web` | `http://localhost:5173` |
| Kitchen Display | `@pos/kitchen-display` | `http://localhost:5174` |
| Waiter App | `@pos/waiter-app` | `http://localhost:5175` |
| Customer QR App | `@pos/customer-app` | `http://localhost:5176` |
| Public Website | `@pos/website` | `http://localhost:3001` |

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
└── PRE_V1_ENGINEERING_REVIEW.md
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

The current pre-v1 repository contains **87 ordered SQL migrations, `0000` through `0086`**.

The current Drizzle metadata is not fully synchronized: `_journal.json` contains all 87 migration entries, while snapshots currently exist only for `0000` through `0020`. This must be corrected as part of the pre-v1 migration-baseline consolidation; do not retroactively invent snapshots for the historical chain.

After the canonical baseline is rebuilt, **every migration must keep the Drizzle schema, SQL migration, `_journal.json`, and matching `NNNN_snapshot.json` synchronized in the same change**. A migration is not complete until all four agree and it has been verified from an empty database.

The engineering review recommends replacing the accumulated development-history chain with a clean canonical v1 baseline before the first production deployment. See `PRE_V1_ENGINEERING_REVIEW.md` for the migration acceptance checklist and remediation plan.

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

Servora should converge on these rules before v1:

1. Server-authoritative tenant, branch, permission, pricing, order, and inventory decisions.
2. One canonical database model with direct final constraints for the unreleased product.
3. Immutable order/pricing/inventory evidence where historical correctness matters.
4. No compatibility paths for users, data, tokens, APIs, or schema versions that have never existed in production.
5. Shared typed contracts from API through clients and applications.
6. Business logic in domain services/pure engines; persistence in repositories; thin routes/controllers.
7. Development previews, fixtures, demo paths, and roadmap terminology must not ship as production product behavior.
8. Critical restaurant flows require vertical browser/integration coverage, not only source-string verification.

## Documentation policy

To avoid conflicting implementation-history documentation, the repository intentionally maintains only:

- `README.md` — project entry point and development commands.
- `PRE_V1_ENGINEERING_REVIEW.md` — current technical review and consolidation plan.

Historical phase plans, completion reports, verification notes, and website planning documents are intentionally not retained in the active repository.
