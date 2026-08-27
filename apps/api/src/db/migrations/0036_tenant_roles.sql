ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "tenant_id" uuid;
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "is_system" boolean NOT NULL DEFAULT false;
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "is_active" boolean NOT NULL DEFAULT true;
ALTER TABLE "roles" ADD COLUMN IF NOT EXISTS "updated_at" timestamp NOT NULL DEFAULT now();

UPDATE "roles" SET "is_system" = true WHERE "tenant_id" IS NULL;

ALTER TABLE "roles" DROP CONSTRAINT IF EXISTS "roles_name_unique";
ALTER TABLE "roles" DROP CONSTRAINT IF EXISTS "roles_tenant_id_tenants_id_fk";
ALTER TABLE "roles" ADD CONSTRAINT "roles_tenant_id_tenants_id_fk"
  FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "roles_system_name_scope_uniq"
  ON "roles" (lower("name"), "scope") WHERE "tenant_id" IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "roles_tenant_name_scope_uniq"
  ON "roles" ("tenant_id", lower("name"), "scope") WHERE "tenant_id" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "roles_tenant_active_idx" ON "roles" ("tenant_id", "is_active");

ALTER TABLE "roles" DROP CONSTRAINT IF EXISTS "roles_custom_scope_check";
ALTER TABLE "roles" ADD CONSTRAINT "roles_custom_scope_check"
  CHECK ("tenant_id" IS NULL OR "scope" IN ('TENANT', 'BRANCH'));
