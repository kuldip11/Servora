ALTER TABLE "payment_webhook_events"
  ADD COLUMN IF NOT EXISTS "attempt_count" integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "next_attempt_at" timestamp;

CREATE INDEX IF NOT EXISTS "payment_webhook_events_retry_idx"
  ON "payment_webhook_events" ("status", "next_attempt_at");
