-- Authentication hardening: bounded login-failure tracking and temporary account lockout.
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "failed_login_attempts" integer DEFAULT 0 NOT NULL,
  ADD COLUMN IF NOT EXISTS "locked_until" timestamp;

CREATE INDEX IF NOT EXISTS "users_locked_until_idx" ON "users" ("locked_until");
