-- Phase 2.3: every franchise/tenant must belong to an organization.
-- Backfill legacy tenants into one organization each before enforcing NOT NULL.

DO $$
DECLARE
  t RECORD;
  new_org uuid;
BEGIN
  FOR t IN
    SELECT id, name, created_by
    FROM tenants
    WHERE organization_id IS NULL
  LOOP
    INSERT INTO organizations (name, created_by)
    VALUES (t.name || ' Organization', t.created_by)
    RETURNING id INTO new_org;

    INSERT INTO organization_memberships (user_id, organization_id)
    VALUES (t.created_by, new_org)
    ON CONFLICT (user_id, organization_id) DO NOTHING;

    UPDATE tenants
    SET organization_id = new_org, updated_at = now()
    WHERE id = t.id;
  END LOOP;
END $$;

ALTER TABLE tenants
  ALTER COLUMN organization_id SET NOT NULL;

ALTER TABLE tenants
  DROP CONSTRAINT IF EXISTS tenants_organization_id_fkey;

ALTER TABLE tenants
  ADD CONSTRAINT tenants_organization_id_fkey
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS tenants_organization_id_active_idx
  ON tenants (organization_id, is_active);
