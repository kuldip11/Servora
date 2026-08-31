-- Canonical pre-v1 table migration.

CREATE TABLE "sub_recipes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "branch_id" uuid NOT NULL,
  "name" varchar(200) NOT NULL,
  "yield_quantity" numeric(12, 3) DEFAULT '1' NOT NULL,
  "yield_unit" "inventory_unit" NOT NULL,
  "yield_percent" numeric(5, 2),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "sub_recipes_yield_percent_check" CHECK ("yield_percent" is null or ("yield_percent" > 0 and "yield_percent" <= 100)),
  CONSTRAINT "sub_recipes_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "sub_recipes_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX "sub_recipes_tenant_idx" ON "sub_recipes" USING btree ("tenant_id");
--> statement-breakpoint
CREATE INDEX "sub_recipes_tenant_branch_idx" ON "sub_recipes" USING btree ("tenant_id", "branch_id");
--> statement-breakpoint
