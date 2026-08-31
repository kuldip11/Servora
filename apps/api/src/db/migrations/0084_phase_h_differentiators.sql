-- Phase H is additive and opt-in. Existing tenant-scoped loyalty and void/comp
-- behavior remains unchanged until organization tiers or thresholds are created.
ALTER TABLE "customer_loyalty_tiers" ADD COLUMN IF NOT EXISTS "organization_id" uuid REFERENCES "organizations"("id") ON DELETE CASCADE;
ALTER TABLE "customers" ADD COLUMN IF NOT EXISTS "organization_customer_id" uuid;
ALTER TABLE "customer_loyalty_tiers" ALTER COLUMN "tenant_id" DROP NOT NULL;
DO $$ BEGIN ALTER TABLE "customer_loyalty_tiers" ADD CONSTRAINT "customer_loyalty_tiers_scope_exactly_one" CHECK (("tenant_id" IS NULL) <> ("organization_id" IS NULL)); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "customer_loyalty_tiers_organization_name_unique" ON "customer_loyalty_tiers" ("organization_id", "name") WHERE "organization_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "customers_organization_customer_idx" ON "customers" ("organization_customer_id") WHERE "organization_customer_id" IS NOT NULL;

DO $$ BEGIN CREATE TYPE "void_comp_action" AS ENUM ('VOID', 'COMP'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE TABLE IF NOT EXISTS "void_comp_approval_thresholds" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "action_type" "void_comp_action" NOT NULL, "threshold_amount" numeric(12,2) NOT NULL CHECK ("threshold_amount" >= 0),
  "requires_role" varchar(50) NOT NULL DEFAULT 'Manager', "created_at" timestamp NOT NULL DEFAULT now(), "updated_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "void_comp_threshold_tenant_action_unique" UNIQUE ("tenant_id", "action_type")
);
CREATE TABLE IF NOT EXISTS "manager_approval_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "approved_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE, "action_type" "void_comp_action" NOT NULL,
  "order_id" uuid NOT NULL, "order_item_id" uuid NOT NULL, "expires_at" timestamp NOT NULL, "used_at" timestamp, "created_at" timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "manager_approval_tokens_lookup_idx" ON "manager_approval_tokens" ("tenant_id", "order_id", "order_item_id", "action_type");
