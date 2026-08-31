-- Canonical pre-v1 table migration.

CREATE TABLE "sub_recipe_ingredients" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "sub_recipe_id" uuid NOT NULL,
  "inventory_item_id" uuid,
  "ingredient_sub_recipe_id" uuid,
  "quantity_required" numeric(12, 3) NOT NULL,
  "unit" "inventory_unit" NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "sub_recipe_ingredients_source_check" CHECK ((("inventory_item_id" is not null)::int + ("ingredient_sub_recipe_id" is not null)::int) = 1),
  CONSTRAINT "sub_recipe_ingredients_sub_recipe_id_sub_recipes_id_fk" FOREIGN KEY ("sub_recipe_id") REFERENCES "sub_recipes"("id") ON DELETE CASCADE,
  CONSTRAINT "sub_recipe_ingredients_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE,
  CONSTRAINT "sub_recipe_ingredients_ingredient_sub_recipe_id_sub_recipes_id_fk" FOREIGN KEY ("ingredient_sub_recipe_id") REFERENCES "sub_recipes"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX "sub_recipe_ingredients_parent_idx" ON "sub_recipe_ingredients" USING btree ("sub_recipe_id");
--> statement-breakpoint
CREATE INDEX "sub_recipe_ingredients_inventory_idx" ON "sub_recipe_ingredients" USING btree ("inventory_item_id");
--> statement-breakpoint
CREATE INDEX "sub_recipe_ingredients_nested_idx" ON "sub_recipe_ingredients" USING btree ("ingredient_sub_recipe_id");
--> statement-breakpoint
