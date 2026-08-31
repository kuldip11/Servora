

CREATE TABLE "recipes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "menu_item_id" uuid NOT NULL,
  "inventory_item_id" uuid,
  "sub_recipe_id" uuid,
  "variant_id" uuid,
  "modifier_option_id" uuid,
  "quantity_required" numeric(12, 3) NOT NULL,
  "unit" "inventory_unit" NOT NULL,
  "yield_percent" numeric(5, 2),
  "is_optional" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "recipes_source_check" CHECK ((("inventory_item_id" is not null)::int + ("sub_recipe_id" is not null)::int) = 1),
  CONSTRAINT "recipes_scope_check" CHECK (not ("variant_id" is not null and "modifier_option_id" is not null)),
  CONSTRAINT "recipes_yield_percent_check" CHECK ("yield_percent" is null or ("yield_percent" > 0 and "yield_percent" <= 100)),
  CONSTRAINT "recipes_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE,
  CONSTRAINT "recipes_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE,
  CONSTRAINT "recipes_sub_recipe_id_sub_recipes_id_fk" FOREIGN KEY ("sub_recipe_id") REFERENCES "sub_recipes"("id") ON DELETE CASCADE,
  CONSTRAINT "recipes_variant_id_menu_item_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "menu_item_variants"("id") ON DELETE CASCADE,
  CONSTRAINT "recipes_modifier_option_id_modifier_options_id_fk" FOREIGN KEY ("modifier_option_id") REFERENCES "modifier_options"("id") ON DELETE CASCADE
);

CREATE INDEX "recipes_menu_item_idx" ON "recipes" USING btree ("menu_item_id");

CREATE INDEX "recipes_inventory_item_idx" ON "recipes" USING btree ("inventory_item_id");

CREATE INDEX "recipes_sub_recipe_idx" ON "recipes" USING btree ("sub_recipe_id");

CREATE INDEX "recipes_variant_idx" ON "recipes" USING btree ("variant_id");

CREATE INDEX "recipes_modifier_option_idx" ON "recipes" USING btree ("modifier_option_id");

CREATE UNIQUE INDEX "recipes_base_inventory_unique" ON "recipes" USING btree ("menu_item_id", "inventory_item_id") WHERE "inventory_item_id" is not null and "variant_id" is null and "modifier_option_id" is null;

CREATE UNIQUE INDEX "recipes_base_sub_recipe_unique" ON "recipes" USING btree ("menu_item_id", "sub_recipe_id") WHERE "sub_recipe_id" is not null and "variant_id" is null and "modifier_option_id" is null;

CREATE UNIQUE INDEX "recipes_variant_inventory_unique" ON "recipes" USING btree ("menu_item_id", "variant_id", "inventory_item_id") WHERE "variant_id" is not null and "inventory_item_id" is not null;

CREATE UNIQUE INDEX "recipes_variant_sub_recipe_unique" ON "recipes" USING btree ("menu_item_id", "variant_id", "sub_recipe_id") WHERE "variant_id" is not null and "sub_recipe_id" is not null;

CREATE UNIQUE INDEX "recipes_modifier_inventory_unique" ON "recipes" USING btree ("menu_item_id", "modifier_option_id", "inventory_item_id") WHERE "modifier_option_id" is not null and "inventory_item_id" is not null;

CREATE UNIQUE INDEX "recipes_modifier_sub_recipe_unique" ON "recipes" USING btree ("menu_item_id", "modifier_option_id", "sub_recipe_id") WHERE "modifier_option_id" is not null and "sub_recipe_id" is not null;

