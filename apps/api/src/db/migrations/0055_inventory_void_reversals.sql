ALTER TABLE "order_inventory_deductions" ADD COLUMN IF NOT EXISTS "order_item_id" uuid;
--> statement-breakpoint
ALTER TABLE "order_inventory_deductions" ADD COLUMN IF NOT EXISTS "reversed_at" timestamp;
--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD COLUMN IF NOT EXISTS "reversal_of_deduction_id" uuid;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "order_inventory_deductions" ADD CONSTRAINT "order_inventory_deductions_order_item_id_fk"
    FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_reversal_of_deduction_id_fk"
    FOREIGN KEY ("reversal_of_deduction_id") REFERENCES "order_inventory_deductions"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "inventory_transactions_reversal_unique"
  ON "inventory_transactions" ("reversal_of_deduction_id") WHERE "reversal_of_deduction_id" IS NOT NULL;
