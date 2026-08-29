# Phase 3.6 — Payment → Order state

- Successful payments accumulate against the server-calculated bill total.
- Partial payments leave the order in `BILL_REQUESTED`; overpayment is rejected.
- The payment that completes the balance atomically advances `BILL_REQUESTED → PAID`.
- That automatic transition now writes `order_status_history` with the acting user.
- Dine-in table release (`OCCUPIED → AVAILABLE`) happens in the same database transaction as payment completion.
- `payment.updated`, `order.updated`, and `table.updated` are published after commit so POS/Waiter/Table views converge immediately.
- Payment and order state remain separate concepts; refunding a payment does not erase historical order completion.
