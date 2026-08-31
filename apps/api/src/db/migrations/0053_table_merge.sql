ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "merged_into_order_id" uuid;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "orders" ADD CONSTRAINT "orders_merged_into_order_id_fk"
    FOREIGN KEY ("merged_into_order_id") REFERENCES "orders"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "orders_merged_into_idx" ON "orders" ("merged_into_order_id");
