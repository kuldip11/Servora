-- Phase 2.2: explicit organization layer above franchises/tenants.
-- Existing tenants remain valid during migration; franchise creation will make
-- organization_id mandatory when the franchise layer is completed.

CREATE TABLE IF NOT EXISTS "organizations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(200) NOT NULL,
  "created_by" uuid NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "organizations_created_by_idx" ON "organizations" ("created_by");

CREATE TABLE IF NOT EXISTS "organization_memberships" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "organization_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "organization_memberships_user_organization_uniq" UNIQUE ("user_id", "organization_id")
);

CREATE INDEX IF NOT EXISTS "organization_memberships_user_idx" ON "organization_memberships" ("user_id");
CREATE INDEX IF NOT EXISTS "organization_memberships_organization_idx" ON "organization_memberships" ("organization_id");

ALTER TABLE "tenants"
  ADD COLUMN IF NOT EXISTS "organization_id" uuid REFERENCES "organizations"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "tenants_organization_idx" ON "tenants" ("organization_id");
