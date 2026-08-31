-- Canonical pre-v1 table migration.

CREATE TABLE "menu_memberships" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "menu_id" uuid NOT NULL,
  "menu_item_id" uuid NOT NULL,
  "category_id" uuid NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "menu_memberships_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE,
  CONSTRAINT "menu_memberships_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE,
  CONSTRAINT "menu_memberships_category_id_menu_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "menu_categories"("id")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "menu_memberships_menu_item_unique" ON "menu_memberships" USING btree ("menu_id", "menu_item_id");
--> statement-breakpoint
CREATE INDEX "menu_memberships_category_order_idx" ON "menu_memberships" USING btree ("menu_id", "category_id", "sort_order");
--> statement-breakpoint
CREATE INDEX "menu_memberships_item_idx" ON "menu_memberships" USING btree ("menu_item_id");
--> statement-breakpoint
