-- E2: prepared components / sub-recipes, including depth-limited nesting.
CREATE TABLE "sub_recipes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "name" varchar(200) NOT NULL,
  "yield_quantity" numeric(12,3) DEFAULT '1' NOT NULL,
  "yield_unit" "inventory_unit" NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sub_recipe_ingredients" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "sub_recipe_id" uuid NOT NULL,
  "inventory_item_id" uuid,
  "ingredient_sub_recipe_id" uuid,
  "quantity_required" numeric(12,3) NOT NULL,
  "unit" "inventory_unit" NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "sub_recipe_ingredients_source_check"
    CHECK ((("inventory_item_id" IS NOT NULL)::int + ("ingredient_sub_recipe_id" IS NOT NULL)::int) = 1)
);
--> statement-breakpoint
ALTER TABLE "sub_recipes" ADD CONSTRAINT "sub_recipes_tenant_id_tenants_id_fk"
  FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "sub_recipe_ingredients" ADD CONSTRAINT "sub_recipe_ingredients_sub_recipe_id_sub_recipes_id_fk"
  FOREIGN KEY ("sub_recipe_id") REFERENCES "public"."sub_recipes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "sub_recipe_ingredients" ADD CONSTRAINT "sub_recipe_ingredients_inventory_item_id_inventory_items_id_fk"
  FOREIGN KEY ("inventory_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "sub_recipe_ingredients" ADD CONSTRAINT "sub_recipe_ingredients_ingredient_sub_recipe_id_sub_recipes_id_fk"
  FOREIGN KEY ("ingredient_sub_recipe_id") REFERENCES "public"."sub_recipes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "sub_recipes_tenant_idx" ON "sub_recipes" USING btree ("tenant_id");
CREATE INDEX "sub_recipe_ingredients_parent_idx" ON "sub_recipe_ingredients" USING btree ("sub_recipe_id");
CREATE INDEX "sub_recipe_ingredients_inventory_idx" ON "sub_recipe_ingredients" USING btree ("inventory_item_id");
CREATE INDEX "sub_recipe_ingredients_nested_idx" ON "sub_recipe_ingredients" USING btree ("ingredient_sub_recipe_id");
--> statement-breakpoint
ALTER TABLE "recipes" ALTER COLUMN "inventory_item_id" DROP NOT NULL;
ALTER TABLE "recipes" ADD COLUMN "sub_recipe_id" uuid;
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_sub_recipe_id_sub_recipes_id_fk"
  FOREIGN KEY ("sub_recipe_id") REFERENCES "public"."sub_recipes"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_source_check"
  CHECK ((("inventory_item_id" IS NOT NULL)::int + ("sub_recipe_id" IS NOT NULL)::int) = 1);
CREATE INDEX "recipes_sub_recipe_idx" ON "recipes" USING btree ("sub_recipe_id");
