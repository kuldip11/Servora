-- Enforce one active customer tab/order per customer session.
CREATE UNIQUE INDEX IF NOT EXISTS "orders_customer_session_active_unique"
  ON "orders" ("customer_session_id")
  WHERE "customer_session_id" IS NOT NULL
    AND "status" NOT IN ('PAID', 'CLOSED', 'CANCELLED');
