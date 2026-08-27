-- Public branch-level takeaway QR. Unlike table QR tokens, this token is not tied to a physical table.
ALTER TABLE "branches"
  ADD COLUMN IF NOT EXISTS "public_takeaway_qr_token" uuid DEFAULT gen_random_uuid() NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "branches_public_takeaway_qr_token_uniq"
  ON "branches" ("public_takeaway_qr_token");

DO $$ BEGIN
  CREATE TYPE "customer_session_mode" AS ENUM ('DINE_IN', 'TAKEAWAY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "customer_sessions"
  ALTER COLUMN "table_id" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "mode" "customer_session_mode" DEFAULT 'DINE_IN' NOT NULL;

CREATE INDEX IF NOT EXISTS "customer_sessions_branch_mode_idx"
  ON "customer_sessions" ("branch_id", "mode", "active");
