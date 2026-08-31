-- Phase E final schema. Fresh pre-production databases apply the final
-- recipe constraints/indexes directly; there is no backfill or activation step.
ALTER TYPE "menu_change_entity_type" ADD VALUE IF NOT EXISTS 'SUB_RECIPE';
--> statement-breakpoint
DROP INDEX IF EXISTS "recipes_menu_item_inventory_item_unique";
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "recipes_base_inventory_unique"
  ON "recipes" ("menu_item_id", "inventory_item_id")
  WHERE "inventory_item_id" IS NOT NULL AND "variant_id" IS NULL AND "modifier_option_id" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "recipes_base_sub_recipe_unique"
  ON "recipes" ("menu_item_id", "sub_recipe_id")
  WHERE "sub_recipe_id" IS NOT NULL AND "variant_id" IS NULL AND "modifier_option_id" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "recipes_variant_inventory_unique"
  ON "recipes" ("menu_item_id", "variant_id", "inventory_item_id")
  WHERE "variant_id" IS NOT NULL AND "inventory_item_id" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "recipes_variant_sub_recipe_unique"
  ON "recipes" ("menu_item_id", "variant_id", "sub_recipe_id")
  WHERE "variant_id" IS NOT NULL AND "sub_recipe_id" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "recipes_modifier_inventory_unique"
  ON "recipes" ("menu_item_id", "modifier_option_id", "inventory_item_id")
  WHERE "modifier_option_id" IS NOT NULL AND "inventory_item_id" IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "recipes_modifier_sub_recipe_unique"
  ON "recipes" ("menu_item_id", "modifier_option_id", "sub_recipe_id")
  WHERE "modifier_option_id" IS NOT NULL AND "sub_recipe_id" IS NOT NULL;
