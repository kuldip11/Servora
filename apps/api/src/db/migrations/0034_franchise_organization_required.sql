-- Phase 2.3: every franchise/tenant belongs to an organization.
ALTER TABLE tenants
  ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE tenants
  DROP CONSTRAINT IF EXISTS tenants_organization_id_fkey;

ALTER TABLE tenants
  ADD CONSTRAINT tenants_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS tenants_organization_id_active_idx
  ON tenants (organization_id, is_active);
