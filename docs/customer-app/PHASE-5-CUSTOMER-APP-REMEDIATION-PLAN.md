# Servora Customer App — Detailed Remediation Plan

## Objective

Bring `apps/customer-app` from a functional Phase 5 prototype to a production-ready Servora customer-ordering application while preserving the existing monorepo conventions and shared `@pos/ui` design system.

The work will be performed incrementally. Each phase must leave the application buildable and testable.

---

## Phase 0 — Baseline and safety

### Actions

- Establish the current customer-app baseline before changing behavior.
- Verify TypeScript, Vite build, Vitest, and existing tests.
- Record current customer-app files and public behavior.
- Do not change backend contracts unless a frontend defect proves the contract is insufficient.
- Keep fixture/demo behavior available during development, but make it explicit rather than implicit.

### Acceptance criteria

- Existing app behavior is understood.
- No unrelated applications are changed.
- Every later phase can be validated independently.

---

## Phase 1 — Customer-app architecture

### Current issue

`CustomerApp.tsx` currently mixes session bootstrap, menu loading, search, category filtering, cart state, pricing, modifiers, ordering, checkout, polling, WebSocket handling, waiter requests, and most presentation.

### Target structure

```text
apps/customer-app/src/
├── app/
│   └── CustomerApp.tsx
├── features/
│   ├── session/
│   │   ├── api.ts
│   │   ├── hooks/
│   │   └── types.ts
│   ├── menu/
│   │   ├── api.ts
│   │   ├── hooks/
│   │   ├── components/
│   │   └── types.ts
│   ├── cart/
│   │   ├── hooks/
│   │   ├── components/
│   │   ├── pricing.ts
│   │   └── types.ts
│   ├── ordering/
│   │   ├── api.ts
│   │   ├── hooks/
│   │   └── components/
│   └── service/
│       ├── api.ts
│       ├── hooks/
│       └── components/
├── shared/
│   ├── api/
│   ├── components/
│   └── utils/
├── dev/
│   └── fixtures/
├── main.tsx
└── index.css
```

### Actions

- Extract menu components.
- Extract cart components.
- Extract item customization.
- Extract order status.
- Extract waiter/service request UI.
- Extract session initialization.
- Extract API calls from UI components.
- Extract business calculations from React components.
- Keep `CustomerApp.tsx` as orchestration/composition only.

### Acceptance criteria

`CustomerApp.tsx` should primarily compose feature components and hooks rather than contain business rules or low-level API/WebSocket code.

---

## Phase 2 — Shared UI/design-system compliance

### Current issue

Customer-app imports `ThemeProvider`, but much of the UI bypasses `@pos/ui` with raw Tailwind utilities, arbitrary colors, large radii, and custom overlays.

### Actions

Replace appropriate custom UI with shared components from `@pos/ui`:

- Button
- IconButton
- Card
- Badge
- Dialog
- Drawer/BottomSheet
- Search/Input
- Spinner
- Skeleton
- EmptyState
- Toast/feedback components where available

Do not create duplicate customer-only versions of components that already exist in `@pos/ui`.

### Token migration

Replace arbitrary styling where semantic tokens exist:

- `bg-white` → shared surface token
- hardcoded background colors → shared background tokens
- `text-black/*` → semantic text tokens
- `border-black/*` → semantic border tokens
- arbitrary shadows → shared shadow tokens
- arbitrary radii → shared radius scale

### Radius strategy

Use a restrained radius scale:

- cards: `rounded-lg` / `rounded-xl`
- inputs: `rounded-md` / `rounded-lg`
- buttons: `rounded-md` / `rounded-lg`
- chips/status pills: `rounded-full`
- sheets/dialogs: shared component defaults

Avoid `rounded-3xl` and arbitrary pixel radii unless there is a documented design reason.

### Brand strategy

If the customer experience intentionally uses black/neutral primary actions instead of the shared purple primary, formalize that through semantic customer theme tokens rather than scattering `bg-black` throughout the code.

### Acceptance criteria

Customer-app visually belongs to the same Servora design system and does not maintain a second ad-hoc component system.

---

## Phase 3 — Menu and customization model

### Current issue

Menu variants and modifiers exist in the data model but are not fully represented in the customer interaction model.

### Actions

Implement variant selection where menu items have variants.

Example:

```text
Size
- Half
- Full
```

Implement modifier groups with:

- required/optional
- minimum selections
- maximum selections
- single vs multiple selection
- per-option quantity limits
- availability
- option pricing

Support modifier quantities where the backend model permits them.

### Validation

The UI must prevent invalid combinations before adding to cart.

The cart must also validate again before checkout.

### Acceptance criteria

Every selectable menu configuration can be represented accurately in the cart and order payload.

---

## Phase 4 — Cart and pricing correctness

### Current issue

Pricing is calculated in multiple places and tax currently does not consistently reflect the full line price when variants/modifiers add cost.

### Actions

Create a single pricing module:

```text
calculateVariantPrice()
calculateModifierTotal()
calculateLineSubtotal()
calculateCartSubtotal()
calculateCartTax()
calculateCartTotal()
```

All UI displays must use the same calculation source.

### Required model

For each cart line:

```text
base item price
+ variant adjustment
+ modifier total
× quantity
= line subtotal
```

Tax must use the backend-defined taxability/base and must not silently use only the base item price when taxable modifiers/variants are included.

### Money handling

- Avoid floating-point arithmetic for currency.
- Use integer minor units where practical, or a consistent decimal strategy.
- Never duplicate tax formulas in components.
- Backend remains authoritative for final order totals.

### Acceptance criteria

The amount displayed in menu/cart/checkout is internally consistent and matches the order response from the API.

---

## Phase 5 — Order lifecycle and checkout

### Actions

Separate the order flow into explicit states:

```text
cart
→ create order
→ order created
→ checkout/payment
→ confirmed
→ preparing
→ ready
→ served/completed
```

The actual statuses must follow the backend contract rather than inventing frontend-only statuses.

### Payment

Keep CASH/pay-at-counter functional if that is currently supported.

Design the payment abstraction so additional methods can later be added without rewriting checkout:

```text
CASH
UPI
CARD
ONLINE
```

Only expose methods actually enabled by the restaurant/backend.

### Acceptance criteria

Order creation, checkout, confirmation, failure, retry, and duplicate-submit protection are handled explicitly.

---

## Phase 6 — Realtime and polling

### Current issue

Customer-app currently uses both WebSocket updates and five-second polling.

### Actions

Create:

```text
useCustomerOrderRealtime()
```

The hook owns:

- WebSocket connection
- authentication
- subscription
- event parsing
- reconnect behavior
- cleanup
- connection state

Use WebSocket as the primary update mechanism.

Use polling only as a fallback when realtime is unavailable or after a reconnect failure.

### Efficiency

- Avoid permanent five-second polling while a healthy WebSocket is connected.
- Prevent duplicate status requests.
- Add backoff for reconnects.
- Clean up sockets/timers on unmount.
- Avoid unnecessary API traffic.

### Acceptance criteria

Normal operation uses realtime updates. Polling is fallback behavior, not a second always-on transport.

---

## Phase 7 — Session/QR flow

### Actions

Make QR/table session handling explicit.

Production flow:

```text
/customer?qr=<token>
```

Demo flow:

```text
/customer?demo=true
```

Do not silently fall back to fixture data simply because a QR token is missing.

### Session states

Handle:

- initializing
- valid session
- invalid/expired QR
- restaurant unavailable
- table/session unavailable
- network failure
- retry

### Acceptance criteria

A production URL cannot accidentally appear to be connected to fake restaurant/table data.

---

## Phase 8 — API organization

### Current issue

`api.ts` contains several unrelated API domains.

### Target

```text
features/session/api.ts
features/menu/api.ts
features/order/api.ts
features/service/api.ts
shared/api/client.ts
```

### Actions

- Centralize request/error handling in the shared API client.
- Keep feature-specific API functions near their feature.
- Define request/response types close to the API feature.
- Remove API calls from presentational components.
- Avoid duplicate URL construction and auth handling.

### Acceptance criteria

A developer can find session/menu/order/service API behavior without searching one monolithic file.

---

## Phase 9 — Loading, empty, and error UX

### Actions

Implement explicit states for every major feature.

### Menu

- initial skeleton
- successful menu
- empty menu
- load failure
- retry

### Cart

- empty cart
- populated cart
- invalid item/configuration
- unavailable item

### Order

- creating
- confirmed
- updating
- failed
- completed

### Service request

- idle
- submitting
- submitted
- failed
- retry

### Acceptance criteria

No important operation leaves the user staring at a blank screen or generic error.

---

## Phase 10 — Accessibility

### Actions

Use accessible shared components for dialogs/sheets.

Ensure:

- correct dialog semantics
- `aria-modal`
- accessible titles/descriptions
- focus management
- Escape handling
- focus-visible states
- keyboard navigation
- adequate touch targets
- meaningful image alt text
- buttons have accessible names
- status updates are announced where appropriate

### Acceptance criteria

Core ordering flow can be completed with keyboard navigation and works correctly with assistive technology semantics.

---

## Phase 11 — Responsive/mobile UX

### Actions

Optimize specifically for restaurant QR ordering, where mobile is the primary environment.

Ensure:

- sticky header does not cover content
- sticky cart CTA does not cover content
- bottom sheet respects safe-area insets
- checkout controls remain reachable
- long modifier lists scroll correctly
- keyboard does not hide inputs
- landscape/tablet layouts remain usable
- desktop receives an appropriate centered/max-width layout

### Acceptance criteria

Customer can complete an order comfortably on a small mobile screen without accidental overlays or inaccessible controls.

---

## Phase 12 — Performance

### Actions

- Avoid unnecessary menu re-renders.
- Memoize only where profiling/structure justifies it.
- Avoid rebuilding derived cart calculations repeatedly.
- Debounce search if API-backed search is introduced.
- Use image dimensions/lazy loading appropriately.
- Avoid redundant network calls.
- Keep WebSocket and timers stable.
- Do not introduce global state unless the feature actually requires it.

### Acceptance criteria

Menu browsing and cart interaction remain responsive on typical mobile devices.

---

## Phase 13 — Testing

### Unit tests

Test:

- pricing
- tax
- modifier selection
- variant selection
- cart quantity
- cart merge/remove behavior
- session parsing
- status mapping

### Component tests

Test:

- menu card
- customization sheet
- cart
- checkout
- order status
- service request

### Integration tests

Test:

```text
QR session
→ menu
→ customize item
→ add to cart
→ checkout
→ order status
```

### Regression tests

Ensure changes do not affect other applications or shared packages.

### Acceptance criteria

Business-critical customer ordering logic is covered by deterministic tests rather than only UI snapshots.

---

## Phase 14 — Code quality and cleanup

### Actions

- Remove dead code.
- Remove unused imports.
- Remove duplicate types.
- Remove fixture data from production paths.
- Remove obsolete `API_MODE`.
- Keep comments only where they explain non-obvious business rules.
- Use consistent naming.
- Keep feature exports organized.
- Avoid premature abstractions.

### Acceptance criteria

The customer app is understandable to a new developer without needing to read one giant component.

---

## Phase 15 — Final validation

Run:

```bash
bun install
bun run typecheck
bun run build
bun run test
```

Then validate the customer app manually for:

1. QR entry
2. restaurant/session loading
3. menu browsing
4. search
5. category filtering
6. item customization
7. variants
8. modifiers
9. cart
10. quantity changes
11. tax
12. total
13. checkout
14. order status
15. realtime updates
16. waiter request
17. retry/error flows
18. mobile layout
19. desktop layout
20. accessibility basics

---

# Final target architecture

```text
CustomerApp
    │
    ├── Session feature
    │      └── session API/hook
    │
    ├── Menu feature
    │      ├── menu API/hook
    │      ├── categories
    │      ├── search
    │      └── customization
    │
    ├── Cart feature
    │      ├── cart state
    │      ├── pricing engine
    │      └── cart UI
    │
    ├── Ordering feature
    │      ├── order API
    │      ├── checkout
    │      └── realtime status
    │
    └── Service feature
           └── waiter assistance

                 ↓

          shared @pos/ui
                 ↓
       shared design tokens
                 ↓
       consistent Servora UI
```

# Implementation order

Do not implement these items randomly. Use this order:

1. Baseline
2. Architecture extraction
3. Design-system alignment
4. Menu/variant/modifier model
5. Pricing correctness
6. Order/checkout lifecycle
7. Realtime/polling
8. QR/session hardening
9. API organization
10. Loading/error UX
11. Accessibility
12. Responsive polish
13. Performance
14. Tests
15. Final cleanup and validation

## Important constraints

- Do not rewrite the backend without evidence that the existing contract prevents the required customer behavior.
- Do not duplicate components already available in `@pos/ui`.
- Do not introduce a new state-management library just to split the current component.
- Do not make every app's dependencies identical.
- Do not use arbitrary Tailwind values when an existing semantic token is appropriate.
- Do not make the frontend authoritative for final monetary totals.
- Do not keep WebSocket and polling permanently active at the same time.
- Do not mix demo fixtures with the production QR/session path.

## 2026-08-27 — Order lifecycle and API hardening pass

Completed:

- Audited the customer-facing order/checkout contract against the API before changing the flow.
- Confirmed customer order lifecycle uses `OPEN`, `BILL_REQUESTED`, `PAID`, `CLOSED`, and `CANCELLED`; kitchen preparation status is represented separately by kitchen tickets.
- Split customer API access into feature modules: session, menu, order, and service, with a shared HTTP request client.
- Added the missing Vite client type declaration so `import.meta.env` is correctly typed.
- Fixed `exactOptionalPropertyTypes` violations by omitting optional `variantId`/`selectedOptions` fields when they are not present.
- Fixed modifier group selection counting so `minSelections`/`maxSelections` count selected options, while `maxQuantity` controls repeated quantities for a selected option.
- Changed order placement so the created order is retained immediately before checkout.
- If checkout fails after order creation, the customer is shown the existing order and can retry checkout instead of creating a duplicate order.
- Cleared the cart once an order is successfully created so `Order more` starts a fresh cart.
- Added an explicit checkout retry action to the order confirmation screen.

Known backend follow-up:

- The payment table currently has an index on `orderId` but no database-level uniqueness constraint for one pending payment per order. The customer UI now prevents normal duplicate submissions, but true concurrent requests should eventually be protected server-side with transactional/DB-level idempotency.
- The API remains authoritative for final order totals; customer-side totals are display estimates only.

Validation note for this pass:

- The previously recorded customer-app type errors were addressed: `import.meta.env` typing, nullable QR token narrowing, and `exactOptionalPropertyTypes` violations.
- Full dependency-backed validation still requires the repository dependencies to be installed locally with `bun install`.

## Definition of done

The customer app is complete when it is:

- architecturally modular
- consistent with the shared Servora UI system
- correct for variants/modifiers/pricing
- resilient through order lifecycle failures
- realtime-first
- mobile-first
- accessible
- tested
- free of avoidable duplicate API traffic
- maintainable without a monolithic `CustomerApp.tsx`

---

# Implementation log

## 2026-08-27 — Initial implementation pass

Completed:

- Added this plan to `docs/customer-app/PHASE-5-CUSTOMER-APP-REMEDIATION-PLAN.md`.
- Split customer ordering concerns into feature modules for menu, cart, ordering, and session UI.
- Added a dedicated cart pricing module so line subtotal, cart subtotal, tax estimate, total, and item count share one calculation path.
- Added variant selection support.
- Added modifier quantity controls with `maxQuantity` enforcement and group selection limits.
- Replaced the hand-rolled item overlay with the shared `@pos/ui` `BottomSheet`.
- Replaced repeated raw UI primitives with shared `@pos/ui` components such as `Button`, `Card`, `IconButton`, `Badge`, `SearchInput`, `EmptyState`, and `Spinner`.
- Migrated customer-app visual styling toward semantic design tokens instead of arbitrary black/white/background values.
- Made the QR production path explicit and retained fixtures only behind `?demo=true`.
- Extracted WebSocket order updates into `useCustomerOrderRealtime`.
- Changed order-status polling from always-on 5-second polling to a 15-second fallback that runs only when realtime is not connected.
- Removed the unused React Query dependency from customer-app.
- Standardized customer-app internal workspace package references to `workspace:*`.
- Standardized all `@pos/*` package references found in the repository from `*` to `workspace:*`.
- Moved Vite to customer-app `devDependencies`.

Validation note:

- Full dependency-backed typecheck/build could not be completed in this environment because the repository dependencies are not installed here. The next local validation step is `bun install`, followed by the commands in the Final Validation section above.


## Implementation Pass — Loading/Error UX

Completed the next customer-app UX reliability pass:

- Added a real menu skeleton instead of a generic loading screen during initial session/menu bootstrap.
- Added an explicit retry action when the QR/session bootstrap fails.
- Added accessible live/busy semantics to the initial loading/error states.
- Kept loading/error behavior separate from the already-created order state so checkout failures do not destroy the order.
- Kept the shared `@pos/ui` primitives as the source for Button, Spinner, Skeleton, and other customer controls.
- Avoided introducing another local loading component or styling system.

### Next

Continue with realtime reconnect/fallback behavior, then accessibility and responsive validation, followed by broader automated coverage.


## Implementation log — Realtime reliability pass

### Completed

- Reworked `useCustomerOrderRealtime` into a reconnecting WebSocket hook.
- Added exponential reconnect backoff starting at 1 second and capped at 30 seconds.
- Reset reconnect backoff after a successful connection.
- Kept the existing 25-second heartbeat while connected.
- Ensured heartbeat and reconnect timers are cleaned up on disconnect/unmount.
- Kept malformed WebSocket messages isolated so they cannot break the order-status stream.
- Preserved the existing customer-app polling fallback: polling remains available when `live === false` and stops when realtime is healthy.
- Kept fixture/demo sessions excluded from realtime connections.

### Resulting transport strategy

```text
Healthy WebSocket
      ↓
order.updated
      ↓
customer order state

WebSocket disconnect
      ↓
1s → 2s → 4s → 8s → ... → 30s backoff
      ↓
reconnect

While disconnected
      ↓
15s polling fallback

WebSocket recovers
      ↓
polling stops
```

### Remaining considerations

- The backend WebSocket endpoint remains the source of truth for event delivery.
- A future enhancement can add browser online/offline awareness and a connectivity indicator if the UX requires it.
- The fallback poll is intentionally retained to reduce the risk of stale order status during realtime outages.


## Accessibility and responsive UX pass — completed

### Changes implemented

- Removed nested interactive controls from menu cards. A menu card is now one accessible button instead of a button containing an icon button.
- Added stronger `focus-visible` treatment for customer-app controls.
- Added reduced-motion handling for customer-app animations/transitions.
- Added `aria-label`/status semantics where order progress and connection state need to be communicated.
- Added an accessible order preparation progress indicator.
- Added `aria-describedby` linking the checkout action to the payment explanation.
- Added lazy loading and asynchronous decoding for menu/cart images.
- Improved mobile touch targets for customization choices.
- Added safe-area-aware bottom spacing for the sticky cart action and order screen.
- Added safe-area top spacing to the mobile checkout view.
- Increased scroll padding/bottom breathing room so sticky actions do not cover menu content.
- Kept the shared `@pos/ui` BottomSheet for customization so Radix provides dialog semantics, Escape handling, focus management, and dismissal behavior.
- Preserved the existing `viewport-fit=cover` configuration for notched devices.

### Accessibility issue discovered and fixed

The previous `MenuCard` rendered a `Card` as a `<button>` while also rendering an `IconButton` inside it. Nested interactive controls are invalid HTML and create an inaccessible keyboard/focus model. The card is now a semantic `Card` container with one full-card button.

### Remaining accessibility work

The next validation pass should include keyboard/manual screen-reader verification and automated accessibility checks where the repository's test tooling supports them.

## Performance and code cleanup pass — completed

### Completed

- Added a shared `formatMoney` utility so customer-facing currency formatting is defined once instead of being duplicated across the app's components.
- Added `getCartSummary()` to derive subtotal, tax, total inputs, and item count from a single cart traversal. The UI now consumes one memoized summary instead of separately traversing the cart four times.
- Converted the main customer presentation components to `React.memo` where they are pure and receive stable props:
  - `MenuCard`
  - `CartView`
  - `ItemCustomization`
  - `OrderPlaced`
- Stabilized frequently passed event handlers with `useCallback` to make the memoized components effective and reduce avoidable child renders.
- Removed unnecessary `useMemo` around static `URLSearchParams` creation.
- Removed the trivial `normalizeMenu()` indirection and consume the menu response directly.
- Updated cart item keys to reflect the configured item/variant/options rather than the array index, improving React reconciliation when cart lines are removed or reordered.
- Kept the existing business behavior unchanged while extracting performance-sensitive calculations and presentation concerns.
- Preserved the shared `@pos/ui` primitives and did not introduce another state-management or utility dependency.

### Performance principles applied

- Optimize derived calculations at the collection boundary instead of adding memoization everywhere.
- Stabilize callbacks only where they cross memoized component boundaries.
- Prefer stable data keys over array indexes for dynamic collections.
- Avoid adding dependencies or abstractions solely for perceived performance.

### Remaining performance considerations

- Menu virtualization is intentionally not being introduced yet; restaurant menus are expected to be small enough for normal DOM rendering, and virtualization would add complexity to the mobile ordering flow.
- Image CDN/responsive `srcset` work depends on the backend/image delivery contract and should be addressed when that contract is defined.
- Final performance validation should be done on a production build and representative mobile device/network conditions.

---

# Production-readiness audit — 2026-08-27

## Contract verification

The customer application was compared against the actual API modules in `apps/api`.

### Verified

- QR session: `POST /api/customer/sessions` with `{ qrToken }`.
- Customer menu: `GET /api/customer/menu` using `X-Customer-Session`.
- Customer order creation: `POST /api/customer/orders` using `{ items, notes? }`.
- Customer checkout: `POST /api/customer/orders/:id/checkout` using `{ method: "CASH" }`.
- Customer order retrieval: `GET /api/customer/orders/:id`.
- Customer WebSocket: `/ws/customer/events?session=<customer-session-token>`.
- Customer realtime events are routed by `customerSessionId` and include `order.created` / `order.updated` payloads when available.
- Backend order lifecycle is a billing lifecycle (`OPEN`, `BILL_REQUESTED`, `PAID`, `CLOSED`, `CANCELLED`); kitchen preparation is represented separately by kitchen-ticket status (`FIRED`, `PREPARING`, `READY`, `SERVED`).

## Concrete fixes made during the audit

### 1. Centralized customer configuration validation

Added `features/cart/configuration.ts`.

The customer UI and cart now share one validation implementation for:

- required variants
- required modifier selections
- maximum selections
- single vs multiple selection
- option availability
- per-option quantity limits
- duplicate option entries

### 2. Centralized order payload construction

Added `features/order/payload.ts`.

The React screen no longer constructs the order request shape inline. Optional fields are omitted instead of being sent as `undefined`, which is required by the repository's `exactOptionalPropertyTypes` configuration.

### 3. Defensive modifier quantity enforcement

The customer UI now prevents quantity changes above an option's configured `maxQuantity` both through the control state and the mutation handler.

### 4. Checkout concurrency hardening

The backend customer checkout path previously checked for an existing pending payment before opening its transaction. Two concurrent checkout requests could therefore both observe no pending payment and insert separate payment rows.

The checkout transaction now takes an order-scoped PostgreSQL advisory transaction lock before checking/creating the payment. This serializes concurrent checkout attempts for the same order while keeping the existing idempotent behavior:

- existing pending payment → return it
- existing successful payment → return it as already settled
- otherwise create exactly one pending payment for the checkout attempt

### 5. Revalidated realtime contract

The customer WebSocket path intentionally uses `session=<customer-session-token>`, matching `customerRealtimeRouter`. The staff realtime path uses JWT authentication separately and must not be reused by the customer app.

## Validation status

The repository history contains a real local validation run with dependencies installed. That run exposed customer-app TypeScript errors in an earlier intermediate state, including optional-property handling and an obsolete `normalizeSelectedOptions` reference. The current source has been corrected for those issues.

A fresh validation run is still required after these latest edits:

```bash
bun install
bun run typecheck
bun run test
bun run build
```

Do not mark Phase 5 as production-ready until all four commands complete successfully.

## Remaining production follow-ups

- Add a dedicated backend concurrency regression test for customer checkout idempotency.
- Add customer component/integration tests for the QR → menu → customization → cart → order → checkout → realtime lifecycle.
- Run the full monorepo validation after the latest source changes.
- Perform a manual mobile QR-order smoke test against a running API/PostgreSQL/Redis environment.


## Production validation root-cause fix — 2026-08-27

### Failure observed

The user's real validation run reached the API package and failed at:

```text
apps/api/src/modules/customer/customer.service.ts:186
TS1005: ',' expected
Expected "}" but found "async"
```

The API build produced the same parser failure at `getOrder()`.

### Root cause

`customer.service.ts` defines service methods inside an object literal. The `checkout()` method ended with:

```ts
  }
```

instead of the required object-property separator:

```ts
  },
```

Therefore TypeScript/Bun parsed the following `async getOrder()` declaration as if it appeared before the previous object property had been terminated.

### Fix

Changed the end of `checkout()` from:

```ts
  }
```

to:

```ts
  },
```

No workaround or dependency change was used.

### Verification

A parser/typecheck invocation against the repaired file reports only missing dependency/type-resolution errors in the isolated environment and **no syntax/parser error at `getOrder()`**.

The user's original full workspace validation had already demonstrated that:
- `bun install` completed successfully.
- customer-app typecheck was reached successfully.
- the workspace failure was caused by `@pos/api:typecheck`.
- API build failed for the same syntax error.

### Required fresh validation

From the repository root:

```bash
bun install
bun run typecheck
bun run test
bun run build
```

The important criterion is that the API parser error at `customer.service.ts:186` is gone. Any subsequent error must be investigated from its actual output rather than assumed to be related.
