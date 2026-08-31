

CREATE TABLE "order_item_modifiers" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_item_id" uuid NOT NULL,
  "modifier_id" uuid,
  "modifier_group_name" varchar(100),
  "name" varchar(100) NOT NULL,
  "price" numeric(10, 2) DEFAULT '0' NOT NULL,
  "quantity" integer DEFAULT 1 NOT NULL,
  "zone_label" varchar(30),
  CONSTRAINT "order_item_modifiers_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE,
  CONSTRAINT "order_item_modifiers_modifier_id_modifier_options_id_fk" FOREIGN KEY ("modifier_id") REFERENCES "modifier_options"("id")
);

