# Phase 3.7 — Inventory → Recipe consumption

Implemented recipe consumption as a fired-kitchen-round side effect rather than a loose order-level deduction.

## Guarantees

- Every automatic deduction is tied to a concrete `kitchen_ticket_id`.
- A kitchen ticket can consume each menu-item/ingredient recipe line only once.
- Retries are serialized with an advisory transaction lock and checked against persisted deduction history.
- Recipe lookup is explicitly scoped to the active tenant and branch for both the menu item and inventory item.
- Duplicate item/ingredient recipe lines are aggregated before mutation.
- Dine-in rounds deduct when fired; paid takeaway tickets deduct only when payment releases them to the kitchen.
- Razorpay webhook retries use the same ticket-idempotent path.
- Stock transactions and `order_inventory_deductions` preserve the audit trail, while low-stock realtime events and menu availability synchronization still run after successful deduction.

## Database

Migration `0041_ticket_inventory_idempotency.sql` adds nullable historical `kitchen_ticket_id` linkage plus a partial unique index over `(kitchen_ticket_id, menu_item_id, inventory_item_id)`.
