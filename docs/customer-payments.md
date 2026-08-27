# Customer Payments — Phase 5

Customer self-ordering now has a server-owned checkout foundation.

## Current flow

1. Customer scans a table QR and receives a customer session.
2. Customer creates an order through `/api/customer/orders`.
3. Customer selects **Pay at counter**.
4. `/api/customer/orders/:id/checkout` creates a `PENDING` payment and a bill if one does not exist.
5. The order is sent to the kitchen immediately; payment remains pending.
6. Staff records the actual payment through the existing authenticated billing flow.
7. The customer order endpoint returns payment state so the customer UI can show whether payment is still pending.

## Security

- Checkout requires a valid customer session.
- The order must belong to that session, tenant, and branch.
- The server derives the payment amount from the stored order total.
- The browser never marks a payment successful.
- `SUCCESS` payments can only be recorded through the authenticated staff billing flow.

## Online payments

UPI/card/Razorpay/Stripe are intentionally **not** simulated in this phase. The existing payment enum supports those methods, but a production online flow requires a configured provider, server-created payment intent/order, signature verification, and webhook reconciliation.

The next payment phase should add a provider adapter behind the customer checkout API rather than placing provider secrets or payment verification logic in the browser.
