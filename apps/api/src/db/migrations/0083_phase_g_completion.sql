-- Phase G completion invariants and query support.
CREATE INDEX IF NOT EXISTS "menu_items_manual_stock_count_idx" ON "menu_items" ("tenant_id", "manual_stock_count") WHERE "manual_stock_count" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "menu_item_variants_manual_stock_count_idx" ON "menu_item_variants" ("manual_stock_count") WHERE "manual_stock_count" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "orders_billing_mode_idx" ON "orders" ("tenant_id", "billing_mode");
CREATE INDEX IF NOT EXISTS "menus_organization_status_idx" ON "menus" ("organization_id", "status") WHERE "organization_id" IS NOT NULL;
