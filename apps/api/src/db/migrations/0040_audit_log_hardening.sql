ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "branch_id" uuid;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "request_id" varchar(64);

-- Backfill branch IDs captured in legacy JSON metadata when present and valid.
UPDATE "audit_logs"
SET "branch_id" = (("metadata"::jsonb ->> 'branchId')::uuid)
WHERE "branch_id" IS NULL
  AND "metadata" IS NOT NULL
  AND ("metadata"::jsonb ->> 'branchId') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_branch_tenant_fk"
  FOREIGN KEY ("branch_id", "tenant_id") REFERENCES "branches"("id", "tenant_id") ON DELETE NO ACTION;
CREATE INDEX IF NOT EXISTS "audit_logs_tenant_created_idx" ON "audit_logs" ("tenant_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "audit_logs_tenant_branch_created_idx" ON "audit_logs" ("tenant_id", "branch_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "audit_logs_tenant_action_created_idx" ON "audit_logs" ("tenant_id", "action", "created_at" DESC);

CREATE OR REPLACE FUNCTION prevent_audit_log_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit logs are append-only';
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS audit_logs_immutable_update ON "audit_logs";
DROP TRIGGER IF EXISTS audit_logs_immutable_delete ON "audit_logs";
CREATE TRIGGER audit_logs_immutable_update BEFORE UPDATE ON "audit_logs" FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();
CREATE TRIGGER audit_logs_immutable_delete BEFORE DELETE ON "audit_logs" FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();
