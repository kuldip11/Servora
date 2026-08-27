ALTER TABLE "payments"
  ADD COLUMN IF NOT EXISTS "gateway_order_id" varchar(255),
  ADD COLUMN IF NOT EXISTS "gateway_payment_id" varchar(255);

CREATE UNIQUE INDEX IF NOT EXISTS "payments_gateway_payment_id_unique"
  ON "payments" ("gateway_payment_id")
  WHERE "gateway_payment_id" IS NOT NULL;

CREATE TABLE IF NOT EXISTS "payment_webhook_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_id" varchar(255) NOT NULL UNIQUE,
  "event_type" varchar(100) NOT NULL,
  "payload" text NOT NULL,
  "received_at" timestamp NOT NULL DEFAULT now(),
  "processed_at" timestamp,
  "status" varchar(30) NOT NULL DEFAULT 'RECEIVED',
  "error" text
);

CREATE INDEX IF NOT EXISTS "payment_webhook_events_type_idx"
  ON "payment_webhook_events" ("event_type");
