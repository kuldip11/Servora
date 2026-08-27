ALTER TABLE "kitchen_tickets"
  ADD COLUMN IF NOT EXISTS "customer_request_id" varchar(128);

CREATE UNIQUE INDEX IF NOT EXISTS "kitchen_tickets_customer_request_unique"
  ON "kitchen_tickets" ("order_id", "customer_request_id")
  WHERE "customer_request_id" IS NOT NULL;
