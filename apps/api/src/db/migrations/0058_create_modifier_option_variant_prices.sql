-- Canonical pre-v1 table migration.

CREATE TABLE "modifier_option_variant_prices" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "modifier_option_id" uuid NOT NULL,
  "variant_id" uuid NOT NULL,
  "additional_price" numeric(10, 2) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "modifier_option_variant_prices_modifier_option_id_modifier_options_id_fk" FOREIGN KEY ("modifier_option_id") REFERENCES "modifier_options"("id") ON DELETE CASCADE,
  CONSTRAINT "modifier_option_variant_prices_variant_id_menu_item_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "menu_item_variants"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX "modifier_option_variant_prices_option_variant_unique" ON "modifier_option_variant_prices" USING btree ("modifier_option_id", "variant_id");
--> statement-breakpoint
CREATE INDEX "modifier_option_variant_prices_variant_idx" ON "modifier_option_variant_prices" USING btree ("variant_id");
--> statement-breakpoint
