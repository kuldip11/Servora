-- Canonical pre-v1 table migration.

CREATE TABLE "price_rules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid,
  "organization_id" uuid,
  "menu_item_id" uuid,
  "menu_item_sku" varchar(50),
  "variant_id" uuid,
  "branch_id" uuid,
  "channel" "order_source",
  "fulfillment_type" "order_type",
  "customer_group_id" uuid,
  "cover_tier" "cover_tier",
  "is_per_cover" boolean DEFAULT false NOT NULL,
  "start_date" date,
  "end_date" date,
  "start_time" time,
  "end_time" time,
  "price" numeric(10, 2),
  "percent_off" numeric(5, 2),
  "tax_rate" numeric(5, 2),
  "priority" integer DEFAULT 0 NOT NULL,
  "effective_from" timestamp,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "price_rules_exactly_one_owner_scope" CHECK (("tenant_id" IS NOT NULL) <> ("organization_id" IS NOT NULL)),
  CONSTRAINT "price_rules_scope_required" CHECK ("variant_id" IS NOT NULL OR "branch_id" IS NOT NULL OR "channel" IS NOT NULL OR "fulfillment_type" IS NOT NULL OR "start_date" IS NOT NULL OR "end_date" IS NOT NULL OR "start_time" IS NOT NULL OR "end_time" IS NOT NULL OR "customer_group_id" IS NOT NULL OR "cover_tier" IS NOT NULL OR "organization_id" IS NOT NULL OR "is_per_cover" = true),
  CONSTRAINT "price_rules_date_range_valid" CHECK ("start_date" IS NULL OR "end_date" IS NULL OR "start_date" <= "end_date"),
  CONSTRAINT "price_rules_value_exactly_one" CHECK (("price" IS NOT NULL AND "percent_off" IS NULL) OR ("price" IS NULL AND "percent_off" IS NOT NULL AND "percent_off" > 0 AND "percent_off" <= 100)),
  CONSTRAINT "price_rules_target_valid" CHECK (("is_per_cover" = true AND "menu_item_id" IS NULL AND "menu_item_sku" IS NULL AND "price" IS NOT NULL AND "percent_off" IS NULL) OR ("is_per_cover" = false AND (("tenant_id" IS NOT NULL AND "menu_item_id" IS NOT NULL) OR ("organization_id" IS NOT NULL AND "menu_item_sku" IS NOT NULL)))),
  CONSTRAINT "price_rules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "price_rules_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
  CONSTRAINT "price_rules_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE,
  CONSTRAINT "price_rules_variant_id_menu_item_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "menu_item_variants"("id") ON DELETE CASCADE,
  CONSTRAINT "price_rules_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE,
  CONSTRAINT "price_rules_customer_group_id_customer_groups_id_fk" FOREIGN KEY ("customer_group_id") REFERENCES "customer_groups"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX "price_rules_lookup_idx" ON "price_rules" USING btree ("tenant_id", "menu_item_id", "branch_id", "channel");
--> statement-breakpoint
CREATE INDEX "price_rules_organization_sku_idx" ON "price_rules" USING btree ("organization_id", "menu_item_sku");
--> statement-breakpoint
CREATE INDEX "price_rules_customer_group_idx" ON "price_rules" USING btree ("customer_group_id");
--> statement-breakpoint
