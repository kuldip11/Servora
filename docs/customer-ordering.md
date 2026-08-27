# Servora Customer Self-Ordering

`apps/customer-app` is the customer-facing QR self-ordering surface for Servora.

## Current milestone: real customer-session ordering

The app now supports both:

- **Fixture mode** when opened without a QR token, for UX development.
- **API mode** when opened with a opaque table QR token:
  `http://localhost:5176/?qr=<table-public-qr-token>`.

The customer flow is deliberately separate from staff authentication. Customer requests never disable or bypass `requireAuthPlugin` on POS, waiter, kitchen, or staff routes.

### API flow

1. `POST /api/customer/sessions` with `{ qrToken }`.
2. API resolves the table QR token to tenant + branch + table.
3. API creates a short-lived customer session.
4. `GET /api/customer/menu` reads only published, available menu content for that branch.
5. The API applies branch overrides and schedule-driven availability before exposing the menu.
6. `POST /api/customer/orders` validates the customer session, re-checks item availability and calculates prices server-side.
7. The order is stored as `source = CUSTOMER_QR`, linked to the customer session and table.
8. The existing order/kitchen event flow receives the new order.
9. `GET /api/customer/orders/:id` is scoped to the same customer session.
10. The customer app polls the order endpoint every 5 seconds until realtime customer WebSocket delivery is added.

## Database changes

Migration `0021_customer_self_ordering.sql` adds:

- `restaurant_tables.public_qr_token`
- `customer_sessions`
- `orders.source`
- `orders.customer_session_id`
- nullable `orders.created_by` for guest orders
- nullable audit actor fields for guest-created order/inventory events

Existing staff orders continue using their authenticated user as `created_by` and audit actor.

## Security boundary

The customer token only grants access to:

- its table context
- its branch's published menu
- its own customer session
- orders created by that session

It does not grant access to staff endpoints or another table's orders.

## Local development

```bash
cd apps/customer-app
bun run dev
```

Fixture mode:

```text
http://localhost:5176/?table=T12
```

API mode requires a real `public_qr_token` from `restaurant_tables`:

```text
http://localhost:5176/?qr=<public_qr_token>
```

The API must allow the customer origin. The default development CORS origins now include both `http://localhost:5173` and `http://localhost:5176`.

## Product scope

### V1

- QR/table context
- Customer session
- Published menu
- Search/categories
- Item details
- Variants/modifiers
- Server-side pricing
- Server-side order creation
- KDS/POS order event integration
- Customer order status

### V1.1

- Customer-scoped realtime events
- Call waiter
- Request water/cutlery
- Request bill
- Online payment / UPI

### Later

- Guest/customer accounts
- Order history and reorder
- Favorites
- Offers/coupons
- Loyalty
- Recommendations

## Table assistance + realtime

Customer sessions can open table-assistance requests (`CALL_WAITER`, `WATER`, `CUTLERY`, `BILL`, `ASSISTANCE`) without staff authentication. Requests are scoped to the customer session and branch. Staff clients receive `customer.request.created` events through the existing authenticated realtime gateway; customer clients receive only events for their own session through `/ws/customer/events?session=<customer-session-token>`.

Kitchen ticket updates are forwarded to the owning customer session, so the customer order timeline can update without polling when the realtime connection is available. Polling remains a safe fallback.
