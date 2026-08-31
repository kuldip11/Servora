-- Canonical pre-v1 table migration.

CREATE TABLE "membership_roles" (
  "membership_id" uuid NOT NULL,
  "role_id" uuid NOT NULL,
  "assigned_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "membership_roles_membership_id_tenant_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "tenant_memberships"("id") ON DELETE CASCADE,
  CONSTRAINT "membership_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX "membership_roles_membership_role_uniq" ON "membership_roles" USING btree ("membership_id", "role_id");
--> statement-breakpoint
CREATE INDEX "membership_roles_membership_idx" ON "membership_roles" USING btree ("membership_id");
--> statement-breakpoint
CREATE INDEX "membership_roles_role_idx" ON "membership_roles" USING btree ("role_id");
--> statement-breakpoint

-- Enforce role scope and tenant ownership for membership role assignments.
CREATE OR REPLACE FUNCTION enforce_membership_role_tenant() RETURNS trigger AS $$
DECLARE membership_tenant uuid; role_tenant uuid; role_scope_value text;
BEGIN
  SELECT "tenant_id" INTO membership_tenant FROM "tenant_memberships" WHERE "id" = NEW."membership_id";
  SELECT "tenant_id", "scope"::text INTO role_tenant, role_scope_value FROM "roles" WHERE "id" = NEW."role_id";
  IF role_scope_value NOT IN ('TENANT','BRANCH') THEN
    RAISE EXCEPTION 'membership_roles requires a TENANT or BRANCH role';
  END IF;
  IF role_tenant IS NOT NULL AND role_tenant <> membership_tenant THEN
    RAISE EXCEPTION 'cross-tenant role assignment is forbidden';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER membership_roles_tenant_guard BEFORE INSERT OR UPDATE ON "membership_roles"
FOR EACH ROW EXECUTE FUNCTION enforce_membership_role_tenant();
--> statement-breakpoint
