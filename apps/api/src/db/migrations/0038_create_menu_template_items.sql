-- Canonical pre-v1 table migration.

CREATE TABLE "menu_template_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "template_id" uuid NOT NULL,
  "name" varchar(200) NOT NULL,
  "description" text,
  "base_price" numeric(10, 2) DEFAULT '0' NOT NULL,
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
  "food_type" "food_type" DEFAULT 'VEG' NOT NULL,
  "spice_level" "spice_level",
  "prep_time_minutes" integer,
  "hsn_code" varchar(20),
  "sort_order" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "menu_template_items_template_id_menu_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "menu_templates"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX "menu_template_items_template_idx" ON "menu_template_items" USING btree ("template_id");
--> statement-breakpoint
