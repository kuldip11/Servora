-- Canonical pre-v1 table migration.

CREATE TABLE "customer_loyalty_tiers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid,
  "organization_id" uuid,
  "name" varchar(120) NOT NULL,
  "discount_percent" numeric(5, 2),
  "discount_fixed" numeric(10, 2),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "customer_loyalty_tiers_scope_exactly_one" CHECK (("tenant_id" IS NULL) <> ("organization_id" IS NULL)),
  CONSTRAINT "customer_loyalty_tiers_discount_exactly_one" CHECK (("discount_percent" IS NOT NULL AND "discount_fixed" IS NULL AND "discount_percent" > 0 AND "discount_percent" <= 100) OR ("discount_percent" IS NULL AND "discount_fixed" IS NOT NULL AND "discount_fixed" > 0)),
  CONSTRAINT "customer_loyalty_tiers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "customer_loyalty_tiers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX "customer_loyalty_tiers_tenant_name_unique" ON "customer_loyalty_tiers" USING btree ("tenant_id", "name");
--> statement-breakpoint
CREATE UNIQUE INDEX "customer_loyalty_tiers_organization_name_unique" ON "customer_loyalty_tiers" USING btree ("organization_id", "name") WHERE "organization_id" IS NOT NULL;
--> statement-breakpoint
