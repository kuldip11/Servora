# Restaurant POS SaaS

A multi-tenant restaurant point-of-sale platform implemented as a TypeScript monorepo. The system provides a central API plus separate applications for the main POS dashboard, waiter workflow, and kitchen display, with PostgreSQL for durable data and Redis for realtime infrastructure.

> **Production status: NOT READY FOR PRODUCTION.**
>
> The application has a solid architectural foundation and substantial implemented functionality, but the repository should not be deployed to production yet. The main blockers are transaction boundaries in payment completion, production infrastructure configuration, incomplete production verification, and remaining product/operational hardening.

## 1. What the application does

The platform is designed for restaurants operating one or more branches under a tenant/franchise model.

### Main capabilities

- User signup, login, refresh-token authentication, and authenticated user context.
- Multi-tenant / franchise membership management.
- Branch selection and branch-scoped authorization.
- Role-based access control (RBAC) with global, tenant, and branch roles.
- Menu categories, items, modifiers, recipes, allergens, tags, images, scheduling, templates, and import/export operations.
- Restaurant tables and table status management.
- Order creation, item customization, order status transitions, kitchen ticket flow, and inventory impact.
- Kitchen display workflow.
- Waiter application for table/order operations.
- Billing records, payments, and refunds.
- Inventory and stock adjustments.
- Staff management and role/branch assignment.
- Analytics endpoints and dashboard support.
- Realtime infrastructure using WebSockets and Redis Pub/Sub.
- Shared validation, types, API client, realtime client, and UI component packages.

## 2. Repository structure

```text
.
├── apps/
│   ├── api/                 # Bun + Elysia backend and PostgreSQL access
│   ├── web/                 # Main restaurant POS dashboard
│   ├── waiter-app/          # Waiter-facing application
│   └── kitchen-display/     # Kitchen display system
├── packages/
│   ├── api-client/          # Shared typed HTTP client
│   ├── realtime/             # Shared realtime client/hooks
│   ├── types/                # Shared domain TypeScript types
│   ├── ui/                   # Shared React UI components/theme
│   └── validation/           # Shared validation schemas
├── apps/api/src/db/
│   ├── schema/               # Drizzle database schema
│   ├── migrations/            # Ordered SQL migrations
│   └── seed/                  # Development/demo seed data
├── docker/
│   └── nginx.conf             # Local reverse-proxy configuration
├── docker-compose.yml         # Local PostgreSQL/Redis/nginx stack
├── package.json               # Workspace scripts
├── bun.lock                   # Bun dependency lockfile
└── README.md                  # Authoritative project documentation
```

The repository intentionally keeps this README as the single maintained documentation source. Historical phase notes, test inventories, coverage plans, and implementation-status documents have been removed to prevent conflicting documentation.

## 3. Technology stack

| Layer | Technology |
|---|---|
| Runtime | Bun |
| Language | TypeScript |
| Backend | Elysia |
| ORM | Drizzle ORM |
| Database | PostgreSQL 16 |
| Cache / realtime infrastructure | Redis 7 |
| Main frontend | React 19 + Vite |
| Routing | TanStack Router |
| Server state | TanStack Query |
| Local state | Zustand |
| Styling | Tailwind CSS |
| Validation | Zod / TypeBox |
| Monorepo | Turborepo + Bun workspaces |
| Unit/component tests | Vitest |
| Browser E2E | Playwright |
| Accessibility tests | Playwright + axe |
| Authentication | JWT access tokens + persisted refresh tokens |
| Realtime | WebSockets + Redis Pub/Sub |

## 4. Runtime architecture

The application follows a layered backend design:

```text
Browser / POS / Waiter / KDS
          │
          ▼
      API client
          │
          ▼
       Elysia API
          │
    ┌─────┴─────────────┐
    │                   │
 Authentication     Module routes
    │                   │
    ▼                   ▼
Auth context       Controllers
                        │
                        ▼
                    Services
                        │
                        ▼
                   Repositories
                        │
               ┌────────┴────────┐
               ▼                 ▼
          PostgreSQL           Redis
```

Controllers are intended to stay thin. Domain/business rules belong in services and authorization helpers, while database operations belong in repositories.

## 5. Authentication and authorization

### Authentication

The API exposes:

```text
POST /api/auth/signup
POST /api/auth/login
POST /api/auth/refresh
GET  /api/auth/me
GET  /api/auth/memberships
```

The access token identifies the user. The current tenant/franchise and branch are deliberately **not trusted from the access token**.

### Request-scoped tenant and branch context

Authenticated requests can select context using:

```text
Authorization: Bearer <access-token>
X-Tenant-ID: <tenant-id>
X-Branch-ID: <branch-id>
```

The API resolves membership and branch access against PostgreSQL on the request path. This prevents a stale token from permanently pinning a user to a previous branch or tenant.

### RBAC model

The principal authorization relationships are:

```text
User
 ├── Global user roles
 └── Tenant memberships
       ├── Membership roles
       └── Membership branches

Role
 └── Role permissions
       └── Permission
```

Reference roles currently include:

- `OWNER`
- `FRANCHISE_ADMIN`
- `MANAGER`
- `CHEF`
- `WAITER`
- `CASHIER`
- `INVENTORY_MANAGER`
- `RECEPTIONIST`
- `ACCOUNTANT`

The RBAC reference migration installs the canonical permissions and verifies that the required bootstrap roles and permission data exist before the migration completes.

## 6. Database and migrations

The API uses Drizzle ORM with PostgreSQL. The migration chain currently contains ordered SQL migrations from `0000` through `0020`.

Important groups of migrations cover:

- enums and foundational types
- tenants and branches
- users and authentication
- roles and permissions
- tenant memberships
- staff
- restaurant tables
- menu
- inventory
- orders
- kitchen tickets
- billing
- analytics
- foreign keys
- indexes
- RBAC reference data
- menu reference data
- additional integrity constraints/indexes

### Development database

Start PostgreSQL and Redis:

```bash
docker compose up -d postgres redis
```

The local compose configuration exposes:

```text
PostgreSQL: localhost:5434
Redis:      localhost:6380
```

Run migrations:

```bash
bun run db:migrate
```

Optional development/demo data:

```bash
bun run db:seed
```

Reset the development database only when data loss is acceptable:

```bash
bun run db:reset
```

## 7. Environment configuration

The API expects values such as:

```text
NODE_ENV
PORT
CORS_ORIGIN
DATABASE_URL
REDIS_URL
JWT_SECRET
JWT_EXPIRES_IN
REFRESH_TOKEN_SECRET
REFRESH_TOKEN_EXPIRES_IN
```

Create a local environment file from the example and replace development secrets with local-only values.

Production requirements are stricter:

- Never use the example JWT secrets.
- Never use the default PostgreSQL password from `docker-compose.yml`.
- Never use the default Redis password from `docker-compose.yml`.
- Store production secrets in a dedicated secret manager or equivalent protected deployment configuration.
- Restrict CORS to the real application origins.
- Do not expose development services directly to the public internet.

The JWT implementation explicitly rejects known insecure fallback secrets when `NODE_ENV=production`, but this check is only one part of production secret management.

## 8. API surface

The backend currently contains modules for:

```text
/auth
/tenants
/branches
/tables
/orders
/kitchen-tickets
/menu/items
/menu/categories
/menu/availability
/menu/modifiers
/menu/bulk-ops
/menu/recipes
/menu/import-export
/menu/templates
/inventory
/billing
/staff
/analytics
/realtime
```

A health endpoint is available at:

```text
GET /health
```

The Elysia Swagger integration exposes API documentation during runtime at `/swagger`. Production deployments should decide explicitly whether this endpoint is public, protected, or disabled.

## 9. Frontend applications

### Main POS dashboard

The web application contains feature areas for:

- authentication
- branches
- menu
- inventory
- orders
- billing
- staff
- tables
- analytics
- settings

Development URL:

```text
http://localhost:5173
```

### Waiter application

The waiter app focuses on mobile/table-side workflows including authentication, menu access, orders, profile, and related shared functionality.

Development URL:

```text
http://localhost:5175
```

### Kitchen display

The kitchen application provides kitchen-ticket workflow and realtime operational views.

Development URL:

```text
http://localhost:5174
```

### Shared UI

`packages/ui` provides reusable components such as forms, tables, data grids, dialogs/modals, drawers, selections, navigation, layout primitives, theme support, and utility components.

## 10. Billing and payments

The current backend supports:

```text
POST /api/payments
POST /api/refunds
GET  /api/bills/:id
```

The current web billing workflow retrieves orders in `BILL_REQUESTED` state and allows a payment to be collected from a modal.

Supported UI payment methods currently include:

- Cash
- Card
- UPI
- Razorpay
- Stripe

### Important production limitation

The current web payment flow performs two separate API operations:

```text
1. Create payment
2. Update order status to PAID
```

These operations are not one atomic business transaction from the caller's perspective. A successful payment write followed by a failed status update can leave an inconsistent state.

**This must be fixed before production.** Payment creation and the corresponding order/bill state transition should be performed atomically on the server, or coordinated through an explicit idempotent payment-completion command.

Payment creation should also be idempotent so network retries cannot create duplicate successful payments.

## 11. Realtime architecture

Realtime functionality is implemented through WebSockets in the API and shared client utilities in `packages/realtime`.

Redis is used as the Pub/Sub/infrastructure layer so multiple API processes can coordinate realtime events.

A production deployment must verify:

- WebSocket upgrade handling through the reverse proxy.
- Connection authentication.
- Tenant/branch scoping of emitted events.
- Redis availability and failover behavior.
- Reconnect behavior on mobile/waiter/kitchen clients.
- Backpressure and connection limits.

## 12. Testing

The repository contains a substantial automated test suite using Vitest and Playwright. There are currently hundreds of test files across applications and shared packages.

The intended layers are:

```text
Unit / service tests     → Vitest
React component tests    → Vitest + Testing Library
Browser E2E tests        → Playwright
Accessibility tests      → Playwright + axe
```

Typical commands:

```bash
bun run test
bun run typecheck
bun run lint
bun run build
bun run test:e2e
bun run test:a11y
bun run test:coverage
```

### Production verification rule

Historical coverage documents were intentionally removed. No old coverage percentage in this repository should be treated as a current release gate.

A release candidate is only considered verified after the commands above have been executed successfully against the exact commit intended for deployment, with production-like PostgreSQL/Redis services available where integration tests require them.

## 13. Local development

Install dependencies:

```bash
bun install
```

Start infrastructure:

```bash
docker compose up -d postgres redis
```

Run all development applications:

```bash
bun run dev
```

Run checks:

```bash
bun run typecheck
bun run lint
bun run test
bun run build
```

## 14. Production deployment model

The repository includes an nginx configuration intended primarily for local/container development. A real production deployment should use a production-grade reverse proxy/load balancer with:

- TLS termination and certificate automation.
- HTTP security headers.
- Strict upstream timeouts.
- WebSocket support.
- Request-size limits.
- Rate limiting where appropriate.
- Access/error logging.
- Health checks.
- Secure handling of forwarded headers.

PostgreSQL and Redis should normally run as managed/high-availability services rather than using the development passwords and single-container configuration in `docker-compose.yml`.

## 15. Production readiness assessment

### Current verdict: **NO — not production-ready yet**

The architecture is good enough to continue toward production, but deployment should be blocked until the following are addressed.

### P0 blockers

1. **Atomic payment completion**
   - Payment creation and order `PAID` transition currently occur as separate API operations from the web client.
   - Replace this with a server-side atomic/idempotent payment-completion operation.

2. **Production deployment configuration**
   - The included Docker Compose credentials are development defaults.
   - The nginx configuration is not a complete production TLS configuration and points at `host.docker.internal` upstreams.
   - Production infrastructure must be configured independently.

3. **Full release verification**
   - The supplied repository archive cannot by itself prove that the current commit passes all tests/builds in a clean environment.
   - A clean CI run must prove install, typecheck, lint, unit tests, E2E tests, accessibility checks, migrations, and production builds.

4. **Payment idempotency and reconciliation**
   - Retries and duplicate requests need a deterministic idempotency strategy.
   - Payment state and order state need reconciliation/repair behavior for partial failures.

### P1 hardening

5. **Database tenant/branch integrity**
   - Strengthen composite relationships so invalid cross-tenant membership/branch combinations cannot be represented by the database.

6. **Authorization type safety**
   - Remove `any` from security-critical authentication/authorization code and strongly type repository relationship results.

7. **Operational security**
   - Add rate limiting for authentication and other abuse-sensitive endpoints.
   - Define production logging/monitoring/alerting.
   - Protect or disable Swagger in production.
   - Define backup, restore, and disaster-recovery procedures.

8. **Financial workflow completeness**
   - Verify invoice lifecycle, tax/GST behavior, partial payments, refunds, ledger semantics, payment reconciliation, and PDF/receipt requirements against the actual business requirements before launch.

9. **Realtime isolation**
   - Verify every realtime channel/event is tenant- and branch-safe under multiple concurrent users.

### P2 release quality

10. **UX/product completion**
    - Complete remaining billing/invoice workflows and edge cases.
    - Verify loading, error, empty, offline/retry, and mobile states.
    - Run the complete accessibility suite.

## 16. Recommended release gate

Do not label a build production-ready until all of these are true:

```text
[ ] Clean bun install succeeds
[ ] No competing dependency lockfile is used unintentionally
[ ] TypeScript checks pass
[ ] ESLint passes
[ ] All unit/component tests pass
[ ] Integration/database tests pass against PostgreSQL
[ ] RBAC migration and bootstrap checks pass on a fresh database
[ ] Migration upgrade path passes on a representative existing database
[ ] Playwright E2E suite passes
[ ] Accessibility suite passes
[ ] Production builds pass for API, web, waiter, and kitchen apps
[ ] Payment completion is atomic and idempotent
[ ] Refunds are atomic and idempotent
[ ] Tenant/branch isolation is tested with adversarial cross-tenant cases
[ ] Production secrets are externalized and rotated
[ ] TLS is enabled
[ ] CORS is restricted
[ ] Rate limiting is enabled
[ ] PostgreSQL backups and restore have been tested
[ ] Redis production topology and failure behavior are verified
[ ] Monitoring and alerting are configured
[ ] Swagger exposure is intentionally controlled
[ ] Financial/tax/invoice workflows are signed off
[ ] A staging deployment has passed a complete smoke test
```

## 17. Bottom line

This codebase is a **strong pre-production application**, not a finished production release.

The underlying architecture—especially the separation of authentication from tenant/branch context, the RBAC model, migration-based reference data, service/repository structure, shared packages, and multi-application layout—is a good foundation.

The correct next step is **not another broad rewrite**. The correct next step is a focused production-hardening cycle:

```text
Payment correctness
      ↓
Clean CI verification
      ↓
Database / tenant isolation audit
      ↓
Production infrastructure + secrets
      ↓
Financial workflow validation
      ↓
Staging deployment
      ↓
Production release
```

Until those gates are satisfied, the correct release status is **NO-GO for production**.
