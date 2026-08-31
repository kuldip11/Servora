-- E1: variant/modifier-scoped recipe consumption.
ALTER TABLE "recipes" ADD COLUMN "variant_id" uuid;
ALTER TABLE "recipes" ADD COLUMN "modifier_option_id" uuid;
--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_variant_id_menu_item_variants_id_fk"
  FOREIGN KEY ("variant_id") REFERENCES "public"."menu_item_variants"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_modifier_option_id_modifier_options_id_fk"
  FOREIGN KEY ("modifier_option_id") REFERENCES "public"."modifier_options"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_scope_check"
  CHECK (NOT ("variant_id" IS NOT NULL AND "modifier_option_id" IS NOT NULL));
--> statement-breakpoint
CREATE INDEX "recipes_variant_idx" ON "recipes" USING btree ("variant_id");
CREATE INDEX "recipes_modifier_option_idx" ON "recipes" USING btree ("modifier_option_id");
--> statement-breakpoint
DROP INDEX IF EXISTS "recipes_menu_item_inventory_item_unique";
