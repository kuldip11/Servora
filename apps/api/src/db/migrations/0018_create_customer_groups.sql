-- Canonical pre-v1 table migration.

CREATE TABLE "customer_groups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "name" varchar(150) NOT NULL,
  "discount_percent" numeric(5, 2),
  "discount_fixed" numeric(10, 2),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "customer_groups_discount_at_most_one" CHECK (NOT ("discount_percent" IS NOT NULL AND "discount_fixed" IS NOT NULL)),
  CONSTRAINT "customer_groups_discount_percent_valid" CHECK ("discount_percent" IS NULL OR ("discount_percent" > 0 AND "discount_percent" <= 100)),
  CONSTRAINT "customer_groups_discount_fixed_valid" CHECK ("discount_fixed" IS NULL OR "discount_fixed" >= 0),
  CONSTRAINT "customer_groups_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX "customer_groups_tenant_name_unique" ON "customer_groups" USING btree ("tenant_id", "name");
--> statement-breakpoint
CREATE INDEX "customer_groups_tenant_idx" ON "customer_groups" USING btree ("tenant_id");
--> statement-breakpoint
