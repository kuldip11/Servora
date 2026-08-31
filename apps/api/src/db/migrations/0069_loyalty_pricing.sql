CREATE TABLE IF NOT EXISTS "customer_loyalty_tiers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "name" varchar(120) NOT NULL,
  "discount_percent" numeric(5,2),
  "discount_fixed" numeric(10,2),
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "customer_loyalty_tiers_discount_exactly_one" CHECK (
    ("discount_percent" IS NOT NULL AND "discount_fixed" IS NULL AND "discount_percent" > 0 AND "discount_percent" <= 100) OR
    ("discount_percent" IS NULL AND "discount_fixed" IS NOT NULL AND "discount_fixed" > 0)
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS "customer_loyalty_tiers_tenant_name_unique" ON "customer_loyalty_tiers" ("tenant_id", "name");

CREATE TABLE IF NOT EXISTS "customers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "name" varchar(200) NOT NULL,
  "email" varchar(320),
  "phone" varchar(40),
  "loyalty_tier_id" uuid REFERENCES "customer_loyalty_tiers"("id") ON DELETE SET NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "customers_tenant_idx" ON "customers" ("tenant_id");

ALTER TABLE "promotions"
  ADD COLUMN IF NOT EXISTS "stackable_with_loyalty" boolean NOT NULL DEFAULT true;
