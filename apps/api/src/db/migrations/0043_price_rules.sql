CREATE TABLE "price_rules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "menu_item_id" uuid NOT NULL,
  "variant_id" uuid,
  "branch_id" uuid,
  "channel" "order_source",
  "fulfillment_type" "order_type",
  "start_date" date,
  "end_date" date,
  "start_time" time,
  "end_time" time,
  "price" numeric(10,2) NOT NULL,
  "tax_rate" numeric(5,2),
  "priority" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "price_rules_scope_required" CHECK (
    "variant_id" IS NOT NULL OR "branch_id" IS NOT NULL OR
    "channel" IS NOT NULL OR "fulfillment_type" IS NOT NULL OR
    "start_date" IS NOT NULL OR "end_date" IS NOT NULL OR
    "start_time" IS NOT NULL OR "end_time" IS NOT NULL
  ),
  CONSTRAINT "price_rules_date_range_valid" CHECK (
    "start_date" IS NULL OR "end_date" IS NULL OR "start_date" <= "end_date"
  )
);
ALTER TABLE "price_rules" ADD CONSTRAINT "price_rules_tenant_id_tenants_id_fk"
  FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
ALTER TABLE "price_rules" ADD CONSTRAINT "price_rules_menu_item_id_menu_items_id_fk"
  FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE CASCADE;
ALTER TABLE "price_rules" ADD CONSTRAINT "price_rules_variant_id_menu_item_variants_id_fk"
  FOREIGN KEY ("variant_id") REFERENCES "public"."menu_item_variants"("id") ON DELETE CASCADE;
ALTER TABLE "price_rules" ADD CONSTRAINT "price_rules_branch_id_branches_id_fk"
  FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE CASCADE;
CREATE INDEX "price_rules_lookup_idx"
  ON "price_rules" USING btree ("tenant_id", "menu_item_id", "branch_id", "channel");
