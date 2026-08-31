

CREATE TABLE "menu_item_allergens" (
  "menu_item_id" uuid NOT NULL,
  "allergen_id" uuid NOT NULL,
  CONSTRAINT "menu_item_allergens_pk" PRIMARY KEY ("menu_item_id", "allergen_id"),
  CONSTRAINT "menu_item_allergens_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE,
  CONSTRAINT "menu_item_allergens_allergen_id_menu_allergens_id_fk" FOREIGN KEY ("allergen_id") REFERENCES "menu_allergens"("id") ON DELETE CASCADE
);

