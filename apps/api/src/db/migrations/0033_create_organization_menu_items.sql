

CREATE TABLE "organization_menu_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "menu_id" uuid NOT NULL,
  "item_sku" varchar(50) NOT NULL,
  "category_name" varchar(100),
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "organization_menu_items_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "organization_menu_items_menu_sku_unique" ON "organization_menu_items" USING btree ("menu_id", "item_sku");

