-- Canonical pre-v1 table migration.

CREATE TABLE "menu_item_modifier_groups" (
  "menu_item_id" uuid NOT NULL,
  "modifier_group_id" uuid NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "menu_item_modifier_groups_pk" PRIMARY KEY ("menu_item_id", "modifier_group_id"),
  CONSTRAINT "menu_item_modifier_groups_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE,
  CONSTRAINT "menu_item_modifier_groups_modifier_group_id_modifier_groups_id_fk" FOREIGN KEY ("modifier_group_id") REFERENCES "modifier_groups"("id") ON DELETE CASCADE
);
--> statement-breakpoint
