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

- [x] Fix API refresh request to honor configured API base URL. **Verified statically:** the isolated refresh client uses the same configured `baseURL`/credentials as normal requests; the public refresh contract is cookie-only and stale body/response refresh-token contracts were removed. Live cross-origin execution remains part of release certification.
- [ ] Achieve a complete clean local/CI run of `typecheck`, `lint`, `test`, and `build`.
- [x] Add real POS critical-path Playwright E2E tests. **Implemented and statically verified:** `apps/web/tests/critical-order-flow.spec.ts` covers login → business context → Orders → dine-in order creation and API payload using the current cookie-only auth response contract. Execution remains part of release certification because Bun/Playwright dependencies are unavailable in this sandbox.
- [!] Replace website Privacy/Terms/Cookies placeholders with approved content. **Blocked:** approved legal text must be supplied/reviewed by the product/legal owner; engineering should not invent it.
- [x] Implement or remove fake notification settings. **Removed non-functional notification controls; production-source sweep confirms the fake notification settings are absent.**
- [x] Define Redis as truly required or truly optional—no contradictory contract. **Redis is required by API env validation and worker startup, `/health/ready` fails when Redis is unavailable, and transient request-path degradation does not redefine the deployment requirement.**

## P0 release-certification status

The P0 implementation tasks above are source-complete except approved legal content. The following release evidence still requires the locked runtime/deployment environment and therefore remains open:

- [ ] `bun install --frozen-lockfile` followed by clean `lint`, `typecheck`, `build`, `test`, coverage, accessibility, and Playwright runs.
- [ ] Empty PostgreSQL reset + migrate-from-zero + reference-data/constraint validation.
- [ ] PostgreSQL backup/restore rehearsal against the production database version.
- [ ] Production-like API/app startup and cross-origin login/refresh-cookie smoke.
- [ ] Redis/realtime and Razorpay worker runtime health verification.
- [ ] Complete order → kitchen → bill → payment → inventory runtime smoke.

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
- [x] Split `order.service.ts` by use case. **Completed: `order.service.ts` is now a 25-line compatibility facade. Create-order, fire-ticket/course, refire/refill, query, status, table transfer/merge, and void/comp flows live in dedicated services; shared course/availability checks live in `order-fire.helpers.ts`.**
- [x] Split `customer.service.ts` and `CustomerApp.tsx`. **Completed: `customer.service.ts` is a 17-line facade over session, menu, order-placement, and payment services. `CustomerApp.tsx` is now 231 lines (from ~1,073); session/bootstrap/realtime/request lifecycle lives in `useCustomerSession`, cart/customization state in `useCustomerCart`, and checkout/Razorpay/order placement in `useCustomerCheckout`.**
- [x] Decompose availability/inventory around pure engines and batched data sources. **Completed: availability precedence remains in pure `availability-resolution.ts`; dashboard evaluation is isolated in `availability-dashboard.service.ts` and uses one batched resolution snapshot; inventory is a 19-line facade over `inventory-stock.service.ts` and `inventory-recipe.service.ts`, with recipe arithmetic in `inventory-recipe.engine.ts`.**
- [x] Remove production explicit `any` systematically. **Production explicit `any` annotations/casts are now zero across API, web, waiter, kitchen-display, and shared packages (tests excluded from this production metric).**
- [x] Build typed domain API clients. **Completed:** `@pos/api-client` now owns typed auth, approvals, analytics, audit, availability, branches, tables, staff/RBAC, billing, orders, inventory, menu, customers, organizations, settings, and kitchen-display domains. Raw production `apiClient.get/post/put/patch/delete` ownership is eliminated from every frontend: web 201 → 0, waiter 56 → 0, kitchen-display 6 → 0, customer-app remains 0. Feature services/components now consume domain methods and shared response-envelope extraction instead of locally parsing Axios responses.
- [x] Move shared form/domain types out of page components. **Verified:** production imports of types from `Page`, `Modal`, or `Section` modules are zero; table form values and orderable menu category contracts now live in neutral/shared type modules.
- [x] Remove unused UI primitives after dev previews are no longer product-reachable. **Verified:** post-preview reachability scan found no orphan production UI component primitives/exports requiring deletion; stale phase/design-history comments in `@pos/ui` exports were also removed.

## P3 — Scale, security, and operations

- [x] Batch Availability Dashboard resolution data. **Dashboard no longer calls `getEffectiveItem()`/`getEffectiveVariant()` inside the branch × item × channel × fulfillment loops. Items plus schedules/branch overrides/channel overrides/current-date holidays are loaded in bounded queries and resolved in memory.**
- [x] Batch analytics recipe-cost/pricing inputs. **Cost/margin reporting now builds the complete item+variant selection set once, performs one pricing-pipeline call for the report, and computes recipe costs from one recipe-row batch with a shared sub-recipe cache.**
- [x] Move refresh tokens to secure HttpOnly cookies if deployment architecture permits. **Completed:** refresh tokens are opaque DB-backed tokens rotated in the host-only `servora_refresh` HttpOnly cookie; production uses `Secure; SameSite=None; Path=/api/auth`. Refresh tokens are no longer returned in JSON or persisted/read by web, waiter, kitchen-display, or `@pos/api-client`. The unused refresh-JWT secret/helpers were removed.**
- [x] Define trusted proxy/IP behavior. **Added explicit `TRUST_PROXY_HOPS` (default 0); forwarding headers are ignored unless trusted hops are configured. Production Compose uses one loopback-only TLS ingress hop and sets the API default to 1. Rate limiting and request context use the same resolver.**
- [x] Unify CSP/security headers. **The nginx-served apps share `deploy/nginx/security-headers.conf`; API and website emit aligned anti-framing/content-type/referrer/permissions/COOP/CORP/CSP protections, with only the external origins required by Razorpay/analytics allowlisted.**
- [x] Define production ingress/topology, health checks, backup/restore, and smoke testing. **Added `PRODUCTION_RUNBOOK.md`, loopback-only Compose port bindings behind one TLS ingress, explicit liveness/readiness guidance, existing guarded PostgreSQL backup/restore commands, and `bun run smoke:production` for all public apps plus the existing POS Playwright release flow.**
- [x] Add production observability metrics. **Added a protected Prometheus-text `/metrics` endpoint (`METRICS_TOKEN`) with API request latency, PostgreSQL readiness-query latency, staff/customer websocket connection gauges, Redis availability, Razorpay webhook failure counters, and order-processing error counters; alert expectations are documented in the production runbook.**

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
| 2026-08-31 | P2 explicit-`any` cleanup across auth, realtime, staff, customer requests, and waiter menu paths | production source count + TS/TSX parser sweep | **79 remaining (down from 158); 0 syntax diagnostics** |
| 2026-08-31 | Split order reads, status transitions, and table operations into dedicated use-case services while preserving `orderService` facade | TS/TSX parser + production import-cycle scan | **PASS static — `order.service.ts` 1,694 → 1,452 lines; 0 API/web cycles** |
| 2026-08-31 | Removed remaining production explicit `any` from menu/staff/order/auth/realtime/API boundaries | production source scan + TS/TSX parser | **PASS static — 0 explicit production `any`; 0 syntax diagnostics** |
| 2026-08-31 | Extracted order void/comp adjustment use cases into `order-adjustment.service.ts` | TS/TSX parser + production import-cycle scan | **PASS static — `order.service.ts` 1,694 → 1,179 lines; facade retained** |

| 2026-08-31 | Extracted order refire/refill kitchen-item flows into `order-kitchen.service.ts` | migration verifier + TS/TSX parser | **PASS static — `order.service.ts` 1,179 → 807 lines; 0 syntax diagnostics** |

| 2026-08-31 | Completed order-service use-case decomposition: extracted `fireTicket` plus shared course/availability helpers and moved create-order to `create-order.service.ts`; `order.service.ts` is now a thin facade | migration verifier + TS/TSX parser + production import-cycle scan | **PASS static — order facade 25 lines; 0 API/web/customer-app cycles; 0 syntax diagnostics** |
| 2026-08-31 | Split customer orchestration into session/menu/order/payment services and moved customer bootstrap/persistence/realtime/request lifecycle into `useCustomerSession` | migration verifier + TS/TSX parser + production import-cycle scan | **PASS static — `customer.service.ts` 1,020 → 17 lines; `CustomerApp.tsx` ~1,073 → 576 lines; 0 API/web/customer-app cycles; 0 syntax diagnostics** |

| 2026-08-31 | Completed customer-app orchestration split: cart/customization moved to `useCustomerCart`; checkout/Razorpay/order placement moved to `useCustomerCheckout` | migration verifier + TS/TSX parser + production import-cycle scan | **PASS static — `CustomerApp.tsx` 576 → 231 lines; 0 API/web/customer-app cycles; 0 parser diagnostics** |
| 2026-08-31 | Began availability/inventory pure-engine decomposition; extracted effective availability precedence and inventory recipe arithmetic/aggregation with focused unit tests | migration verifier + TS/TSX parser + production import-cycle scan | **PASS static — availability service 927 → 843 lines; inventory service 824 → 741 lines; runtime tests pending dependencies** |
| 2026-08-31 | Batched Availability Dashboard resolution and extracted dashboard orchestration | migration verifier + TS/TSX parser + production import-cycle scan + dashboard unit contract update | **PASS static — dashboard uses one item load + one batched resolution load; no per-context item/variant queries; 0 API/web/customer-app cycles** |
| 2026-08-31 | Completed inventory service decomposition into stock and recipe services behind a stable facade | TS/TSX parser + production import-cycle scan | **PASS static — `inventory.service.ts` 741 → 19 lines; recipe service 509 lines; stock service 188 lines; 0 production explicit `any`** |
| 2026-08-31 | Added typed domain API factories for orders, inventory, menu, and customers; migrated core web services plus waiter customer/order flows and added domain-client contract tests | migration verifier + TS/TSX parser + production import-cycle scan + AST explicit-`any` scan + raw-call inventory | **PASS static — 78 migrations; 1,180 TS/TSX files / 0 syntax diagnostics; 0 API/web/waiter/customer-app cycles; 0 production `any`; raw web calls 201 → 159 and waiter 56 → 44** |

| 2026-08-31 | Expanded typed domain clients across auth, approvals, branches, tables, staff/RBAC, billing, menu management, and waiter ordering context; centralized `OrderableMenuCategory` in shared types | TS/TSX parser + migration verifier + raw-call inventory | **PASS static — waiter raw production Axios calls 56 → 0; web 201 → 85; 0 parser diagnostics** |
| 2026-08-31 | Verified shared form/domain contracts are not imported from page/modal/section components; audited UI reachability after dev-preview removal | source import scan + production UI symbol reachability scan | **PASS static — 0 page-owned type imports; no orphan production UI primitives detected** |

| 2026-08-31 | Completed typed domain API client migration across all production frontends | Raw production Axios scan + TS parser + import-cycle scan | **PASS — web 0, waiter 0, kitchen-display 0, customer-app 0; 0 explicit `any`; 0 cycles** |
| 2026-08-31 | Batched analytics cost/margin recipe + pricing inputs | analytics contract test update + TS parser | **PASS static — one recipe-cost batch and one pricing call per report** |
| 2026-08-31 | Migrated refresh tokens out of browser storage into API HttpOnly cookie rotation; removed obsolete refresh JWT secret/helpers | production source exposure scan + TS parser | **PASS static — 0 frontend refresh-token references; 0 parser diagnostics** |
| 2026-08-31 | Added trusted-proxy hop policy, shared CSP/security headers, loopback-only production topology, runbook, backup/restore/smoke procedure | env-example validator + production-env validator + static config inspection | **PASS static** |
| 2026-08-31 | Added protected production metrics surface for API/DB/websocket/Redis/webhook/order signals | TS parser + source instrumentation inspection | **PASS static; live scrape/alert verification pending deployment** |
| 2026-08-31 | Repaired latent create-order decomposition export mismatch discovered during P3 verification | TS parser + facade/source consistency inspection | **PASS static — `createOrderService` export matches `order.service.ts` facade** |
| 2026-08-31 | Reconciled RBAC static certification after service decomposition | `bash scripts/audit/rbac-static.sh` | **PASS — audit now verifies the actual create/fire/refire/refill/void/comp/inventory enforcement modules** |
| 2026-08-31 | Removed stale cookie-migration contracts (`refreshTokenSchema`, shared `AuthTokens.refreshToken`, E2E refresh-token JSON fixtures) | production refresh-token exposure scan + TS parser | **PASS — no browser/shared public refresh-token contract remains** |
| 2026-08-31 | Removed dead root verification commands targeting nonexistent RBAC/Lighthouse scripts and validated direct script references | package-script reference scan across 13 manifests | **PASS — all directly referenced workspace scripts exist** |
| 2026-08-31 | Re-ran dependency-free release checks | migration verifier + env-example validator + production-env validator + JS/shell syntax checks | **PASS** |
| 2026-09-01 | Dependency-backed certification using complete uploaded `node_modules/.bun` store | Direct workspace `tsc --noEmit`; Vitest across all workspaces; root ESLint; Vite/Next production builds | **PASS — 12/12 typechecks; 1,067/1,067 tests; lint clean; customer/KDS/waiter/web Vite builds clean; website Next build compiled and generated 27/27 static pages** |
| 2026-09-01 | Critical POS Playwright execution with system Chromium | `PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/chromium playwright test tests/critical-order-flow.spec.ts` | **Environment-blocked — Chromium launches, but managed browser policy blocks navigation to `127.0.0.1` with `ERR_BLOCKED_BY_ADMINISTRATOR`; all three Vite servers independently returned HTTP 200** |
| 2026-09-01 | API build | `apps/api` build script inspection | **Pending exact Bun runtime — script is `bun build src/index.ts --outdir dist --target bun`; uploaded dependency store does not include Bun executable** |
