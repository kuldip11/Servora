# Servora — Pre-v1 Senior Engineering Review & Consolidation Plan

**Review basis:** Servora v9 (`Servora-A-H-tests-fixed-v9`)

**Review date:** 2026-08-31

**Product state:** Pre-production, never released/deployed, zero live users, zero production data.

## 1. Purpose

This document records the whole-application senior engineering review and the work recommended before Servora's first production release.

The key premise is important:

> Servora has never been released. Therefore the repository does not need to preserve old production users, data, tokens, APIs, schema versions, or deployed clients.

The codebase should now be consolidated into the clean v1 architecture that would have been chosen if the final requirements had been known from the beginning. Compatibility and rollout mechanisms that exist only because the application evolved during development should be removed before they become real long-term obligations.

This is **not** a recommendation to rewrite Servora. The domain model and several core engines are strong. The correct strategy is to preserve the good domain architecture while removing implementation-history residue and simplifying boundaries.

---

# 2. Executive assessment

| Area                      | Rating | Assessment                                                                      |
| ------------------------- | -----: | ------------------------------------------------------------------------------- |
| Domain design             |   8/10 | Strong restaurant/POS domain coverage and rules.                                |
| Database integrity        |   7/10 | Good constraints, but development-history migration complexity remains.         |
| API architecture          | 6.5/10 | Good layering, but old/new patterns coexist.                                    |
| Security                  | 6.5/10 | Solid RBAC foundation; auth/client and ingress hardening remain.                |
| Frontend architecture     |   6/10 | Functional, but several oversized components and weak typing remain.            |
| Pricing/order correctness |   8/10 | One of the strongest subsystems.                                                |
| Inventory                 | 7.5/10 | Strong recipe/deduction/reversal concepts; service is oversized.                |
| Testing                   |   7/10 | Broad suite, but too much implementation-coupled mocking and weak vertical E2E. |
| Performance/scalability   |   6/10 | Some clear N+1/repeated-resolution paths.                                       |
| Maintainability           | 5.5/10 | Development/rework history still leaks into current architecture.               |
| Release readiness         |  ~6/10 | Technically close, but consolidation should precede first release.              |

## Primary conclusion

Do **not** start another major feature roadmap before the pre-v1 consolidation work.

Servora has reached the point where adding more features on top of current transitional architecture would increase long-term cost. The next phase should turn the repository from:

> “the accumulated result of many implementation phases”

into:

> “the clean v1 system we intend to operate.”

---

# 3. What should be preserved

The application has important architectural strengths that should not be discarded.

## 3.1 Tenant / organization / branch model

The tenancy model is designed as a first-class domain rather than being retrofitted. This is a major strength for a restaurant SaaS.

Preserve:

- users independent of a single tenant;
- tenant memberships;
- branch-scoped access;
- organization/franchise concepts;
- global, tenant, and branch role scopes;
- database-backed request context rather than trusting stale tenant/branch token claims.

## 3.2 Server-authoritative RBAC

Authorization decisions are enforced by the API rather than relying on frontend visibility. Preserve that model.

## 3.3 Pricing pipeline

The staged pricing architecture is directionally correct. Base price, variant/modifier price, combo behavior, promotions, loyalty, tax, service charge, and rounding should continue to be orchestrated centrally rather than duplicated per client.

## 3.4 Immutable order pricing evidence

Historical order lines must not silently change because the menu price changes later. The snapshot/evidence model should remain.

## 3.5 Inventory deductions and exact reversals

Persisting exact deductions against real order items is the correct foundation for void/refire/reversal integrity.

## 3.6 Kitchen course lifecycle

`PENDING_PAYMENT`, `HELD`, `FIRED`, `PREPARING`, `READY`, `SERVED` is a proper restaurant-domain state model and should remain domain authoritative.

## 3.7 Shared monorepo packages

The package direction is correct:

- shared types;
- shared validation;
- shared UI;
- shared realtime;
- shared client configuration.

The next step is to make the shared API contract more strongly typed, not to abandon the shared-package model.

## 3.8 Strict TypeScript configuration

Strict compiler options are a net positive. Fix the remaining weakly typed application code instead of weakening compiler rules.

---

# 4. Pre-release rework / legacy residue inventory

This section specifically identifies code that sounds or behaves like rework and classifies whether it is legitimate product behavior or development-history residue.

## 4.1 Summary table

| ID   | Current artifact / behavior                                                            | Classification                                     | Recommendation                                                                                                               |
| ---- | -------------------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| R-01 | `0020_missing_indexes.sql`                                                             | Obsolete compatibility residue                     | Delete when migration baseline is rebuilt. It is explicitly a no-op compatibility migration.                                 |
| R-02 | 87 migrations `0000`–`0086`                                                            | Development-history residue                        | Squash/rebuild as clean v1 baseline before first release.                                                                    |
| R-03 | `*_phase_e_*`, `*_phase_f_*`, `*_phase_g_*`, `*_phase_h_*` migration names             | Development-roadmap leakage                        | Replace with domain/table-oriented baseline migrations.                                                                      |
| R-04 | `verify-phase-g.mjs`, `verify-phase-h.mjs`, A–H source-string checks                   | Development-phase verification residue             | Keep only as temporary architecture guards or replace with domain-oriented checks. Do not treat as functional certification. |
| R-05 | `menuItems.isAvailable` backward-compat field                                          | Unnecessary client compatibility                   | Move clients to the final availability model and remove derived legacy column/API use.                                       |
| R-06 | modifier `isAvailable` effective legacy field                                          | Unnecessary client compatibility                   | Expose explicit computed/manual/effective availability model without legacy field semantics.                                 |
| R-07 | `availabilityService.getItemsAvailableAt()` retained for behavior parity but not wired | Dead migration/parity residue                      | Delete if still unreachable after final API review.                                                                          |
| R-08 | typed `AppError` plus legacy catch-all / string-error handling                         | Half-completed migration                           | Finish conversion and delete legacy error path.                                                                              |
| R-09 | authorization modules/comments described as additive “during migration”                | Transitional architecture                          | Consolidate into final core auth/authorization architecture.                                                                 |
| R-10 | compatibility tenant/context wording for old clients/tokens                            | Pre-release residue                                | Model “no tenant/branch selected” explicitly; remove compatibility terminology/paths.                                        |
| R-11 | `/phase-h` product route and `DifferentiatorsPage`                                     | Roadmap terminology leaked into product            | Remove route or redistribute features to their real product areas.                                                           |
| R-12 | seven production `/dev/*` preview routes                                               | Development scaffolding in production router       | Register only in development or move to Storybook/dev app.                                                                   |
| R-13 | customer `?demo=true` fixture ordering path                                            | Development/demo scaffolding                       | Remove from production build; create separate demo build/app if needed.                                                      |
| R-14 | “legacy evidence” fallback text in Order Explain                                       | Historical fallback for data that cannot exist yet | Make current evidence mandatory where applicable and remove impossible legacy branches.                                      |
| R-15 | UI compatibility aliases / old-new component pairs                                     | Internal transition residue                        | Standardize before v1 where practical.                                                                                       |
| R-16 | source comments referencing past phase/design/NEXT_STEPS docs                          | Documentation-history residue                      | Remove or rewrite self-contained during consolidation.                                                                       |

---

# 5. `order-repricing.ts`: keep the behavior, improve the name

A file name such as `order-repricing.ts` reasonably looks like “rework” or “recalculate old prices.” The current behavior, however, is legitimate restaurant-domain behavior and should not simply be deleted.

## Why active-order repricing is required

Example:

1. A burger is added to an order at ₹100.
2. The menu price later changes to ₹120.
3. The same open order gets another item.
4. The existing burger must stay at its captured ₹100 stage-1–4 value.
5. But an order-level promotion, loyalty discount, tax result, service charge, or rounding result may need to be recalculated because the composition/order total changed.

The correct behavior is:

- preserve existing item-level authoritative snapshots;
- recompute only order-dependent pricing stages.

That is not migration compatibility; it is active-order correctness.

## Recommendation

Keep the logic but rename the file/function boundary to make intent obvious. Examples:

```text
active-order-pricing.ts
order-pricing-finalization.ts
order-total-recalculation.ts
```

A name such as `finalizeWholeActiveOrder()` already communicates the intent better than `order-repricing.ts`.

---

# 6. Historical replay / Order Explain: product feature vs legacy residue

Historical explainability is useful and should stay.

A restaurant should be able to answer:

> Why did this order line cost this amount at the time it was placed/fired?

Useful evidence includes:

- winning price source;
- category/variant/modifier snapshot;
- promotion/loyalty attribution;
- tax/service/rounding inputs;
- availability decision evidence;
- station/menu version evidence.

This supports disputes, accounting, support, auditing, and manager troubleshooting.

## What to keep

- immutable snapshots/evidence;
- deterministic replay/checking against the same authoritative engines;
- traceable price source attribution.

## What to remove before v1

The UI/service still contains concepts such as:

```text
Legacy evidence gap
Legacy snapshot
Incomplete legacy attribution
Legacy evidence unavailable
```

There are no legacy production orders. New orders can be required to have the expected evidence from day one.

Remove fallback branches that only exist to tolerate historical orders created by versions that have never been deployed.

---

# 7. Database and migration architecture

## Severity: High

The current repository contains **87 SQL migrations from `0000` through `0086`**.

That is reasonable for a live product that must migrate existing databases safely. Servora has no deployed database to preserve.

The current chain still describes how the system evolved:

```text
0020_missing_indexes.sql
...
phase_e_...
phase_f_...
phase_g_...
phase_h_...
completion
hardening
replay evidence
```

The development database is therefore replaying historical implementation decisions rather than creating the final v1 schema directly.

## Concrete evidence

`0020_missing_indexes.sql` explicitly says:

```text
No-op compatibility migration.
```

That compatibility requirement does not exist for a never-released database.

The Drizzle migration metadata is also incomplete:

- SQL migrations: **87** (`0000` through `0086`);
- `_journal.json` entries: **87**;
- Drizzle snapshots: **21** (`0000_snapshot.json` through `0020_snapshot.json`);
- migrations `0021` through `0086` therefore have no matching snapshot metadata.

Runtime `db:migrate` can still execute the journaled SQL chain, but Drizzle Kit no longer has a complete schema-history baseline for future generation. A later `drizzle-kit generate` can therefore compare against stale metadata and produce duplicate, misleading, or otherwise incorrect schema diffs.

Do **not** solve this by manually fabricating 66 historical snapshots. Because Servora has never been released, the correct repair is to rebuild the canonical pre-v1 migration baseline and generate a clean, synchronized metadata history from that final schema.

## Mandatory migration metadata rule

After the canonical pre-v1 baseline is created, every migration change must be treated as one atomic migration unit containing:

1. the SQL migration file;
2. the corresponding `_journal.json` entry;
3. the matching `NNNN_snapshot.json`;
4. the Drizzle schema change that produced/describes the migration;
5. tests/verifiers for any important constraint or domain invariant introduced by the migration.

A migration PR/change is incomplete if any of these representations are out of sync. Do not hand-edit a SQL migration while leaving Drizzle metadata stale, and do not add journal entries without matching snapshots.

For generated migrations, prefer the normal Drizzle generation workflow so the journal and snapshot are produced together. If a migration must contain handwritten PostgreSQL that Drizzle cannot represent, the snapshot must still describe the resulting schema state and the change must be verified from an empty database.

### Migration acceptance checklist

For every new migration after the baseline:

```text
[ ] Drizzle schema updated first (where representable)
[ ] Migration SQL generated/reviewed
[ ] _journal.json contains exactly one matching ordered entry
[ ] Matching NNNN_snapshot.json exists
[ ] Snapshot represents the post-migration schema
[ ] No numbering gaps or duplicate journal tags
[ ] bun run db:reset && bun run db:migrate succeeds from empty PostgreSQL
[ ] bun run verify:migrations succeeds
[ ] typecheck / lint / tests / build remain green
```

This rule should be enforced before the first production release so Servora never begins production with an incomplete migration-history model.

## Recommendation: create a canonical v1 baseline

Before first production deployment, rebuild migrations around the final domain model. A representative shape:

```text
0000_enums.sql
0001_tenants.sql
0002_organizations.sql
0003_users.sql
0004_user_sessions.sql
0005_roles.sql
0006_permissions.sql
0007_memberships.sql
0008_branches.sql
0009_staff.sql
0010_restaurant_tables.sql
0011_menu_categories.sql
0012_menu_items.sql
0013_menu_variants.sql
0014_modifier_groups.sql
0015_modifier_options.sql
0016_menus.sql
0017_menu_memberships.sql
0018_price_rules.sql
0019_promotions.sql
0020_loyalty.sql
0021_inventory_items.sql
0022_recipes.sql
0023_sub_recipes.sql
0024_orders.sql
0025_order_items.sql
0026_kitchen_tickets.sql
0027_bills.sql
0028_payments.sql
...
```

The exact number is less important than the principle:

- one final schema;
- direct final FKs/checks/unique indexes;
- no no-op compatibility steps;
- no phase names;
- no historical “completion” migrations;
- no backfill/activation machinery for data that never existed.

## Schema source of truth

Some invariants are represented primarily in handwritten SQL rather than clearly in Drizzle schema definitions.

Pre-v1 target:

1. Drizzle schema describes every representable structural invariant.
2. Baseline SQL reflects that canonical model.
3. `db:push` should either be intentionally unsupported and impossible to misuse, or the schema must be sufficient to reproduce the database.
4. There should not be two subtly different definitions of the database.

---

# 8. API error architecture is halfway through a migration

## Severity: High maintainability / Medium correctness

`AppError` explicitly documents compatibility with legacy `throw new Error(...)` behavior, and the global error handler still has a typed path plus legacy fallback.

That is a transitional architecture.

## Target

Business/domain errors should use explicit types:

```text
ValidationError
UnauthorizedError
ForbiddenError
NotFoundError
ConflictError
DomainRuleError
InternalError
```

Plain `Error` remains valid for true programming/configuration failures, but business string codes should not be interpreted by a second legacy error system.

## Action

- inventory remaining domain `throw new Error(...)` call sites;
- migrate them to typed errors;
- remove legacy response mapping;
- make one error contract authoritative across API modules.

---

# 9. Authorization architecture is still described as transitional

## Severity: Medium/High

The application has a strong request-scoped authorization model, but parts of `lib/authorization` still describe themselves as additive migration infrastructure and contain weak typing.

## Target structure

```text
core/auth/
  authentication.ts
  authorization.ts
  auth-context.ts
  permissions.ts
  membership-context.ts
```

or an equivalent single authoritative boundary.

Remove wording/branches that only exist because authorization was gradually migrated during development.

---

# 10. Critical API-client refresh bug

## Severity: Critical before production

Normal API requests are created with a configured Axios `baseURL`.

The refresh call uses the global Axios instance:

```ts
axios.post("/api/auth/refresh", { refreshToken });
```

The source comment explicitly says this behavior was preserved from earlier implementations.

## Why this is dangerous

If production topology is:

```text
web.servora.example
api.servora.example
```

normal requests can correctly go to the API base URL, while refresh can resolve against the frontend origin instead.

Result: authentication works until access-token expiry, then refresh fails in production.

## Fix

Use a refresh client configured with the same API base URL but without the normal access-token interceptor, preventing recursive refresh.

Add a test that configures an absolute API base URL and asserts refresh goes to that origin.

---

# 11. Development-only UI is registered in the production application

## Severity: High before public release

The POS router includes seven unauthenticated `/dev/*` preview routes:

```text
/dev/theme-preview
/dev/layout-preview
/dev/form-preview
/dev/selection-preview
/dev/overlay-preview
/dev/navigation-preview
/dev/data-preview
```

These routes are useful while developing the shared design system, but they should not be production product routes.

## Recommendation

Use one of:

```ts
if (import.meta.env.DEV) {
  // register preview routes
}
```

or move the preview environment to Storybook / a dedicated internal dev app.

This also affects dead-code analysis: components used only by preview routes appear production-reachable even if no real product screen uses them.

---

# 12. Customer application ships a full fixture/demo path

## Severity: High before release

`CustomerApp.tsx` imports development fixtures and checks:

```text
?demo=true
```

The real production application can then create fixture sessions, fixture menu data, fixture tickets, fixture order IDs, and fixture restaurant state.

## Recommendation

Remove this code from the production customer application.

If a demo is strategically useful, implement a separate build/app:

```text
apps/customer-demo
```

or a compile-time demo build that is not part of the production bundle.

---

# 13. Roadmap terminology is leaking into the product

## Severity: Medium

The POS has a production route:

```text
/phase-h
```

and a `DifferentiatorsPage` built around roadmap grouping.

Roadmap phases are development/project-management concepts, not product information architecture.

## Recommendation

Move features to their natural product locations:

- availability → Menu/Operations;
- menu engineering → Analytics;
- combo/promotion tools → Menu/Pricing;
- loyalty → Customers/Loyalty;
- approval thresholds → Settings/Security.

Delete the `/phase-h` route and phase-oriented labels once these features have permanent homes.

Also remove user-facing text such as “Phase G modes”.

---

# 14. Backward-compatible availability fields remain

## Severity: Medium

The menu schema explicitly describes `isAvailable` as retained for backward compatibility with waiter/client behavior. Modifier availability follows a similar derived/effective pattern.

There are no deployed old clients.

## Recommendation

Define one final availability contract now:

```text
base status
computed ingredient status
manual override
branch override
channel/fulfillment override
schedule/holiday result
manual stock count
=> authoritative effective availability + structured cause
```

Update all clients to consume this final API and remove schema/API fields whose only reason to exist is an old client contract.

Do not remove fields that are genuinely part of the intended manager-facing API; remove only the redundant compatibility representation.

---

# 15. Unwired behavior-parity availability method

## Severity: Low/Medium

`availabilityService.getItemsAvailableAt()` is explicitly documented as not wired to an endpoint and retained for behavior parity.

In a pre-release consolidation, “behavior parity” with unused code is not sufficient reason to keep it.

Delete it if the final reachability/test review confirms no authoritative workflow needs it.

---

# 16. Production import cycles

## Severity: Medium

The review found three production dependency cycles.

## 16.1 Pricing cycle

The pricing pipeline and individual stages share types/imports in a way that forms a cycle around promotion/loyalty/final-total stages.

Even if some edges are type-only, money-critical initialization should be directional and obvious.

### Target

Extract contracts to a neutral module:

```text
pricing.types.ts
pricing-context.ts
```

Then:

```text
types/context
    ↓
stage modules
    ↓
pipeline orchestrator
```

No stage should import the orchestrator just to obtain types.

## 16.2 Tables UI cycle

`TablesPage` and `TableFormModal` share a page-owned type.

Move `TableFormValues` to a form schema/types module.

## 16.3 Shared menu/inventory type cycle

Move shared primitives/types to a neutral module and use `import type` where the relationship is type-only.

---

# 17. Oversized modules

## Severity: High maintainability

Current large production files include approximately:

```text
order.service.ts                  1,694 lines
CustomerApp.tsx                   1,073
customer.service.ts               1,020
availability.service.ts             944
inventory.service.ts                824
order.repository.ts                 783
pricing-pipeline.ts                 683
TablesPage.tsx                      634
waiter MenuPage.tsx                 611
InventoryPage.tsx                   610
OrderDetailPage.tsx                 557
ItemFormModal.tsx                   542
DashboardPage.tsx                   520
DifferentiatorsPage.tsx             502
```

## Highest-priority split: orders

`order.service.ts` currently covers too many commands and cross-domain effects.

Target shape:

```text
orders/
  create-order.service.ts
  add-order-items.service.ts
  fire-course.service.ts
  refire-item.service.ts
  void-item.service.ts
  comp-item.service.ts
  cancel-order.service.ts
  transfer-order.service.ts
  merge-order.service.ts
  active-order-pricing.ts
  order.policy.ts
  order.events.ts
  order.repository.ts
```

The goal is not arbitrary file-size reduction. Each service should represent one coherent transaction/use case.

## Customer app

Split orchestration/state from rendering:

```text
useCustomerSession()
useCustomerMenu()
useCustomerCart()
useCustomerCheckout()
useCustomerOrderTracking()

MenuScreen
CartScreen
OrderScreen
```

---

# 18. Type safety is inconsistent with the compiler standard

## Severity: Medium/High

The repo has a strong strict TypeScript configuration, but the current production tree still contains roughly **163 lines involving explicit `any`**.

The highest concentrations include realtime/auth/authorization and waiter menu code.

## Recommendation

Do not weaken TypeScript.

Instead:

- type API responses centrally;
- eliminate `Promise<any[]>` client methods;
- type menu/category/table/customer results from shared DTOs;
- replace `any` in realtime event payloads with discriminated unions;
- type repository raw/transaction boundaries explicitly.

---

# 19. `@pos/api-client` is not yet a domain API client

## Severity: Medium

It currently provides shared Axios behavior, but applications still make many raw `.get/.post/...` calls and locally infer response shapes.

## Target

Build typed domain clients such as:

```text
ordersApi.create(...)
ordersApi.get(...)
menuApi.listItems(...)
inventoryApi.list(...)
customersApi.search(...)
```

Request/response DTOs should derive from the same shared validation/type definitions used by the API.

This reduces frontend/API drift and removes much of the application-level `any` usage.

---

# 20. Availability Dashboard has an N+1 / repeated-resolution pattern

## Severity: High at scale

The dashboard conceptually evaluates multiple combinations of:

```text
branch × item × channel × fulfillment type × variant
```

and repeatedly calls authoritative resolution functions that can perform repository work.

A modest example:

```text
10 branches × 500 items × 2 channels × 4 fulfillment modes
= 40,000 item contexts before variants/modifiers
```

## Recommendation

Load the full resolution dataset in batches:

- items;
- schedules/holidays;
- branch overrides;
- channel overrides;
- manual state;
- variants/modifiers;
- recipe-driven computed state.

Then execute a pure resolver in memory for the matrix.

This also makes the resolver much easier to unit test.

---

# 21. Analytics cost/margin has repeated work

## Severity: Medium/High at scale

Cost/margin reporting loops over items/variants and repeatedly resolves recipe cost and pricing.

Batch the graph/state required for the report once per branch/window:

- recipes and subrecipes;
- inventory costs;
- variants;
- price rules;
- branch context.

Then compute in memory where possible.

---

# 22. Test architecture: broad but too implementation-coupled

## Current approximate test-file distribution

```text
API                 188
UI package           62
Web                  59
Waiter               28
Kitchen Display      17
Validation           10
Customer              4
Website                4
API client             2
Realtime               2
```

The API has strong breadth. The customer app is under-tested relative to its size and revenue importance.

## Repeated failure pattern observed during verification

Several failures came from:

- missing newly imported functions in full-module mocks;
- Vitest hoisting/TDZ mocks;
- stale schema column arrays;
- queued mock values leaking across tests;
- tests depending on internal call order rather than observable behavior.

These are signs of excessive mock coupling.

## Recommendation

Increase:

- pure domain-engine tests;
- repository integration tests against a real disposable Postgres;
- vertical service tests with fewer mocks;
- browser-level critical flow tests.

Reduce tests whose main value is reproducing implementation internals.

---

# 23. POS E2E configuration exists but real web E2E directory is absent

## Severity: High release-confidence gap

`apps/web/playwright.config.ts` points at:

```text
./tests
```

but the current v9 tree does not contain `apps/web/tests`.

The configured web server even uses a `/dev/form-preview` URL as readiness target.

## Minimum pre-release E2E flows

Automate critical vertical paths such as:

1. login;
2. select tenant/branch;
3. create order;
4. customize item;
5. fire to kitchen;
6. KDS receives ticket;
7. KDS marks ready;
8. waiter observes update;
9. bill/payment transition;
10. void/comp approval threshold;
11. inventory deduction/reversal.

A small number of real vertical flows provides more release confidence than many source-string presence checks.

---

# 24. Static phase verifiers are not functional certification

## Severity: Medium process risk

Scripts such as phase/A–H verifiers are useful for enforcing architecture conventions, but source-text checks prove only that certain code constructs exist.

They do not prove behavior.

During development, source verifiers could be green while TypeScript or tests still found genuine defects.

## Recommendation

Rename/reframe them as architecture guards.

Release certification must be based on:

```text
migration from empty database
schema integrity
lint
typecheck
unit/integration tests
coverage thresholds
browser E2E
security/RBAC tests
production build
production smoke test
```

---

# 25. Settings exposes non-functional notification controls

## Severity: High product-quality issue

The Settings page renders notification toggles for:

```text
New orders
Low stock alerts
Kitchen ready alerts
Payment confirmations
```

but these values are currently static UI data rather than persisted configuration.

Before release either:

- implement the settings end-to-end, or
- remove the card.

Do not ship controls that visually promise persistence/behavior but do nothing.

---

# 26. Website legal pages are explicit launch placeholders

## Severity: Release blocker

Privacy, Terms, and Cookie pages explicitly state that they are launch placeholders requiring approved legal content.

They must be replaced before a public production launch.

---

# 27. Redis configuration contract is contradictory

## Severity: Medium

API environment validation currently treats `REDIS_URL` as optional, while `lib/redis.ts` throws during import when it is absent.

Choose one contract.

Given the current realtime/rate-limit/webhook architecture, the cleanest v1 contract is likely to make Redis required for the API and reflect that in validation, deployment, and health checks.

If optional Redis is genuinely desired, every Redis-dependent feature must degrade intentionally rather than import-crash.

---

# 28. Rate limiting / proxy trust needs production definition

## Severity: High security at deployment

If IP-based controls accept `X-Forwarded-For` / `X-Real-IP`, production must define which reverse proxy is trusted to overwrite those values.

Otherwise a direct client can potentially spoof forwarding headers.

## Recommendation

- make the API reachable only through the trusted ingress/proxy; and/or
- use a framework/runtime trusted-proxy configuration;
- document and test the exact production topology.

---

# 29. Refresh-token storage should be hardened

## Severity: Medium/High security

Browser applications store refresh credentials in browser-accessible storage. An XSS vulnerability can therefore exfiltrate a long-lived refresh token.

Preferred production model:

```text
refresh token → Secure + HttpOnly + SameSite cookie
access token  → memory / short lifetime
```

The current server-side session/refresh-token infrastructure already provides much of the foundation needed for this change.

---

# 30. Frontend security headers are inconsistent

## Severity: Medium

The SPA Nginx configurations do not appear to use one unified security-header policy. Frame policy/referrer policy differ, and there is no single obvious CSP strategy.

Create one shared hardened SPA ingress template where possible, with deliberate differences documented only where an app genuinely requires them.

---

# 31. Documentation/history problem

Before this cleanup the repository contained around 50 Markdown documents covering phases, completion reports, verification reports, and website planning.

That documentation described development history rather than one current system, and the root README itself contained stale facts (for example, it said migrations ended at `0020` while v9 contains 87 migrations through `0086`).

The active repository documentation policy is now:

```text
README.md
PRE_V1_ENGINEERING_REVIEW.md
```

Historical implementation notes are not authoritative product architecture and should not be reintroduced into the active root/docs tree.

Source comments that reference old/nonexistent design-system/NEXT_STEPS documents should be made self-contained during the consolidation pass.

---

# 32. Recommended target architecture

## 32.1 Database

- one clean v1 baseline migration set;
- direct final constraints/FKs/indexes;
- no compatibility/no-op/backfill/activation history;
- Drizzle structural schema aligned with the real database;
- seed/reference data separated from business data.

## 32.2 API

```text
route
  ↓
controller/handler
  ↓
command/query service
  ↓
domain policy / pure engine
  ↓
repository
```

Keep transactions at the use-case boundary.

Avoid one service importing many unrelated repositories/services and managing every lifecycle action.

## 32.3 Pricing

```text
pricing.types/context
    ↓
independent pure stages
    ↓
pipeline orchestrator
```

No import cycle between stage implementations and the pipeline.

## 32.4 Orders

Use command-oriented services for meaningful transactions rather than a 1,600+ line god service.

## 32.5 Frontends

Pages/screens should orchestrate feature hooks/components rather than owning API calls, persistence, domain calculations, and rendering in one file.

## 32.6 API contracts

```text
shared validation/schema
      ↓
request/response DTO
      ↓
API route
      ↓
typed domain client
      ↓
web / waiter / KDS / customer
```

---

# 33. Priority plan

## P0 — correctness and launch blockers

Complete before anything can be considered release-ready.

- [ ] Fix API refresh request to honor configured API base URL.
- [ ] Achieve a complete clean local/CI run of `typecheck`, `lint`, `test`, and `build`.
- [ ] Add real POS critical-path Playwright E2E tests.
- [ ] Replace website Privacy/Terms/Cookies placeholders with approved content.
- [ ] Implement or remove fake notification settings.
- [ ] Define Redis as truly required or truly optional—no contradictory contract.

## P1 — remove pre-release history

Do this before adding another major roadmap feature.

- [ ] Rebuild/squash 87 development-history migrations into the canonical v1 baseline.
- [ ] Regenerate synchronized Drizzle migration metadata for that baseline: SQL + `_journal.json` + one matching snapshot per migration.
- [ ] Eliminate the current metadata gap where migrations `0021`–`0086` have no snapshots.
- [ ] Add a migration verification guard that fails when SQL/journal/snapshot numbering diverges.
- [ ] Delete no-op compatibility migration(s).
- [ ] Remove backward-compatible availability fields/contracts that only support old clients.
- [ ] Delete unwired behavior-parity methods.
- [ ] Finish typed error migration and remove legacy error handler behavior.
- [ ] Consolidate authorization migration-era modules/comments.
- [ ] Remove production `/dev/*` preview routes.
- [ ] Remove customer fixture/demo mode from production build.
- [ ] Remove `/phase-h` and phase-oriented product wording.
- [ ] Remove impossible “legacy order evidence” fallbacks.
- [ ] Clean source comments that reference obsolete/nonexistent historical docs.
- [ ] Rename `order-repricing.ts` to reflect legitimate active-order total finalization.

## P2 — architecture and maintainability

- [ ] Break production import cycles.
- [ ] Split `order.service.ts` by use case.
- [ ] Split `customer.service.ts` and `CustomerApp.tsx`.
- [ ] Decompose availability and inventory services around pure engines/batched data sources.
- [ ] Remove production `any` usage systematically.
- [ ] Build typed domain API clients.
- [ ] Move shared form/domain types out of page components.
- [ ] Remove unused UI primitives after `/dev` previews are no longer considered product reachability.

## P3 — scale/security/operations

- [ ] Batch Availability Dashboard data and run pure in-memory resolution.
- [ ] Batch analytics recipe-cost/pricing inputs.
- [ ] Move refresh tokens to HttpOnly secure cookies if deployment architecture permits.
- [ ] Define trusted proxy/IP behavior.
- [ ] Unify CSP/security headers.
- [ ] Define production ingress/topology, health checks, backup/restore, and smoke testing.
- [ ] Add observable metrics for API latency, DB query latency, websocket connections, Redis availability, payment webhook failures, and order-processing errors.

---

# 34. Release gate

Servora should not be called production-ready until all of the following are demonstrably green in the actual locked development/CI environment.

## Build/static quality

```bash
bun install --frozen-lockfile
bun run lint
bun run typecheck
bun run build
```

## Automated behavior

```bash
bun run test
bun run test:coverage
bun run test:e2e
bun run test:a11y
bun run audit:rbac
```

## Database

- reset an empty Postgres database;
- migrate from zero using the final v1 baseline;
- validate constraints/indexes/reference roles;
- seed development data independently;
- test backup/restore against the production database version.

## Runtime smoke

- API starts with production-like environment;
- all apps serve production builds;
- login + refresh works across the real frontend/API origins;
- Redis/realtime health is visible;
- payment webhook retry worker is healthy;
- one complete order→kitchen→bill→payment→inventory flow succeeds.

## Product/legal

- legal pages approved;
- real notification settings or no fake settings UI;
- no production demo fixtures;
- no unauthenticated internal preview routes;
- no roadmap-phase terminology exposed as product navigation.

---

# 35. Decision for the next engineering phase

The recommended next engineering phase is **Pre-v1 Consolidation**, not a new feature phase.

The objective is:

> Preserve Servora's strong restaurant-domain behavior while deleting the historical scaffolding that is unnecessary because the product has never been released.

Success means a developer can open the repository and understand the intended v1 system without learning the sequence of Phase A–H, earlier compatibility migrations, temporary demo modes, or partially migrated architectural patterns.

Only after that consolidation should major feature development resume.

---

# 36. Review evidence snapshot

At the time of this review, the v9 tree included:

- 6 applications;
- 6 shared packages;
- 87 SQL migrations (`0000`–`0086`);
- approximately 376+ test files across apps/packages;
- `order.service.ts` at ~1,694 lines;
- `CustomerApp.tsx` at ~1,073 lines;
- `customer.service.ts` at ~1,020 lines;
- `availability.service.ts` at ~944 lines;
- `inventory.service.ts` at ~824 lines;
- roughly 163 production source lines containing explicit `any`;
- production `/dev/*` preview routes;
- a production-compiled customer fixture/demo mode;
- a no-op compatibility migration;
- backward-compat availability fields;
- a typed+legacy dual error architecture;
- missing real `apps/web/tests` despite a Playwright config targeting that directory;
- legal launch placeholders;
- inconsistent Redis optional/required contracts;
- a refresh call bypassing the configured API client base URL.

These numbers are an evidence snapshot, not permanent architectural requirements. As consolidation removes transitional code, they should decrease.
