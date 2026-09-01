# Servora Security Audit

Date: 2026-09-01
Scope: Servora monorepo baseline `servora-product-roadmap-doc-cleanup.zip`

## Remediation status — 2026-09-01

| Finding                                                 | Status                                | Remediation implemented                                                                                                                                                                                                                                         |
| ------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared refresh cookie / cross-app identity substitution | **Resolved**                          | Per-app refresh cookies (`servora_refresh_web`, `servora_refresh_kitchen`, `servora_refresh_waiter`), `X-Servora-App`, JWT app binding, refresh-token app prefix validation, app-scoped logout.                                                                 |
| GLOBAL OWNER privilege bleed                            | **Resolved**                          | Tenant authorization now derives only from active membership roles/permissions; global roles are not merged into tenant authorization; generic OWNER permission bypass removed; global roles cannot be assigned through franchise staff management.             |
| Server-side application eligibility                     | **Resolved**                          | Login, refresh, membership listing and tenant-context activation enforce app-specific role eligibility.                                                                                                                                                         |
| Web active-membership permission state                  | **Resolved**                          | Context activation refreshes `/auth/me` and replaces active roles/permissions atomically; global-owner membership labelling was removed.                                                                                                                        |
| Waiter/KDS access-token persistence                     | **Resolved**                          | Access tokens are memory-only; browser storage retains non-secret context only; HttpOnly per-app refresh cookies restore sessions.                                                                                                                              |
| WebSocket credentials in query strings                  | **Resolved**                          | Staff JWT/customer session credentials are sent only in the first WebSocket auth message; unauthenticated sockets have a five-second auth deadline and unauthenticated ping is rejected.                                                                        |
| Cookie-auth CSRF/origin hardening                       | **Resolved for current architecture** | Auth cookie endpoints validate trusted Servora browser origins; cookies remain HttpOnly/Secure in production.                                                                                                                                                   |
| Security regression coverage                            | **Substantially improved**            | App/cookie/JWT audience, membership privilege isolation, origin validation, storage contract and realtime auth tests added. Dedicated deployed-browser multi-app and database-backed adversarial IDOR tests remain recommended before production certification. |

### Verification after remediation

- API: **683/683 tests passed** across **198 test files**.
- Web: **148/148**.
- Waiter: **49/49**.
- KDS: **32/32**.
- Customer: **14/14**.
- UI: **72/72**.
- Validation: **59/59**.
- API client: **13/13**.
- Realtime: **9/9**.
- Website: **4/4**.
- ESLint: **green**.
- Migration integrity: **78/78**.
- TypeScript: **12/12 workspaces compile clean**.
- RBAC static audit: **green**.
- Permission catalog audit: **54/54 runtime permission keys seeded; 9 system-role matrices verified**.

### RBAC / application-permission audit — 2026-09-01

A full route-to-role permission audit was completed after Waiter/KDS permission failures exposed inconsistencies between application workflows and the seeded system-role matrix.

Resolved findings:

- `WAITER` now includes `branch:read`, which the Waiter application requires to load branch capabilities.
- `WAITER` retains `menu:read`, `orders:create`, `orders:read`, `orders:update`, `orders:update_status`, `tables:read`, and `tables:update`.
- Kitchen-ticket authorization is transition-specific: `HELD → FIRED` accepts `kitchen:update` or `orders:update`; kitchen production states require `kitchen:update`; `READY → SERVED` accepts `kitchen:update` or `orders:update_status`.
- `CHEF` no longer receives broad `orders:update_status`; it keeps kitchen read/update plus the order/menu read capabilities required by KDS.
- `FRANCHISE_ADMIN` explicitly includes payment collection/refund permissions now that GLOBAL OWNER permissions no longer bleed into tenant membership authorization.
- `MANAGER` can collect payments but does not receive refund permission by default, and branch archival was removed from the default branch-scoped manager role.
- `INVENTORY_MANAGER` includes `inventory:create` in addition to read/update/adjust/waste.
- Runtime checks for nonexistent `roles:manage` were corrected to the existing `settings:update` permission where configuration changes are intended.
- Reserved system role names cannot be reused by tenant custom roles. Application eligibility checks genuine system roles or a custom role's actual capabilities, so a custom role merely named `WAITER`/`CHEF` cannot spoof app eligibility.
- Web no longer assumes every valid role can land on `/dashboard`; login/context switching chooses the first authorized route.
- Shared Web layout requests are permission-aware: tenant-wide users with `branch:read` may load all branches, while roles without that permission do not make unauthorized `/branches` background requests.
- Wrapped authorization errors are unwrapped by the global error handler so permission denials map to **403**, not **500**.

Current local development CORS is also aligned with the four frontend applications: Web `5173`, Kitchen `5174`, Waiter `5175`, and Customer `5176`. The real `.env` is not intended for distribution; `.env.example` is the source-controlled reference.

Automated guards:

- `scripts/audit/rbac-static.sh` verifies protected surfaces keep explicit gates.
- `scripts/audit/verify-permissions.mjs` verifies every runtime permission is seeded and critical system-role workflow permissions do not drift.
- tenant custom roles are blocked from reserved system-role names at both service and database-constraint levels.

### Updated security verdict

The two original production-blocking defects—the cross-app session substitution and GLOBAL OWNER tenant privilege bleed—are resolved in the current tree. Primary tenant/branch authorization remains server-side and tenant-scoped. The remaining security work is production certification rather than a known authorization bypass: run deployed multi-origin browser tests, database-backed cross-tenant adversarial tests, dependency/security scanning, and infrastructure/reverse-proxy review before launch.

## Original audit summary (before remediation)

The reported Web/KDS/Waiter account-switching incident is confirmed and reproducible from code. The root cause is a single API-host refresh cookie (`servora_refresh`) shared by every Servora staff application. Browser cookies are not isolated by port, and in production the same issue remains when all apps use the same API host. A login from KDS or Waiter replaces the refresh credential that Web will use on reload or on an access-token refresh.

The audit also found a separate authorization design issue: self-signup users receive a system `GLOBAL OWNER` role, and tenant authorization merges global roles into any tenant membership. If such a user is later added to a different franchise with a low-privilege membership (for example CHEF), the global OWNER role can make the membership tenant-wide and add OWNER permissions. This defeats the intended membership role restriction for that user.

Primary menu/order/customer/realtime data paths were reviewed for cross-tenant IDOR. No direct cross-tenant menu/order read was confirmed in those paths: tenant membership is resolved server-side, menu/order lookups include tenant scope, branch scope is checked, customer orders are bound to customer sessions, and realtime connections resolve membership and permissions server-side. These controls are meaningful and should be retained.

## Original confirmed findings (before remediation)

### P0 — Shared refresh cookie causes cross-app identity substitution

Affected areas:

- `apps/api/src/modules/auth/auth-cookie.ts`
- `apps/api/src/modules/auth/auth.route.ts`
- `packages/api-client/src/create-client.ts`
- `apps/web/src/shared/auth/bootstrap.ts`
- Web, Waiter and KDS API clients

All staff apps authenticate to the same API cookie name:

`servora_refresh`

The cookie is owned by the API hostname. Cookies are not separated by frontend port. Therefore logging in as User B from another Servora app replaces User A's refresh cookie.

Impact:

- Web reload can silently become the most recently logged-in KDS/Waiter user.
- Any app whose access token expires can refresh into the wrong account.
- Logging out one app can clear/revoke the refresh credential used by another app.
- A retry after 401 can replace only the access token while retaining stale tenant/branch/client state, creating a temporary mixed-identity state.
- This issue also exists in production if all applications call the same API hostname.

Required remediation:

- Add an authenticated client/audience identity: `WEB`, `WAITER`, `KDS` (and any future staff client).
- Use separate HttpOnly refresh cookie names per audience, e.g. `servora_refresh_web`, `servora_refresh_waiter`, `servora_refresh_kds`.
- Persist the audience on the refresh-token/session record and reject refresh when request audience does not match the stored audience.
- Add the audience to the access token and enforce it for app-specific APIs where appropriate.
- Make logout revoke only the current audience/session cookie, not another app's session.
- Add multi-app browser integration tests proving simultaneous identities remain independent.

### P0/P1 — GLOBAL OWNER privilege bleed into unrelated tenant memberships

Affected areas:

- `apps/api/src/modules/auth/auth.service.ts`
- `apps/api/src/modules/auth/auth.repository.ts`
- `apps/api/src/core/auth/authorization.ts`
- `apps/api/src/core/auth/auth-context.ts`
- `apps/api/src/core/auth/membership-context.ts`
- `apps/api/src/db/migrations/0010_create_roles.sql`
- `apps/api/src/db/migrations/0024_create_role_permissions.sql`

Self-signup creates a global OWNER role. `resolveAuthorization` merges `globalUserRoles` with the roles of the active tenant membership. A GLOBAL role also makes `tenantWide=true`. `requirePermission` contains a direct OWNER bypass.

Impact scenario:

1. A person signs up for their own Servora account and receives GLOBAL OWNER.
2. The same email/user is later added as CHEF/WAITER/etc. to another franchise.
3. Their global OWNER role is combined with the low-privilege membership.
4. The user may receive tenant-wide access and OWNER permissions inside that other franchise.

This does not by itself grant access to a tenant for which the user has no membership, because active tenant resolution checks membership. However, once any membership exists, the membership's intended least privilege can be defeated.

Required remediation:

- Do not merge platform/global ownership privileges into operational tenant authorization.
- Model ownership as organization-scoped membership/permission rather than a universal operational role.
- Keep provisioning permissions (`organization:create`, `tenant:create`) separate from tenant operational permissions.
- Remove the `auth.roles.includes("OWNER")` generic operational bypass.
- Resolve operational permissions exclusively from the active tenant membership and its allowed scoped roles.
- Add a regression test: a user who owns Organization A and is CHEF in Organization B must have only CHEF permissions in B.

### P1 — No server-enforced application eligibility / audience

Affected areas:

- `/api/auth/login`
- `/api/auth/refresh`
- Web Login page
- Waiter login hook
- KDS login hook

The generic login endpoint accepts every active user. There is no request audience and no policy such as "CHEF may authenticate to KDS but not Web admin".

This explains why the Chef credentials are accepted by Web. The Web frontend subsequently hides navigation or produces `Access denied`; that is UI authorization, not login authorization.

Required remediation:

- Define explicit client eligibility rules.
- Enforce them on the server during login and refresh.
- Do not rely on hidden navigation to decide which application an account may use.

### P1 — Web permission state does not represent the active membership

Affected areas:

- `apps/web/src/store/auth.ts`
- `apps/web/src/features/auth/pages/ContextPage.tsx`
- `apps/web/src/shared/auth/permissions.ts`

Login response user roles are global roles. Selecting a franchise updates membership/tenant/branch IDs but does not replace the UI user's roles/permissions with the active membership's effective permissions.

Impact:

- Legitimate staff can see hidden navigation / Access denied even when the backend grants their role a permission.
- UI and API authorization can disagree.
- This contributed to the Chef behavior observed in Web.

Remediation:

- Add a server endpoint that returns the effective active context: user + membership + effective roles + effective permissions + branch scope + app audience.
- Store that effective context atomically in each frontend.
- On context change or refresh, replace the complete context rather than only token or IDs.

### P1/P2 — Access tokens stored in browser storage in Waiter/KDS

Affected areas:

- Waiter: `localStorage`
- KDS: `sessionStorage`

An XSS in these apps can read access tokens. Waiter tokens also persist across browser restarts.

Remediation:

- Prefer in-memory access tokens backed by app-specific HttpOnly refresh cookies.
- If storage must remain temporarily, shorten token lifetime and keep CSP/XSS defenses strong.

### P2 — WebSocket credentials are passed in query strings

Affected areas:

- `packages/realtime/src/create-realtime-client.ts`
- `apps/api/src/modules/realtime/gateway.ts`

Staff access tokens and customer session tokens are placed in WebSocket URLs. URLs can be captured by proxy/access logs and diagnostics.

Remediation:

- Authenticate via a WebSocket subprotocol or first authenticated message where supported.
- Ensure reverse proxies never log query strings until migration is complete.

### P2 — Cookie-auth endpoints need explicit CSRF hardening in production

Production refresh cookies use `SameSite=None; Secure` so cross-site Servora frontends can call the API. Refresh/logout currently depend only on the cookie.

Risk:

- Cross-site logout/session disruption is possible if requests are accepted outside expected origins.
- CORS is not a complete CSRF defense because it controls browser response access, not whether every request is sent.

Remediation:

- Validate `Origin`/`Sec-Fetch-Site` on cookie-auth endpoints against the configured Servora origins.
- Consider a CSRF token for refresh/logout if cross-site cookie architecture remains.

### P2 — Security regression coverage is too narrow

Existing tenant isolation contract tests primarily assert database constraints. The system needs end-to-end authorization matrix tests.

Required negative tests:

- Tenant A user requests Tenant B menu item/order by known UUID -> 403/404.
- Branch A user requests Branch B order/table/inventory -> denied.
- CHEF attempts menu write, billing, staff, settings -> denied.
- WAITER attempts kitchen/admin operations -> denied.
- Owner of Organization A who is CHEF in Organization B -> CHEF only in B.
- Same browser: Web owner + KDS chef + Waiter waiter -> sessions stay independent across reload, expiry and logout.
- Customer session A requests Customer session B order -> denied.
- Realtime tenant/branch mismatch -> socket closed.

## Data-isolation results

### Menu

Primary item access is tenant-scoped (`itemRepository.findById(tenantId, itemId)`) and branch authorization is applied by services. Branch-scoped users are limited to the selected/authorized branch, with explicit support for tenant-shared menu resources where intended.

Result: no confirmed cross-tenant menu-item IDOR in the audited primary paths.

### Orders

Order list and single-order access require order permissions. Repository lookups include tenant scope, and service-level branch access checks are applied. Creation validates branch, table, menu items, customer groups and pricing context against the active tenant/branch.

Result: no confirmed cross-tenant order IDOR in the audited primary paths.

### Customer ordering

Customer order/payment/read queries bind order ID to tenant ID, branch ID and customer session ID. Customer session tokens are random UUIDs with expiry and active-state checks.

Result: customer A cannot simply substitute customer B's order UUID in the audited order/payment paths.

### Realtime

Staff WebSocket setup verifies the access token, resolves active tenant membership, resolves branch authorization and requires at least one relevant read permission. Events are delivered by tenant and branch scope. Customer realtime binds sockets to a validated customer session.

Result: realtime has server-side tenant/branch authorization; no direct cross-tenant subscription bypass was confirmed.

## Existing security strengths

- Refresh tokens are random, hashed before database storage and rotated on refresh.
- Refresh consumption is atomic/revocation-aware.
- Access tokens are short-lived (default 15 minutes).
- Refresh cookie is HttpOnly and Secure in production.
- Production secret validation rejects weak/default JWT secrets.
- Passwords use bcrypt cost 12.
- Login locks an account after repeated failures and returns generic invalid-credential errors.
- API authorization resolves tenant membership server-side rather than trusting tenant headers alone.
- Branch IDs are validated against tenant and membership scope.
- Database includes composite branch/tenant foreign-key isolation for key operational tables.
- Security headers are strong (CSP for API responses, HSTS, no-sniff, frame denial, restrictive referrer policy).
- Production CORS forbids wildcard and requires public HTTPS origins.
- Customer orders are tied to customer sessions.
- Staff realtime is tenant/branch/permission scoped.

## Recommended remediation order

1. P0: split refresh sessions/cookies by application audience and make context replacement atomic.
2. P0/P1: remove GLOBAL OWNER operational privilege bleed; make ownership organization-scoped.
3. P1: enforce app eligibility server-side and add audience to tokens/sessions.
4. P1: make frontend permissions derive from active membership/effective authorization context.
5. Add cross-tenant/cross-role authorization matrix integration tests before further feature work.
6. Move Waiter/KDS access tokens out of browser storage where practical.
7. Remove credentials from WebSocket query strings.
8. Add Origin/CSRF protection to cookie-auth endpoints.

## Original security verdict (before remediation)

Servora is not currently ready to be considered security-clean for production because the shared refresh-cookie identity collision is a confirmed session-integrity failure and the GLOBAL OWNER model can violate least privilege when an owner account is also a member of another franchise.

However, the core tenant/branch scoping in the principal menu, order, customer and realtime data paths is substantially stronger than the browser incident initially suggested. The audit did not find evidence that an arbitrary authenticated user can simply change an item/order UUID or X-Tenant-ID and read another tenant's data. The immediate priority should be fixing session identity isolation and role-scope semantics, then locking those guarantees with adversarial integration tests.
