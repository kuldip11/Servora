-- Canonical pre-v1 table migration.

CREATE TABLE "bill_order_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "bill_id" uuid NOT NULL,
  "order_item_id" uuid NOT NULL,
  "allocation_ratio" numeric(8, 6) DEFAULT '1' NOT NULL,
  CONSTRAINT "bill_order_items_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "bills"("id") ON DELETE CASCADE,
  CONSTRAINT "bill_order_items_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX "bill_order_items_bill_idx" ON "bill_order_items" USING btree ("bill_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "bill_order_items_bill_order_item_unique" ON "bill_order_items" USING btree ("bill_id", "order_item_id");
--> statement-breakpoint
