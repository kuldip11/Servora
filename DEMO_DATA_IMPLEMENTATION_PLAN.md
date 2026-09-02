# Servora Demo Data Implementation Plan

## Goal

Provide deterministic, resettable demo data that exercises Servora's real Organization → Franchise/Tenant → Branch hierarchy and creates underlying transactions used by dashboards and analytics.

## Architecture

The seeder is intentionally split by domain instead of using one generic SQL/JSON generator:

1. `seed-org.ts` — demo login, organization, franchise tenants, branches, RBAC memberships and staff.
2. `seed-tables.ts` — restaurant tables and branch kitchen stations.
3. `seed-menu.ts` — published menus, categories, realistic menu items, variants, modifiers and routing.
4. `seed-customers.ts` — customer profiles, loyalty tiers and promotions.
5. `seed-inventory.ts` — branch inventory, waste reasons and opening stock movements.
6. `seed-orders.ts` — historical/live orders, KDS tickets, replay-safe order items, bills, payments, promotion redemptions and order status history.
7. `verify.ts` — post-seed integrity/coverage assertions.
8. `reset.ts` — demo-only cleanup, including handling append-only audit-log triggers before tenant deletion.

## Presets

- `small`: 4 concepts × 2 branches, 40 menu items/brand, 30 days of orders. It covers the same scenario matrix as `demo` and has a conservative pre-flight estimate capped at 250 MB.
- `demo`: 4 concepts × 6 branches, 160 menu items/brand, 365 days of orders. It is the large customer-demo and analytics dataset.

Only these two presets are accepted. Omitting `--preset` defaults to `demo`.

## Deterministic scenario coverage

Both presets guarantee data for:

- All order states, fulfillment types, staff/customer-QR sources, discounted and non-discounted checks, cancelled orders, live orders and guest/allergy notes.
- All kitchen-ticket states, including payment-pending, held, fired, preparing, ready and served.
- All payment methods and states, including failed attempts, pending payments and fully refunded payments with refund records.
- Published and draft menus; all menu-item availability states; vegetarian, non-vegetarian and egg items; fixed, weight-based and open pricing; variants and modifiers.
- Every table state plus inactive tables, branch sections, all core staff roles and an inactive cancellation reason.
- Inventory IN, OUT, ADJUSTMENT and WASTE movements, including a linked waste reason.

The post-seed verifier checks the key enum coverage per tenant so regressions fail the command instead of silently producing an incomplete demo.

## Size policy

The small preset uses a deliberately conservative row-payload estimate before destructive reset begins. The current estimate is printed at startup and the command refuses to run if configuration changes push it above 250 MB. PostgreSQL storage can vary with server version, indexes and extensions, so this is a seed-data budget rather than a claim about the size of the entire database cluster.

## Restaurant concepts

- Bean & Brew Cafe
- The Copper Barrel gastropub/bar
- Saffron Route full-service restaurant
- Urban Grill Express QSR

## Safety

Demo reset is disabled when `NODE_ENV=production`. Only the organization named `Servora Demo Group` and the dedicated demo login are targeted.

## Commands

```bash
bun run db:migrate
bun run demo:seed -- --preset=small
bun run demo:reset
bun run demo:seed -- --preset=demo
```

Demo login after a successful seed:

- Email: `demo@servora.local`
- Password: `ServoraDemo@2026`
