

CREATE TABLE "order_inventory_deductions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL,
  "kitchen_ticket_id" uuid,
  "order_item_id" uuid,
  "menu_item_id" uuid NOT NULL,
  "inventory_item_id" uuid NOT NULL,
  "quantity_deducted" numeric(12, 3) NOT NULL,
  "unit" "inventory_unit" NOT NULL,
  "was_short" boolean DEFAULT false NOT NULL,
  "deducted_at" timestamp DEFAULT now() NOT NULL,
  "reversed_at" timestamp,
  CONSTRAINT "order_inventory_deductions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE,
  CONSTRAINT "order_inventory_deductions_kitchen_ticket_id_kitchen_tickets_id_fk" FOREIGN KEY ("kitchen_ticket_id") REFERENCES "kitchen_tickets"("id") ON DELETE CASCADE,
  CONSTRAINT "order_inventory_deductions_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE,
  CONSTRAINT "order_inventory_deductions_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE,
  CONSTRAINT "order_inventory_deductions_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE
);

CREATE INDEX "order_inventory_deductions_order_idx" ON "order_inventory_deductions" USING btree ("order_id");

CREATE INDEX "order_inventory_deductions_menu_item_idx" ON "order_inventory_deductions" USING btree ("menu_item_id");

CREATE INDEX "order_inventory_deductions_ticket_idx" ON "order_inventory_deductions" USING btree ("kitchen_ticket_id");

CREATE UNIQUE INDEX "order_inventory_deductions_ticket_recipe_unique" ON "order_inventory_deductions" USING btree ("kitchen_ticket_id", "menu_item_id", "inventory_item_id") WHERE "kitchen_ticket_id" IS NOT NULL;

