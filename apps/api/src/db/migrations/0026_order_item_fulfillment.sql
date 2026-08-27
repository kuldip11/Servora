DO $$ BEGIN
  CREATE TYPE "order_item_fulfillment_type" AS ENUM ('DINE_IN', 'TAKEAWAY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "fulfillment_type" "order_item_fulfillment_type" NOT NULL DEFAULT 'DINE_IN';
