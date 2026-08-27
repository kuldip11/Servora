# Customer Ordering — Critical Production Checklist

## 1. Razorpay webhook + idempotency

- Webhook signature is verified against the raw request body.
- `x-razorpay-event-id` is persisted with a unique constraint.
- Webhook requests enqueue only a durable event id; payment processing runs in the Redis worker.
- `RECEIVED`/`FAILED` events are recovered by the worker and retried.
- Payment state transitions are serialized with an order-scoped PostgreSQL advisory lock.
- Gateway payment id is unique, preventing the same Razorpay payment from being attached twice.
- Kitchen release occurs only after a verified/captured payment.

## 2. Razorpay Test Mode verification

The API includes a read-only credential/payment harness:

```bash
bun run --cwd apps/api payment:test:verify
```

Required `.env` values:

```env
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...
```

Optional:

```env
RAZORPAY_TEST_PAYMENT_ID=pay_...
```

The harness refuses live keys. A real checkout must still be completed in Razorpay Test Mode to prove the browser callback + server verification + webhook + kitchen release path.

## 3. QR/session security

- QR tokens are UUIDs and are resolved to an active table or branch.
- Customer sessions are active and time-limited.
- Session mode is server-derived (`DINE_IN` or `TAKEAWAY`).
- Customer menu/order/payment APIs scope every order lookup by tenant, branch and customer session.
- Dine-in order lookups also require the session's table relationship where applicable.
- Public takeaway sessions cannot submit DINE_IN fulfilment.
- Payment verification uses the URL order id and server-side session ownership; the client cannot select another order by changing the body.

## 4. Concurrency / duplicate-order protection

- Partial unique index allows one active customer order per session.
- Customer submission ids are carried to kitchen tickets and uniquely constrained per order.
- Order checkout/payment initialization uses an order-scoped advisory lock.
- Repeated customer submissions with the same request id do not create another kitchen round.

## 5. Pricing + inventory server validation

- Customer prices are resolved from current server menu data and branch overrides.
- Variants and modifiers are validated server-side.
- Tax is calculated server-side.
- Customer quantity limits are validated by API schema.
- Current availability is checked at order time.
- Inventory availability is checked immediately before order creation.
- The browser never supplies an authoritative subtotal, tax or total.

## 6. Database/migration cleanup

- Migration numbers are sequential through `0030_customer_order_request_idempotency`.
- Duplicate active customer tabs are reconciled by `0023_customer_single_tab` before the unique index is created.
- Payment webhook retry metadata is included in `0029_payment_webhook_retry_metadata`.
- Customer submission idempotency is included in `0030_customer_order_request_idempotency`.
- Validate both a fresh database and an existing development database with `bun run db:migrate`.

## 7. Build/typecheck/test

Run from the repository root:

```bash
bun install
bun run typecheck
bun run lint
bun run test
bun run build
```

Then manually verify both customer paths:

- Table QR → multiple rounds → mixed fulfilment → bill → one payment → table available.
- Public takeaway QR → payment → kitchen → pickup.
