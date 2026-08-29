-- Prevent assigning a tenant-owned custom role to a membership from another tenant.
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
DROP TRIGGER IF EXISTS membership_roles_tenant_guard ON "membership_roles";
CREATE TRIGGER membership_roles_tenant_guard BEFORE INSERT OR UPDATE ON "membership_roles"
FOR EACH ROW EXECUTE FUNCTION enforce_membership_role_tenant();

-- Global user roles must always be application-owned (tenant_id IS NULL).
CREATE OR REPLACE FUNCTION enforce_global_role_tenant() RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "roles" r WHERE r."id" = NEW."role_id" AND r."scope" = 'GLOBAL' AND r."tenant_id" IS NULL) THEN
    RAISE EXCEPTION 'global_user_roles requires an application GLOBAL role';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS global_user_roles_tenant_guard ON "global_user_roles";
CREATE TRIGGER global_user_roles_tenant_guard BEFORE INSERT OR UPDATE ON "global_user_roles"
FOR EACH ROW EXECUTE FUNCTION enforce_global_role_tenant();

-- Composite branch/tenant guards make cross-tenant branch references impossible
-- even if a future repository forgets an application-level tenant predicate.
ALTER TABLE "membership_branches" ADD CONSTRAINT "membership_branches_branch_tenant_fk" FOREIGN KEY ("branch_id", "tenant_id") REFERENCES "branches"("id", "tenant_id") ON DELETE CASCADE;
ALTER TABLE "restaurant_tables" ADD CONSTRAINT "restaurant_tables_branch_tenant_fk" FOREIGN KEY ("branch_id", "tenant_id") REFERENCES "branches"("id", "tenant_id") ON DELETE CASCADE;
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_branch_tenant_fk" FOREIGN KEY ("branch_id", "tenant_id") REFERENCES "branches"("id", "tenant_id") ON DELETE CASCADE;
ALTER TABLE "modifier_groups" ADD CONSTRAINT "modifier_groups_branch_tenant_fk" FOREIGN KEY ("branch_id", "tenant_id") REFERENCES "branches"("id", "tenant_id") ON DELETE CASCADE;
ALTER TABLE "menu_item_schedules" ADD CONSTRAINT "menu_item_schedules_branch_tenant_fk" FOREIGN KEY ("branch_id", "tenant_id") REFERENCES "branches"("id", "tenant_id") ON DELETE CASCADE;
ALTER TABLE "menu_item_branch_overrides" ADD CONSTRAINT "menu_item_branch_overrides_branch_tenant_fk" FOREIGN KEY ("branch_id", "tenant_id") REFERENCES "branches"("id", "tenant_id") ON DELETE CASCADE;
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_branch_tenant_fk" FOREIGN KEY ("branch_id", "tenant_id") REFERENCES "branches"("id", "tenant_id") ON DELETE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_branch_tenant_fk" FOREIGN KEY ("branch_id", "tenant_id") REFERENCES "branches"("id", "tenant_id") ON DELETE CASCADE;
ALTER TABLE "kitchen_tickets" ADD CONSTRAINT "kitchen_tickets_branch_tenant_fk" FOREIGN KEY ("branch_id", "tenant_id") REFERENCES "branches"("id", "tenant_id") ON DELETE CASCADE;
