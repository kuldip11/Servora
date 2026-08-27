CREATE TABLE IF NOT EXISTS "customer_order_submissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "customer_session_id" uuid NOT NULL,
  "idempotency_key" varchar(128) NOT NULL,
  "order_id" uuid,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "updated_at" timestamp NOT NULL DEFAULT now()
);

DO $$ BEGIN
  ALTER TABLE "customer_order_submissions"
    ADD CONSTRAINT "customer_order_submissions_session_fk"
    FOREIGN KEY ("customer_session_id") REFERENCES "customer_sessions"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "customer_order_submissions"
    ADD CONSTRAINT "customer_order_submissions_order_fk"
    FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "customer_order_submissions_session_key_unique"
  ON "customer_order_submissions" ("customer_session_id", "idempotency_key");
CREATE INDEX IF NOT EXISTS "customer_order_submissions_session_idx"
  ON "customer_order_submissions" ("customer_session_id");
