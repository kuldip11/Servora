-- Canonical pre-v1 table migration.

CREATE TABLE "menu_item_branch_overrides" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "menu_item_id" uuid NOT NULL,
  "branch_id" uuid NOT NULL,
  "price" numeric(10, 2),
  "tax_rate" numeric(5, 2),
  "prep_time_minutes" integer,
  "status" "menu_item_status",
  "is_hidden" boolean DEFAULT false NOT NULL,
  "availability_reason" varchar(500),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "menu_item_branch_overrides_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "menu_item_branch_overrides_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE,
  CONSTRAINT "menu_item_branch_overrides_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE,
  CONSTRAINT "menu_item_branch_overrides_branch_tenant_fk" FOREIGN KEY ("branch_id", "tenant_id") REFERENCES "branches"("id", "tenant_id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX "menu_item_branch_overrides_branch_idx" ON "menu_item_branch_overrides" USING btree ("tenant_id", "branch_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "menu_item_branch_overrides_item_branch_unique" ON "menu_item_branch_overrides" USING btree ("menu_item_id", "branch_id");
--> statement-breakpoint
