-- Enforce one active customer tab/order per customer session.
--
-- Older development databases may contain multiple active orders for the same
-- customer session because this invariant did not exist previously. Keep the
-- most recently updated active order (preferring BILL_REQUESTED over OPEN) and
-- mark older duplicates CANCELLED before creating the unique partial index.
-- This preserves the rows and their history instead of deleting business data.
WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY customer_session_id
      ORDER BY
        CASE WHEN status = 'BILL_REQUESTED' THEN 0 ELSE 1 END,
        updated_at DESC,
        created_at DESC,
        id DESC
    ) AS rn
  FROM orders
  WHERE customer_session_id IS NOT NULL
    AND status NOT IN ('PAID', 'CLOSED', 'CANCELLED')
)
UPDATE orders AS o
SET
  status = 'CANCELLED',
  updated_at = now(),
  notes = CASE
    WHEN o.notes IS NULL OR o.notes = '' THEN
      'Cancelled during migration: duplicate active customer tab; a newer active tab was retained.'
    ELSE
      o.notes || E'\nCancelled during migration: duplicate active customer tab; a newer active tab was retained.'
  END
FROM ranked AS r
WHERE o.id = r.id
  AND r.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS "orders_customer_session_active_unique"
  ON "orders" ("customer_session_id")
  WHERE "customer_session_id" IS NOT NULL
    AND "status" NOT IN ('PAID', 'CLOSED', 'CANCELLED');
