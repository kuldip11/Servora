ALTER TABLE "bills" DROP CONSTRAINT IF EXISTS "bills_order_id_unique";
--> statement-breakpoint
ALTER TABLE "bills" ADD COLUMN IF NOT EXISTS "split_label" varchar(100);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bill_order_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "bill_id" uuid NOT NULL REFERENCES "bills"("id") ON DELETE cascade,
  "order_item_id" uuid NOT NULL REFERENCES "order_items"("id") ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bill_order_items_bill_idx" ON "bill_order_items" ("bill_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bill_order_items_order_item_unique" ON "bill_order_items" ("order_item_id");
