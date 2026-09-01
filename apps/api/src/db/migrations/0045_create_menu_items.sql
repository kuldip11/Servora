

CREATE TABLE "menu_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "branch_id" uuid,
  "category_id" uuid NOT NULL,
  "name" varchar(200) NOT NULL,
  "description" text,
  "base_price" numeric(10, 2) DEFAULT '0' NOT NULL,
  "manual_cost" numeric(10, 2),
  "pricing_mode" "pricing_mode" DEFAULT 'FIXED' NOT NULL,
  "weight_unit" "weight_unit",
  "open_price_min" numeric(10, 2),
  "open_price_max" numeric(10, 2),
  "supports_zones" boolean DEFAULT false NOT NULL,
  "zone_pricing_rule" "zone_pricing_rule" DEFAULT 'HIGHER' NOT NULL,
  "manual_stock_count" integer,
  "manual_stock_count_updated_at" timestamp,
  "tax_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
  "tax_mode" "tax_mode",
  "image_url" varchar(500),
  "food_type" "food_type" DEFAULT 'VEG' NOT NULL,
  "spice_level" "spice_level",
  "sku" varchar(50),
  "prep_time_minutes" integer,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "hsn_code" varchar(20),
  "status" "menu_item_status" DEFAULT 'ACTIVE' NOT NULL,
  "availability_reason" varchar(500),
  "status_changed_at" timestamp DEFAULT now() NOT NULL,
  "manual_override_status" "menu_item_status",
  "manual_override_reason" varchar(500),
  "manual_override_set_by" uuid,
  "manual_override_set_at" timestamp,
  "enable_recipe_deduction" boolean DEFAULT true NOT NULL,
  "display_mode" "menu_item_display_mode" DEFAULT 'STANDARD' NOT NULL,
  "effective_from" timestamp,
  "is_published" boolean DEFAULT true NOT NULL,
  "published_at" timestamp,
  "deleted_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "menu_items_open_price_band_valid" CHECK ("open_price_min" IS NULL OR "open_price_max" IS NULL OR "open_price_min" <= "open_price_max"),
  CONSTRAINT "menu_items_manual_stock_count_nonnegative" CHECK ("manual_stock_count" IS NULL OR "manual_stock_count" >= 0),
  CONSTRAINT "menu_items_manual_cost_nonnegative" CHECK ("manual_cost" IS NULL OR "manual_cost" >= 0),
  CONSTRAINT "menu_items_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "menu_items_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches"("id"),
  CONSTRAINT "menu_items_category_id_menu_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "menu_categories"("id") ON DELETE CASCADE,
  CONSTRAINT "menu_items_manual_override_set_by_users_id_fk" FOREIGN KEY ("manual_override_set_by") REFERENCES "users"("id") ON DELETE SET NULL
);

CREATE INDEX "menu_items_tenant_idx" ON "menu_items" USING btree ("tenant_id");

CREATE INDEX "menu_items_category_idx" ON "menu_items" USING btree ("category_id");

CREATE INDEX "menu_items_status_idx" ON "menu_items" USING btree ("tenant_id", "branch_id", "status");

CREATE INDEX "menu_items_manual_stock_count_idx" ON "menu_items" USING btree ("tenant_id", "manual_stock_count") WHERE "manual_stock_count" IS NOT NULL;

