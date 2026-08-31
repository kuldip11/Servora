

CREATE TABLE "payment_webhook_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "event_id" varchar(255) NOT NULL CONSTRAINT "payment_webhook_events_event_id_unique" UNIQUE,
  "event_type" varchar(100) NOT NULL,
  "payload" text NOT NULL,
  "received_at" timestamp DEFAULT now() NOT NULL,
  "processed_at" timestamp,
  "status" varchar(30) DEFAULT 'RECEIVED' NOT NULL,
  "attempt_count" integer DEFAULT 0 NOT NULL,
  "next_attempt_at" timestamp,
  "error" text
);

CREATE INDEX "payment_webhook_events_type_idx" ON "payment_webhook_events" USING btree ("event_type");

CREATE INDEX "payment_webhook_events_retry_idx" ON "payment_webhook_events" USING btree ("status", "next_attempt_at");

