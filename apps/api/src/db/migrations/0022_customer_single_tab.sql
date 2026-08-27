-- A customer QR session represents one tab for the sitting.
-- Multiple rounds are represented by kitchen tickets on that single order.
-- Historical/closed orders remain possible; only one active customer tab may
-- exist for a session at a time.
CREATE UNIQUE INDEX IF NOT EXISTS "orders_customer_session_active_unique"
  ON "orders" ("customer_session_id")
  WHERE "customer_session_id" IS NOT NULL
    AND "status" NOT IN ('PAID', 'CLOSED', 'CANCELLED');
