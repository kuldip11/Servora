-- Customer self-ordering foundation.
-- Public QR tokens identify a table without exposing staff authentication.
ALTER TABLE "restaurant_tables"
  ADD COLUMN IF NOT EXISTS "public_qr_token" uuid DEFAULT gen_random_uuid() NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "tables_public_qr_token_uniq"
  ON "restaurant_tables" ("public_qr_token");

DO $$ BEGIN
  CREATE TYPE "order_source" AS ENUM ('STAFF', 'CUSTOMER_QR');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "source" "order_source" DEFAULT 'STAFF' NOT NULL,
  ADD COLUMN IF NOT EXISTS "customer_session_id" uuid;
ALTER TABLE "orders" ALTER COLUMN "created_by" DROP NOT NULL;

ALTER TABLE "order_status_history" ALTER COLUMN "changed_by" DROP NOT NULL;
ALTER TABLE "inventory_transactions" ALTER COLUMN "performed_by" DROP NOT NULL;

CREATE TABLE IF NOT EXISTS "customer_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "branch_id" uuid NOT NULL REFERENCES "branches"("id") ON DELETE CASCADE,
  "table_id" uuid NOT NULL REFERENCES "restaurant_tables"("id") ON DELETE CASCADE,
  "token" uuid DEFAULT gen_random_uuid() NOT NULL,
  "active" boolean DEFAULT true NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "customer_sessions_token_unique" UNIQUE("token")
);

CREATE INDEX IF NOT EXISTS "customer_sessions_token_idx"
  ON "customer_sessions" ("token");
CREATE INDEX IF NOT EXISTS "customer_sessions_table_active_idx"
  ON "customer_sessions" ("table_id", "active");

DO $$ BEGIN
  ALTER TABLE "orders"
    ADD CONSTRAINT "orders_customer_session_id_fk"
    FOREIGN KEY ("customer_session_id") REFERENCES "customer_sessions"("id") ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "orders_customer_session_idx"
  ON "orders" ("customer_session_id");
