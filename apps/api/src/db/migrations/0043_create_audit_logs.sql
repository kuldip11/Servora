

CREATE TABLE "audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "user_id" uuid,
  "branch_id" uuid,
  "request_id" varchar(64),
  "action" varchar(100) NOT NULL,
  "entity" varchar(100) NOT NULL,
  "entity_id" uuid,
  "metadata" text DEFAULT '{}',
  "ip_address" varchar(50),
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id"),
  CONSTRAINT "audit_logs_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE SET NULL,
  CONSTRAINT "audit_logs_branch_tenant_fk" FOREIGN KEY ("branch_id", "tenant_id") REFERENCES "branches"("id", "tenant_id")
);

CREATE INDEX "audit_logs_tenant_idx" ON "audit_logs" USING btree ("tenant_id");

CREATE INDEX "audit_logs_tenant_created_idx" ON "audit_logs" USING btree ("tenant_id", "created_at");

CREATE INDEX "audit_logs_tenant_branch_created_idx" ON "audit_logs" USING btree ("tenant_id", "branch_id", "created_at");

CREATE INDEX "audit_logs_tenant_action_created_idx" ON "audit_logs" USING btree ("tenant_id", "action", "created_at");

CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");

CREATE OR REPLACE FUNCTION prevent_audit_log_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit logs are append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_immutable_update BEFORE UPDATE ON "audit_logs" FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

CREATE TRIGGER audit_logs_immutable_delete BEFORE DELETE ON "audit_logs" FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_mutation();

