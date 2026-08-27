# Phase 3.5 — Kitchen → Waiter

- Kitchen status changes now publish a fully hydrated ticket including items/modifiers and parent order/table context.
- Waiter list and order-detail caches merge `kitchen.ticket.updated` directly for the matching order.
- READY/SERVED transitions therefore appear immediately to waiters without waiting for polling.
- Events remain tenant/branch scoped; unrelated orders are not mutated.
- Polling remains reconciliation for reconnect gaps.
