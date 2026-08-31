# Servora — Pre-v1 Consolidation Implementation Status

**Source of truth:** `PRE_V1_ENGINEERING_REVIEW.md`  
**Started:** 2026-08-31  
**Product state:** Pre-production, zero live users/data.

## Status legend

- `[ ]` Not started
- `[-]` In progress
- `[x]` Implemented and verified
- `[!]` Blocked / requires non-engineering input

## P0 — Correctness and launch blockers

- [-] Fix API refresh request to honor configured API base URL. **Implemented; runtime verification pending (Bun unavailable in sandbox).**
- [ ] Achieve a complete clean local/CI run of `typecheck`, `lint`, `test`, and `build`.
- [-] Add real POS critical-path Playwright E2E tests. **Added `apps/web/tests/critical-order-flow.spec.ts` covering login → business context → Orders → dine-in order creation and API payload; execution pending because Bun/Playwright dependencies are unavailable in this sandbox.**
- [!] Replace website Privacy/Terms/Cookies placeholders with approved content. **Blocked:** approved legal text must be supplied/reviewed by the product/legal owner; engineering should not invent it.
- [-] Implement or remove fake notification settings. **Removed non-functional notification controls; verification pending.**
- [-] Define Redis as truly required or truly optional—no contradictory contract. **Redis is now required by API env validation; webhook worker no longer silently disables; verification pending.**

## P1 — Remove pre-release history

- [x] Rebuild/squash development-history migrations into the canonical v1 baseline. **Replaced the 87-file development history with `0000_enums.sql` plus 77 dependency-ordered one-table migrations.**
- [x] Regenerate synchronized Drizzle migration metadata for the baseline. **Generated 78 matching v7 PostgreSQL snapshots plus a synchronized `_journal.json`.**
- [x] Eliminate the migration snapshot metadata gap. **SQL, journal, and snapshots now run continuously from `0000` through `0077`.**
- [x] Add/verify migration SQL-journal-snapshot consistency guard. **`node scripts/release/verify-migrations.mjs` passes and validates numbering, tags, snapshot chaining, dependency order, canonical-baseline restrictions, and SQL-only invariants.**
- [x] Delete no-op compatibility migrations. **Compatibility/backfill/completion/history migrations were eliminated by the canonical baseline rebuild.**
- [x] Remove availability compatibility-only fields/contracts. **Removed persisted compatibility availability booleans; API `isAvailable` convenience values are derived from the authoritative status/computed/manual model.**
- [x] Delete unwired behavior-parity methods. **Removed `getItemsAvailableAt()` and its repository-only list helper; stale-reference and syntax sweeps are clean.**
- [x] Finish typed error migration; remove legacy error response behavior. **Expected authorization/domain failures use typed application errors; message-parsing/string-code control flow is absent from production paths and stale tests were updated.**
- [x] Consolidate authorization migration-era modules/comments. **Authorization lives under `core/auth`; transitional `lib/authorization` references and migration-era comments are gone.**
- [x] Remove production `/dev/*` preview routes. **Removed the preview routes and `apps/web/src/dev` pages entirely; Playwright readiness uses `/login`.**
- [x] Remove customer fixture/demo mode from production build. **Removed `?demo=true`, fixture session/order branches, demo storage scope, and realtime fixture exceptions; stale-reference sweep is clean.**
- [x] Remove `/phase-h` and phase-oriented product wording. **Removed the route and user-facing roadmap labels; remaining phase mentions are internal/self-contained implementation comments only.**
- [x] Remove impossible legacy-order-evidence fallbacks. **Order Explain now requires replay evidence for real menu-item lines; missing evidence is corrupt state and the DB schema enforces the invariant.**
- [x] Clean obsolete historical-doc comments. **Production source no longer references deleted `docs/design-system`, `NEXT_STEPS`, or other nonexistent historical documents; the active Markdown tree is limited to README + review + status.**
- [x] Rename `order-repricing.ts` around active-order pricing/finalization intent. **Renamed to `active-order-pricing.ts`; stale-reference sweep is clean and TypeScript syntax parsing passes.**

## P2 — Architecture and maintainability

- [x] Break production import cycles. **Extracted neutral pricing contracts and table-form types; SCC scan reports 0 production cycles in both `apps/api/src` and `apps/web/src`.**
- [ ] Split `order.service.ts` by use case.
- [ ] Split `customer.service.ts` and `CustomerApp.tsx`.
- [ ] Decompose availability/inventory around pure engines and batched data sources.
- [ ] Remove production explicit `any` systematically.
- [ ] Build typed domain API clients.
- [ ] Move shared form/domain types out of page components.
- [ ] Remove unused UI primitives after dev previews are no longer product-reachable.

## P3 — Scale, security, and operations

- [ ] Batch Availability Dashboard resolution data.
- [ ] Batch analytics recipe-cost/pricing inputs.
- [ ] Move refresh tokens to secure HttpOnly cookies if deployment architecture permits.
- [ ] Define trusted proxy/IP behavior.
- [ ] Unify CSP/security headers.
- [ ] Define production ingress/topology, health checks, backup/restore, and smoke testing.
- [ ] Add production observability metrics.

## Repository hygiene completed in this pass

- Removed ignored generated `coverage/`, `dist/`, `.turbo/`, Playwright report, and test-result directories from the working/package copy.

## Verification log

| Date | Change | Verification | Result |
| --- | --- | --- | --- |
| 2026-08-31 | API refresh uses isolated client with the configured base URL; absolute-origin regression test added | `packages/api-client` typecheck/test | Blocked locally: `bun` executable unavailable |
| 2026-08-31 | Removed non-functional Settings notification controls | Full web verification pending | Implemented, unverified |
| 2026-08-31 | Made Redis contract explicitly required and removed silent webhook-worker disable path | API verification pending | Implemented, unverified |
| 2026-08-31 | Restricted `/dev/*` design previews to Vite development mode and changed Playwright readiness URL to `/login` | Web build/E2E pending | Implemented, unverified |
| 2026-08-31 | Added POS browser critical-path test: login → context → order creation with payload assertion | `bun run test:e2e` | Blocked locally: `bun` executable unavailable |
| 2026-08-31 | Removed unreachable bulk availability parity helper | API typecheck/test pending | Implemented, unverified |
| 2026-08-31 | Renamed order repricing module to `active-order-pricing.ts` | API typecheck/test pending | Implemented, unverified |
| 2026-08-31 | Removed `/phase-h` route and phase-oriented UI wording | Web/waiter verification pending | Implemented, unverified |
| 2026-08-31 | Removed customer-app fixture/demo execution path and demo persistence/realtime exceptions | Customer-app typecheck/test/build pending | Implemented, unverified |
| 2026-08-31 | Rebuilt migrations as canonical pre-v1 baseline: enums + 77 one-table migrations, synchronized journal/snapshots | `node scripts/release/verify-migrations.mjs` | **PASS — 78 atomic SQL/journal/snapshot units** |
| 2026-08-31 | Preserved canonical RBAC tenant guards, cross-tenant membership-role protection, immutable audit-log triggers, roles/permissions/allergen reference data | Migration integrity + direct SQL inspection | **PASS** |
| 2026-08-31 | Removed persisted compatibility availability booleans and impossible legacy Order Explain evidence fallback | Repository stale-reference grep + TypeScript parser sweep | **PASS (static)** |
| 2026-08-31 | Consolidated authorization/typed-domain error paths and webhook error translation | TypeScript parser sweep across 1,178 TS/TSX files | **PASS syntax; full type/test pending dependencies** |
| 2026-08-31 | Removed web preview route tree and `apps/web/src/dev` implementation pages | stale-route grep + TypeScript syntax sweep | **PASS (static)** |
| 2026-08-31 | Removed dangling historical design-doc references from production source | source grep + active Markdown inventory | **PASS — no deleted-doc references; 3 active Markdown files** |
| 2026-08-31 | Broke pricing/table production import cycles with neutral contract modules | relative-import SCC scan (`apps/api/src`, `apps/web/src`) | **PASS — 0 cycles / 0 cycles** |
