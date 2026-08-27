-- Customer table-assistance requests.
DO $$ BEGIN
  CREATE TYPE "customer_request_type" AS ENUM ('CALL_WAITER', 'WATER', 'CUTLERY', 'BILL', 'ASSISTANCE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE "customer_request_status" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE TABLE IF NOT EXISTS "customer_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "branch_id" uuid NOT NULL REFERENCES "branches"("id") ON DELETE CASCADE,
  "table_id" uuid NOT NULL REFERENCES "restaurant_tables"("id") ON DELETE CASCADE,
  "customer_session_id" uuid NOT NULL REFERENCES "customer_sessions"("id") ON DELETE CASCADE,
  "order_id" uuid REFERENCES "orders"("id") ON DELETE SET NULL,
  "type" "customer_request_type" NOT NULL,
  "status" "customer_request_status" DEFAULT 'OPEN' NOT NULL,
  "note" text,
  "resolved_by" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "customer_requests_branch_status_idx" ON "customer_requests" ("branch_id", "status");
CREATE INDEX IF NOT EXISTS "customer_requests_session_idx" ON "customer_requests" ("customer_session_id");
