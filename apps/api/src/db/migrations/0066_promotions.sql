DO $$ BEGIN
  CREATE TYPE "promotion_rule_type" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "promotion_scope" AS ENUM ('ORDER', 'CATEGORY', 'ITEM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TYPE "menu_change_entity_type" ADD VALUE IF NOT EXISTS 'PROMOTION';

CREATE TABLE IF NOT EXISTS "promotions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "name" varchar(200) NOT NULL,
  "rule_type" "promotion_rule_type" NOT NULL,
  "scope" "promotion_scope" NOT NULL DEFAULT 'ORDER',
  "scope_category_id" uuid REFERENCES "menu_categories"("id") ON DELETE CASCADE,
  "scope_menu_item_id" uuid REFERENCES "menu_items"("id") ON DELETE CASCADE,
  "value" numeric(10,2) NOT NULL,
  "coupon_code" varchar(50),
  "start_date" date,
  "end_date" date,
  "start_time" time,
  "end_time" time,
  "max_uses_total" integer,
  "max_uses_per_customer" integer,
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "promotions_scope_target" CHECK (
    ("scope" = 'ORDER' AND "scope_category_id" IS NULL AND "scope_menu_item_id" IS NULL) OR
    ("scope" = 'CATEGORY' AND "scope_category_id" IS NOT NULL AND "scope_menu_item_id" IS NULL) OR
    ("scope" = 'ITEM' AND "scope_menu_item_id" IS NOT NULL AND "scope_category_id" IS NULL)
  ),
  CONSTRAINT "promotions_value_valid" CHECK (
    ("rule_type" = 'PERCENTAGE' AND "value" > 0 AND "value" <= 100) OR
    ("rule_type" = 'FIXED_AMOUNT' AND "value" > 0)
  )
);
CREATE INDEX IF NOT EXISTS "promotions_tenant_active_idx" ON "promotions" ("tenant_id", "is_active");
CREATE UNIQUE INDEX IF NOT EXISTS "promotions_tenant_coupon_unique" ON "promotions" ("tenant_id", "coupon_code");

CREATE TABLE IF NOT EXISTS "promotion_redemptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "promotion_id" uuid NOT NULL REFERENCES "promotions"("id") ON DELETE RESTRICT,
  "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "customer_id" uuid,
  "discount_amount" numeric(10,2) NOT NULL,
  "redeemed_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "promotion_redemptions_promotion_idx" ON "promotion_redemptions" ("promotion_id", "redeemed_at");
CREATE INDEX IF NOT EXISTS "promotion_redemptions_customer_idx" ON "promotion_redemptions" ("promotion_id", "customer_id");
CREATE UNIQUE INDEX IF NOT EXISTS "promotion_redemptions_promotion_order_unique" ON "promotion_redemptions" ("promotion_id", "order_id");
