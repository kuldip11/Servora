# Critical Pagination and API Status Fix Report

## Scope

This checkpoint fixes two platform-level production risks:

1. Unbounded order and menu-list rendering with large demo/production data.
2. Application errors intended as HTTP 400/401/403 being returned as HTTP 500, preventing access-token refresh.

## Root causes

### Order request timeouts

`GET /api/orders` previously returned every matching order. Each order also eagerly loaded its items, kitchen tickets, table, creator, and payments. The waiter application polled that complete payload every 15 seconds and then filtered Ready/Active orders in the browser. A branch with 100,000+ orders therefore produced a very large database query, JSON response, and browser render workload. The browser could cancel the request after its configured timeout.

### Incorrect 500 status codes

The API's shared error hook was registered after route plugins. Route handlers and scoped authentication derives therefore did not consistently inherit it. Their `ValidationError`, `UnauthorizedError`, and `ForbiddenError` exceptions fell through to the framework's default 500 response. The mapper also depended primarily on `instanceof`, which is fragile when a runtime adapter wraps or clones an error.

## Implemented changes

### Server-side order pagination

- `GET /api/orders` now accepts `page`, `limit`, `search`, `status`, `type`, and operational `view` filters.
- Default page size: 25 orders.
- Maximum page size: 100 orders.
- Responses use one standard pagination envelope: `total`, `page`, `limit`, and `hasMore`.
- Order-ID search runs in the database.
- Waiter `READY` and `ACTIVE` views run in the database instead of downloading order history and filtering it in the browser.
- The list query and total count run concurrently.
- Realtime events invalidate bounded list pages while continuing to update individual order details.

### Large-list UI by workflow

The UI deliberately does not use the same pagination control everywhere:

- **Web Orders and Billing:** server-side numbered pages, rows-per-page controls, total counts, and a fixed-height workspace. The page shell stays still while only the rows scroll.
- **Waiter Orders:** 20-order server pages are appended through infinite scroll. There are no small Previous/Next controls in the touch workflow.
- **Web Menu:** categories are collapsible and menu cards are progressively revealed inside each expanded category. The interim bottom paginator was removed.
- **Customer Menu:** the menu is a continuous category feed with progressive item loading, sticky category navigation, scroll-to-category behavior, and a mobile category FAB/bottom sheet.
- **Restaurant Tables:** searchable, status-filtered, section-filtered card grid with progressive rendering. Available, occupied, reserved, and cleaning states stay visible and understandable.
- **Waiter table selection:** touch-friendly searchable table grid with status filters. Unavailable tables remain visible for context but cannot be selected; the grid scrolls naturally and progressively reveals more tables.
- **Inventory and Staff:** filterable 25-row administrative pages with total counts and conventional bottom pagination.
- **Audit and Menu History:** cursor-based “Load older” batches using the last event timestamp; the browser never requests the complete history at once.
- **Kitchen:** all active tickets remain visible, but browser render containment prevents off-screen cards from consuming full layout/paint work. Station filtering is also pushed into the relational database query.

Operational consumers such as Dashboard, Tables, Billing, waiter Home, and merge candidates use bounded order requests.

### Responsive behavior

- Menu and table grids adapt across mobile and tablet widths.
- The waiter order-options panel preserves menu space by moving table discovery into a compact, independently scrollable selector.
- Customer category discovery remains reachable above the sticky cart action on mobile.
- Scrollbars may be visually hidden in menu/category rails while wheel, touch, trackpad, and keyboard scrolling remain available.

### Correct API errors and token refresh

- The shared API error hook is now registered before all route plugins.
- Wrapped/cloned application errors are structurally recovered, including nested `cause`, `error`, `original`, and `value` wrappers.
- Expected error statuses are preserved: validation 400, authentication 401, authorization 403, not found 404, conflict 409, domain rule 422, and rate limit 429.
- The existing shared client now receives real 401 responses, performs one refresh for concurrent failures, stores the new access token, and retries the original requests.

## Verification for this final UX checkpoint

- Typecheck: API, API client, web, waiter, customer, and kitchen — **PASS**
- Production build: API, web, waiter, customer, and kitchen — **PASS**
- Focused API inventory/staff/kitchen/error suite — **105/105 PASS**
- Focused web inventory/staff/orders/billing/tables suite — **56/56 PASS**
- Waiter menu/order suite — **40/40 PASS**
- Customer suite — **15/15 PASS**
- Kitchen suite — **23/23 PASS**
- API-client suite — **13/13 PASS**
- Total reported automated checks — **252/252 PASS**

The waiter and kitchen production builds still emit their existing bundle-size advisory for chunks above 500 kB. It does not fail the build; code-splitting those shells is a separate delivery-size optimization.

## Deployment note

Deploy the API and web/waiter clients together because the order-list response changed from an unbounded array to a paginated envelope. No database migration is required.
