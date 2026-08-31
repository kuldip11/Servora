-- H1 corrective foundation: the original Phase-H pass attempted to infer the
-- resolver timestamp from created_at and current mutable menu state. Persist
-- the exact boundary timestamp and fire-time availability result instead.
-- Resolution evidence is captured for every new order/menu-item line. Nullable
-- columns still allow grouping rows that do not resolve a menu item.
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "resolution_as_of" timestamp;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "resolution_as_of" timestamp;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "availability_snapshot" jsonb;
CREATE INDEX IF NOT EXISTS "orders_resolution_as_of_idx" ON "orders" ("resolution_as_of");
CREATE INDEX IF NOT EXISTS "order_items_resolution_as_of_idx" ON "order_items" ("resolution_as_of");
