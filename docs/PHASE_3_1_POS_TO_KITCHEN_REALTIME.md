# Phase 3.1 — POS → Kitchen realtime

Completed the realtime handoff from staff POS order creation/firing to the Kitchen Display.

- Staff-created orders and subsequent fired rounds publish `kitchen.ticket.created` with the full ticket payload.
- Events remain tenant + branch scoped in Redis/WebSocket delivery.
- KDS updates the React Query ticket cache directly from realtime events instead of always invalidating/refetching.
- FIRED/PREPARING/READY tickets are upserted; SERVED/non-visible tickets are removed immediately.
- Existing polling remains enabled as reconnect/recovery protection, so realtime is an acceleration layer rather than a single point of failure.
- Tests cover direct cache insertion and removal on terminal kitchen state.
