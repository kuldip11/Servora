-- Phase 3.7: tie recipe consumption to the exact kitchen round that fired.
ALTER TABLE "order_inventory_deductions"
  ADD COLUMN IF NOT EXISTS "kitchen_ticket_id" uuid;

ALTER TABLE "order_inventory_deductions"
  ADD CONSTRAINT "order_inventory_deductions_kitchen_ticket_id_kitchen_tickets_id_fk"
  FOREIGN KEY ("kitchen_ticket_id") REFERENCES "kitchen_tickets"("id")
  ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS "order_inventory_deductions_ticket_idx"
  ON "order_inventory_deductions" ("kitchen_ticket_id");

-- One recipe ingredient for one menu item can be consumed only once for a
-- particular fired kitchen ticket. Historical rows remain nullable.
CREATE UNIQUE INDEX IF NOT EXISTS "order_inventory_deductions_ticket_recipe_unique"
  ON "order_inventory_deductions" ("kitchen_ticket_id", "menu_item_id", "inventory_item_id")
  WHERE "kitchen_ticket_id" IS NOT NULL;
