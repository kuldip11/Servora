CREATE TABLE IF NOT EXISTS "user_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "created_at" timestamp NOT NULL DEFAULT now(),
  "last_seen_at" timestamp NOT NULL DEFAULT now(),
  "expires_at" timestamp NOT NULL,
  "revoked_at" timestamp,
  "user_agent" varchar(500),
  "ip_address" varchar(64)
);
CREATE INDEX IF NOT EXISTS "user_sessions_user_active_idx" ON "user_sessions" ("user_id", "revoked_at", "expires_at");

ALTER TABLE "refresh_tokens" ADD COLUMN IF NOT EXISTS "session_id" uuid;
ALTER TABLE "refresh_tokens" DROP CONSTRAINT IF EXISTS "refresh_tokens_session_id_user_sessions_id_fk";
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_session_id_user_sessions_id_fk"
  FOREIGN KEY ("session_id") REFERENCES "user_sessions"("id") ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS "refresh_tokens_session_idx" ON "refresh_tokens" ("session_id");

-- Existing refresh tokens predate first-class sessions. Revoke them so clients
-- refresh through login once and all future refresh tokens are session-bound.
UPDATE "refresh_tokens" SET "revoked_at" = COALESCE("revoked_at", now()) WHERE "session_id" IS NULL;
