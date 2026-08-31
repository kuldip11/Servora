

CREATE TABLE "inventory_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "branch_id" uuid NOT NULL,
  "name" varchar(200) NOT NULL,
  "unit" "inventory_unit" NOT NULL,
  "current_stock" numeric(12, 3) DEFAULT '0' NOT NULL,
  "minimum_stock" numeric(12, 3) DEFAULT '0' NOT NULL,
  "reorder_point" numeric(12, 3) DEFAULT '0' NOT NULL,
  "cost_per_unit" numeric(10, 2) DEFAULT '0' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "deleted_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "inventory_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "inventory_items_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE,
  CONSTRAINT "inventory_items_branch_tenant_fk" FOREIGN KEY ("branch_id", "tenant_id") REFERENCES "branches"("id", "tenant_id") ON DELETE CASCADE
);

CREATE INDEX "inventory_tenant_branch_idx" ON "inventory_items" USING btree ("tenant_id", "branch_id");

