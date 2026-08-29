# Phase 3.3 — Customer → POS

Customer QR orders already publish the same branch-scoped `order.created` / `order.updated` domain events as staff POS orders. The POS now consumes those events directly.

- Customer-created orders enter active POS list caches without an HTTP refetch.
- Customer updates replace the matching order in filtered list caches and detail cache.
- Status/type filters are respected when applying realtime updates.
- Events remain tenant/branch scoped by the realtime gateway.
- Customer session identity is never used as tenant authorization for staff sockets.
