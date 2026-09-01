

CREATE TABLE "menu_item_tags" (
  "menu_item_id" uuid NOT NULL,
  "tag_id" uuid NOT NULL,
  CONSTRAINT "menu_item_tags_pk" PRIMARY KEY ("menu_item_id", "tag_id"),
  CONSTRAINT "menu_item_tags_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE,
  CONSTRAINT "menu_item_tags_tag_id_menu_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "menu_tags"("id") ON DELETE CASCADE
);

