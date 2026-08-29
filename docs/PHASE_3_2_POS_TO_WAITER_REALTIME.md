# Phase 3.2 — POS → Waiter realtime

- `order.created` and `order.updated` already carry full order payloads from the API.
- Waiter order-list cache now inserts/updates those payloads directly instead of invalidating and refetching every event.
- Matching order-detail cache is updated at the same time.
- The detail hook ignores unrelated order events.
- Existing polling remains as reconnect/recovery reconciliation.
- Kitchen-ticket propagation remains explicitly Phase 3.5 and is not claimed here.
