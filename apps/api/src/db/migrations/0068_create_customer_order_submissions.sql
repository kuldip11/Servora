

CREATE TABLE "customer_order_submissions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "customer_session_id" uuid NOT NULL,
  "idempotency_key" varchar(128) NOT NULL,
  "order_id" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "customer_order_submissions_customer_session_id_customer_sessions_id_fk" FOREIGN KEY ("customer_session_id") REFERENCES "customer_sessions"("id") ON DELETE CASCADE,
  CONSTRAINT "customer_order_submissions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL
);

CREATE UNIQUE INDEX "customer_order_submissions_session_key_unique" ON "customer_order_submissions" USING btree ("customer_session_id", "idempotency_key");

CREATE INDEX "customer_order_submissions_session_idx" ON "customer_order_submissions" USING btree ("customer_session_id");

