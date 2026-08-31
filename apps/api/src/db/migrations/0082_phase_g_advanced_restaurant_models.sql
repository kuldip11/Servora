-- Phase G — Advanced Restaurant Models (G1-G9).
-- All existing behaviors remain defaults; each advanced mode is opt-in.

DO $$ BEGIN CREATE TYPE "zone_pricing_rule" AS ENUM ('AVERAGE','HIGHER','SUM_HALF'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "pricing_mode" AS ENUM ('FIXED','WEIGHT_BASED','OPEN'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "weight_unit" AS ENUM ('G','KG','LB','OZ'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "billing_mode" AS ENUM ('LINE_ITEMS','PER_COVER'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "cover_tier" AS ENUM ('ADULT','CHILD'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN CREATE TYPE "refire_type" AS ENUM ('REFIRE','REFILL'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

-- G1: per-variant modifier pricing.
CREATE TABLE IF NOT EXISTS "modifier_option_variant_prices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "modifier_option_id" uuid NOT NULL REFERENCES "modifier_options"("id") ON DELETE CASCADE,
  "variant_id" uuid NOT NULL REFERENCES "menu_item_variants"("id") ON DELETE CASCADE,
  "additional_price" numeric(10,2) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "modifier_option_variant_prices_option_variant_unique" ON "modifier_option_variant_prices" ("modifier_option_id", "variant_id");
CREATE INDEX IF NOT EXISTS "modifier_option_variant_prices_variant_idx" ON "modifier_option_variant_prices" ("variant_id");
--> statement-breakpoint

-- G2/G3/G4: item-level advanced ordering/pricing/stock modes.
ALTER TABLE "menu_template_items"
  ADD COLUMN IF NOT EXISTS "pricing_mode" "pricing_mode" NOT NULL DEFAULT 'FIXED',
  ADD COLUMN IF NOT EXISTS "weight_unit" "weight_unit",
  ADD COLUMN IF NOT EXISTS "open_price_min" numeric(10, 2),
  ADD COLUMN IF NOT EXISTS "open_price_max" numeric(10, 2),
  ADD COLUMN IF NOT EXISTS "supports_zones" boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "zone_pricing_rule" "zone_pricing_rule" NOT NULL DEFAULT 'HIGHER',
  ADD COLUMN IF NOT EXISTS "manual_stock_count" integer,
  ADD COLUMN IF NOT EXISTS "manual_stock_count_updated_at" timestamp,
  ADD COLUMN IF NOT EXISTS "tax_mode" "tax_mode";

ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "supports_zones" boolean NOT NULL DEFAULT false;
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "zone_pricing_rule" "zone_pricing_rule" NOT NULL DEFAULT 'HIGHER';
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "pricing_mode" "pricing_mode" NOT NULL DEFAULT 'FIXED';
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "weight_unit" "weight_unit";
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "open_price_min" numeric(10,2);
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "open_price_max" numeric(10,2);
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "manual_stock_count" integer;
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "manual_stock_count_updated_at" timestamp;
ALTER TABLE "menu_item_variants" ADD COLUMN IF NOT EXISTS "manual_stock_count" integer;
ALTER TABLE "menu_item_variants" ADD COLUMN IF NOT EXISTS "manual_stock_count_updated_at" timestamp;
ALTER TABLE "order_item_modifiers" ADD COLUMN IF NOT EXISTS "zone_label" varchar(30);
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "weight_quantity" numeric(12,4);
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "weight_unit" "weight_unit";
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "manual_price" numeric(10,2);

DO $$ BEGIN
  ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_open_price_band_valid"
    CHECK ("open_price_min" IS NULL OR "open_price_max" IS NULL OR "open_price_min" <= "open_price_max");
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_manual_stock_count_nonnegative"
    CHECK ("manual_stock_count" IS NULL OR "manual_stock_count" >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "menu_item_variants" ADD CONSTRAINT "menu_item_variants_manual_stock_count_nonnegative"
    CHECK ("manual_stock_count" IS NULL OR "manual_stock_count" >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

-- G5: fractional per-seat allocation. The billing junction becomes many-to-many
-- and snapshots the allocation ratio used by a bill.
CREATE TABLE IF NOT EXISTS "order_item_seat_shares" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_item_id" uuid NOT NULL REFERENCES "order_items"("id") ON DELETE CASCADE,
  "seat_label" varchar(50) NOT NULL,
  "share_ratio" numeric(8,6) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "order_item_seat_shares_ratio_positive" CHECK ("share_ratio" > 0 AND "share_ratio" <= 1)
);
CREATE UNIQUE INDEX IF NOT EXISTS "order_item_seat_shares_item_seat_unique" ON "order_item_seat_shares" ("order_item_id", "seat_label");
CREATE INDEX IF NOT EXISTS "order_item_seat_shares_item_idx" ON "order_item_seat_shares" ("order_item_id");
ALTER TABLE "bill_order_items" ADD COLUMN IF NOT EXISTS "allocation_ratio" numeric(8,6) NOT NULL DEFAULT 1;
DROP INDEX IF EXISTS "bill_order_items_order_item_unique";
CREATE UNIQUE INDEX IF NOT EXISTS "bill_order_items_bill_order_item_unique" ON "bill_order_items" ("bill_id", "order_item_id");
--> statement-breakpoint

-- G6: zero-priced combo refills reuse the Phase F refire graph.
ALTER TABLE "combo_slot_options" ADD COLUMN IF NOT EXISTS "is_unlimited_refill" boolean NOT NULL DEFAULT false;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "combo_slot_option_id" uuid REFERENCES "combo_slot_options"("id") ON DELETE SET NULL;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "refire_type" "refire_type";
CREATE INDEX IF NOT EXISTS "order_items_combo_slot_option_idx" ON "order_items" ("combo_slot_option_id");
--> statement-breakpoint

-- G7: reuse the existing organizations identity model and add inheritance scopes.
ALTER TABLE "menus" ADD COLUMN IF NOT EXISTS "organization_id" uuid REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "menus" ALTER COLUMN "tenant_id" DROP NOT NULL;
ALTER TABLE "menus" DROP CONSTRAINT IF EXISTS "menus_tenant_name_unique";
DROP INDEX IF EXISTS "menus_tenant_name_unique";
DROP INDEX IF EXISTS "menus_one_default_per_tenant";
CREATE UNIQUE INDEX IF NOT EXISTS "menus_tenant_name_unique" ON "menus" ("tenant_id", "name") WHERE "tenant_id" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "menus_organization_name_unique" ON "menus" ("organization_id", "name") WHERE "organization_id" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "menus_one_default_per_tenant" ON "menus" ("tenant_id") WHERE "is_default" = true AND "tenant_id" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "menus_one_default_per_organization" ON "menus" ("organization_id") WHERE "is_default" = true AND "organization_id" IS NOT NULL;
DO $$ BEGIN
  ALTER TABLE "menus" ADD CONSTRAINT "menus_exactly_one_owner_scope" CHECK (("tenant_id" IS NOT NULL) <> ("organization_id" IS NOT NULL));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Organization menus use stable tenant-local SKUs as inheritance keys, avoiding
-- illegal cross-tenant FKs to menu_items/categories.
CREATE TABLE IF NOT EXISTS "organization_menu_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "menu_id" uuid NOT NULL REFERENCES "menus"("id") ON DELETE CASCADE,
  "item_sku" varchar(50) NOT NULL,
  "category_name" varchar(100),
  "sort_order" integer NOT NULL DEFAULT 0,
  "created_at" timestamp DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "organization_menu_items_menu_sku_unique" ON "organization_menu_items" ("menu_id", "item_sku");

ALTER TABLE "price_rules" ADD COLUMN IF NOT EXISTS "organization_id" uuid REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "price_rules" ADD COLUMN IF NOT EXISTS "menu_item_sku" varchar(50);
ALTER TABLE "price_rules" ALTER COLUMN "tenant_id" DROP NOT NULL;
ALTER TABLE "price_rules" ALTER COLUMN "menu_item_id" DROP NOT NULL;
CREATE INDEX IF NOT EXISTS "price_rules_organization_sku_idx" ON "price_rules" ("organization_id", "menu_item_sku");
DO $$ BEGIN
  ALTER TABLE "price_rules" ADD CONSTRAINT "price_rules_exactly_one_owner_scope" CHECK (("tenant_id" IS NOT NULL) <> ("organization_id" IS NOT NULL));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

-- G8: explicit customer groups participate in the existing specificity engine.
CREATE TABLE IF NOT EXISTS "customer_groups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "name" varchar(150) NOT NULL,
  "discount_percent" numeric(5,2),
  "discount_fixed" numeric(10,2),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "customer_groups_discount_at_most_one" CHECK (NOT ("discount_percent" IS NOT NULL AND "discount_fixed" IS NOT NULL)),
  CONSTRAINT "customer_groups_discount_percent_valid" CHECK ("discount_percent" IS NULL OR ("discount_percent" > 0 AND "discount_percent" <= 100)),
  CONSTRAINT "customer_groups_discount_fixed_valid" CHECK ("discount_fixed" IS NULL OR "discount_fixed" >= 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS "customer_groups_tenant_name_unique" ON "customer_groups" ("tenant_id", "name");
ALTER TABLE "price_rules" ADD COLUMN IF NOT EXISTS "customer_group_id" uuid REFERENCES "customer_groups"("id") ON DELETE CASCADE;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "customer_group_id" uuid REFERENCES "customer_groups"("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "price_rules_customer_group_idx" ON "price_rules" ("customer_group_id");
CREATE INDEX IF NOT EXISTS "orders_customer_group_idx" ON "orders" ("customer_group_id");
--> statement-breakpoint

-- G9: explicit per-cover billing mode. Kitchen/inventory item lines are retained
-- but excluded from billing and the resolved cover rate is snapshotted.
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "billing_mode" "billing_mode" NOT NULL DEFAULT 'LINE_ITEMS';
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "cover_count" integer;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "per_cover_price_rule_id" uuid REFERENCES "price_rules"("id") ON DELETE SET NULL;
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "per_cover_rate" numeric(10,2);
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "billing_excluded" boolean NOT NULL DEFAULT false;
ALTER TABLE "price_rules" ADD COLUMN IF NOT EXISTS "cover_tier" "cover_tier";
ALTER TABLE "price_rules" ADD COLUMN IF NOT EXISTS "is_per_cover" boolean NOT NULL DEFAULT false;
DO $$ BEGIN
  ALTER TABLE "orders" ADD CONSTRAINT "orders_per_cover_fields_valid" CHECK (
    ("billing_mode" = 'LINE_ITEMS' AND "cover_count" IS NULL AND "per_cover_rate" IS NULL)
    OR ("billing_mode" = 'PER_COVER' AND "cover_count" > 0 AND "per_cover_price_rule_id" IS NOT NULL AND "per_cover_rate" IS NOT NULL)
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Replace the original A5 scope check with the expanded G7/G8/G9 dimensions.
ALTER TABLE "price_rules" DROP CONSTRAINT IF EXISTS "price_rules_scope_required";
ALTER TABLE "price_rules" ADD CONSTRAINT "price_rules_scope_required" CHECK (
  "variant_id" IS NOT NULL OR "branch_id" IS NOT NULL OR "channel" IS NOT NULL OR
  "fulfillment_type" IS NOT NULL OR "start_date" IS NOT NULL OR "end_date" IS NOT NULL OR
  "start_time" IS NOT NULL OR "end_time" IS NOT NULL OR "customer_group_id" IS NOT NULL OR
  "cover_tier" IS NOT NULL OR "organization_id" IS NOT NULL OR "is_per_cover" = true
);

-- Per-cover rules have no menu item. Normal tenant/org item rules must target an
-- item ID or stable SKU respectively.
DO $$ BEGIN
  ALTER TABLE "price_rules" ADD CONSTRAINT "price_rules_target_valid" CHECK (
    ("is_per_cover" = true AND "menu_item_id" IS NULL AND "menu_item_sku" IS NULL AND "price" IS NOT NULL AND "percent_off" IS NULL)
    OR ("is_per_cover" = false AND (("tenant_id" IS NOT NULL AND "menu_item_id" IS NOT NULL) OR ("organization_id" IS NOT NULL AND "menu_item_sku" IS NOT NULL)))
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint

-- G7 authorization boundary. Seed the organization permission onto roles that
-- already manage tenants; global OWNER still bypasses permission checks through
-- the existing auth guard.
INSERT INTO "permissions" ("key", "module", "description") VALUES
  ('organization:manage', 'organization', 'Manage organization-scoped menus, prices, and member tenants')
ON CONFLICT ("key") DO UPDATE SET "module" = EXCLUDED."module", "description" = EXCLUDED."description";
--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT existing."role_id", org_manage."id"
FROM "role_permissions" existing
JOIN "permissions" tenant_update ON tenant_update."id" = existing."permission_id"
CROSS JOIN "permissions" org_manage
WHERE tenant_update."key" IN ('tenant:update','organization:update')
  AND org_manage."key" = 'organization:manage'
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
