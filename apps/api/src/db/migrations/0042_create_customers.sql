-- Canonical pre-v1 table migration.

CREATE TABLE "customers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "name" varchar(200) NOT NULL,
  "email" varchar(320),
  "phone" varchar(40),
  "organization_customer_id" uuid,
  "loyalty_tier_id" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "customers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "customers_loyalty_tier_id_customer_loyalty_tiers_id_fk" FOREIGN KEY ("loyalty_tier_id") REFERENCES "customer_loyalty_tiers"("id") ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX "customers_tenant_idx" ON "customers" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX "customers_organization_customer_idx" ON "customers" USING btree ("organization_customer_id") WHERE "organization_customer_id" IS NOT NULL;
--> statement-breakpoint
