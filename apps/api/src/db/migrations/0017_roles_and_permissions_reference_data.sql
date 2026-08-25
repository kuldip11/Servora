-- Required RBAC reference data. Idempotent and safe for fresh installs.

-- RBAC reference data is required application state, not demo data.
-- Keep this idempotent so it is safe for existing installations.


INSERT INTO "permissions" ("key", "module", "description") VALUES
  ('auth:read', 'auth', 'Read auth data'),
  ('staff:create', 'staff', 'Create staff members'),
  ('staff:read', 'staff', 'Read staff data'),
  ('staff:update', 'staff', 'Update staff members'),
  ('staff:deactivate', 'staff', 'Deactivate staff members'),
  ('staff:assign_role', 'staff', 'Assign membership roles'),
  ('staff:assign_branch', 'staff', 'Assign membership branches'),
  ('menu:create', 'menu', 'Create menu items'),
  ('menu:read', 'menu', 'Read menu items'),
  ('menu:update', 'menu', 'Update menu items'),
  ('menu:delete', 'menu', 'Delete menu items'),
  ('menu:publish', 'menu', 'Publish or unpublish menu items'),
  ('orders:create', 'orders', 'Create orders'),
  ('orders:read', 'orders', 'Read orders'),
  ('orders:update', 'orders', 'Update orders'),
  ('orders:update_status', 'orders', 'Update order status'),
  ('orders:cancel', 'orders', 'Cancel orders'),
  ('tenant:create', 'tenant', 'Create a new tenant'),
  ('tenant:read', 'tenant', 'Read tenant data'),
  ('tenant:update', 'tenant', 'Update tenant settings'),
  ('tenant:archive', 'tenant', 'Archive a tenant'),
  ('tenant:manage_members', 'tenant', 'Manage tenant membership'),
  ('branch:create', 'branch', 'Create branches'),
  ('branch:read', 'branch', 'View branches'),
  ('branch:update', 'branch', 'Update branch details'),
  ('branch:archive', 'branch', 'Archive branches'),
  ('kitchen:read', 'kitchen', 'View kitchen queue'),
  ('kitchen:update', 'kitchen', 'Update kitchen order status'),
  ('tables:create', 'tables', 'Create restaurant tables'),
  ('tables:read', 'tables', 'View restaurant tables'),
  ('tables:update', 'tables', 'Update table details and status'),
  ('tables:delete', 'tables', 'Remove restaurant tables'),
  ('inventory:create', 'inventory', 'Create inventory items'),
  ('inventory:read', 'inventory', 'Read inventory'),
  ('inventory:update', 'inventory', 'Update inventory stock'),
  ('inventory:adjust', 'inventory', 'Perform inventory adjustments'),
  ('inventory:waste', 'inventory', 'Record inventory waste'),
  ('billing:create', 'billing', 'Create bills and payments'),
  ('billing:read', 'billing', 'Read billing data'),
  ('billing:refund', 'billing', 'Process refunds'),
  ('analytics:read', 'analytics', 'Read analytics'),
  ('settings:read', 'settings', 'Read settings'),
  ('settings:update', 'settings', 'Update settings')
ON CONFLICT ("key") DO UPDATE
SET "module" = EXCLUDED."module", "description" = EXCLUDED."description";
--> statement-breakpoint

INSERT INTO "roles" ("name", "scope", "description") VALUES
  ('OWNER', 'GLOBAL', 'Global owner access'),
  ('FRANCHISE_ADMIN', 'TENANT', 'Tenant-wide administration access'),
  ('MANAGER', 'BRANCH', 'Branch management access'),
  ('CHEF', 'BRANCH', 'Kitchen operations access'),
  ('WAITER', 'BRANCH', 'Order management access'),
  ('CASHIER', 'BRANCH', 'Billing and payments access'),
  ('INVENTORY_MANAGER', 'BRANCH', 'Inventory management access'),
  ('RECEPTIONIST', 'BRANCH', 'Table and reservation management'),
  ('ACCOUNTANT', 'BRANCH', 'Financial reports access')
ON CONFLICT ("name") DO UPDATE
SET "scope" = EXCLUDED."scope", "description" = EXCLUDED."description";
--> statement-breakpoint

-- Owner receives every canonical permission.
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r CROSS JOIN "permissions" p
WHERE r."name" = 'OWNER'
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
--> statement-breakpoint

-- Franchise administration.
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r JOIN "permissions" p ON p."key" IN (
  'tenant:read','tenant:update','tenant:archive','tenant:manage_members',
  'branch:create','branch:read','branch:update','branch:archive',
  'staff:create','staff:read','staff:update','staff:deactivate','staff:assign_role','staff:assign_branch',
  'menu:create','menu:read','menu:update','menu:delete','menu:publish',
  'orders:create','orders:read','orders:update','orders:update_status','orders:cancel',
  'kitchen:read','kitchen:update',
  'tables:create','tables:read','tables:update','tables:delete',
  'inventory:create','inventory:read','inventory:update','inventory:adjust','inventory:waste',
  'billing:read','analytics:read','settings:read','settings:update'
)
WHERE r."name" = 'FRANCHISE_ADMIN'
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
--> statement-breakpoint

-- Branch manager.
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r JOIN "permissions" p ON p."key" IN (
  'staff:create','staff:read','staff:update',
  'menu:create','menu:read','menu:update','menu:delete','menu:publish',
  'orders:create','orders:read','orders:update','orders:update_status','orders:cancel',
  'kitchen:read','kitchen:update',
  'tables:create','tables:read','tables:update','tables:delete',
  'inventory:create','inventory:read','inventory:update','inventory:adjust','inventory:waste',
  'billing:read','analytics:read','settings:read',
  'branch:read','branch:update','branch:archive'
)
WHERE r."name" = 'MANAGER'
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
--> statement-breakpoint

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id" FROM "roles" r JOIN "permissions" p ON p."key" IN ('kitchen:read','kitchen:update','orders:read','orders:update_status','menu:read')
WHERE r."name" = 'CHEF' ON CONFLICT ("role_id", "permission_id") DO NOTHING;
--> statement-breakpoint

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id" FROM "roles" r JOIN "permissions" p ON p."key" IN ('orders:create','orders:read','orders:update','orders:update_status','menu:read','tables:read','tables:update')
WHERE r."name" = 'WAITER' ON CONFLICT ("role_id", "permission_id") DO NOTHING;
--> statement-breakpoint

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id" FROM "roles" r JOIN "permissions" p ON p."key" IN ('billing:create','billing:read','billing:refund','orders:read','orders:update_status','tables:read')
WHERE r."name" = 'CASHIER' ON CONFLICT ("role_id", "permission_id") DO NOTHING;
--> statement-breakpoint

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id" FROM "roles" r JOIN "permissions" p ON p."key" IN ('inventory:read','inventory:update','inventory:adjust','inventory:waste')
WHERE r."name" = 'INVENTORY_MANAGER' ON CONFLICT ("role_id", "permission_id") DO NOTHING;
--> statement-breakpoint

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id" FROM "roles" r JOIN "permissions" p ON p."key" IN ('orders:read','menu:read','tables:read','tables:update')
WHERE r."name" = 'RECEPTIONIST' ON CONFLICT ("role_id", "permission_id") DO NOTHING;
--> statement-breakpoint

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id" FROM "roles" r JOIN "permissions" p ON p."key" IN ('billing:read','analytics:read')
WHERE r."name" = 'ACCOUNTANT' ON CONFLICT ("role_id", "permission_id") DO NOTHING;

-- Migration gate: a database is not considered RBAC-ready unless the two
-- bootstrap roles and the canonical permission set exist.
DO $$
DECLARE
  permission_count integer;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "roles" WHERE "name" = 'OWNER' AND "scope" = 'GLOBAL') THEN
    RAISE EXCEPTION 'RBAC bootstrap failed: GLOBAL OWNER role is missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM "roles" WHERE "name" = 'FRANCHISE_ADMIN' AND "scope" = 'TENANT') THEN
    RAISE EXCEPTION 'RBAC bootstrap failed: TENANT FRANCHISE_ADMIN role is missing';
  END IF;
  SELECT count(*) INTO permission_count FROM "permissions";
  IF permission_count < 1 THEN
    RAISE EXCEPTION 'RBAC bootstrap failed: permissions are missing';
  END IF;
END $$;
