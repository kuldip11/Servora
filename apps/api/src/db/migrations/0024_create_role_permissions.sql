-- Canonical pre-v1 table migration.

CREATE TABLE "role_permissions" (
  "role_id" uuid NOT NULL,
  "permission_id" uuid NOT NULL,
  CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE,
  CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX "role_permissions_role_permission_uniq" ON "role_permissions" USING btree ("role_id", "permission_id");
--> statement-breakpoint

-- Canonical system-role permission assignments.
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id" FROM "roles" r CROSS JOIN "permissions" p
WHERE r."name" = 'FRANCHISE_ADMIN' AND r."tenant_id" IS NULL AND p."key" IN ('analytics:read', 'audit:read', 'billing:read', 'branch:archive', 'branch:create', 'branch:read', 'branch:update', 'inventory:adjust', 'inventory:create', 'inventory:read', 'inventory:update', 'inventory:waste', 'kitchen:read', 'kitchen:update', 'menu:create', 'menu:delete', 'menu:pricing:write', 'menu:publish', 'menu:read', 'menu:update', 'orders:cancel', 'orders:comp', 'orders:create', 'orders:read', 'orders:update', 'orders:update_status', 'orders:void', 'organization:manage', 'permissions:read', 'roles:archive', 'roles:assign_permissions', 'roles:create', 'roles:read', 'roles:update', 'settings:read', 'settings:update', 'staff:assign_branch', 'staff:assign_role', 'staff:create', 'staff:deactivate', 'staff:read', 'staff:update', 'tables:create', 'tables:delete', 'tables:read', 'tables:update', 'tenant:archive', 'tenant:manage_members', 'tenant:read', 'tenant:update');
--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id" FROM "roles" r CROSS JOIN "permissions" p
WHERE r."name" = 'MANAGER' AND r."tenant_id" IS NULL AND p."key" IN ('analytics:read', 'audit:read', 'billing:read', 'branch:archive', 'branch:read', 'branch:update', 'inventory:adjust', 'inventory:create', 'inventory:read', 'inventory:update', 'inventory:waste', 'kitchen:read', 'kitchen:update', 'menu:create', 'menu:delete', 'menu:pricing:write', 'menu:publish', 'menu:read', 'menu:update', 'orders:cancel', 'orders:comp', 'orders:create', 'orders:read', 'orders:update', 'orders:update_status', 'orders:void', 'settings:read', 'staff:create', 'staff:read', 'staff:update', 'tables:create', 'tables:delete', 'tables:read', 'tables:update');
--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id" FROM "roles" r CROSS JOIN "permissions" p
WHERE r."name" = 'CHEF' AND r."tenant_id" IS NULL AND p."key" IN ('kitchen:read', 'kitchen:update', 'menu:read', 'orders:read', 'orders:update_status');
--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id" FROM "roles" r CROSS JOIN "permissions" p
WHERE r."name" = 'WAITER' AND r."tenant_id" IS NULL AND p."key" IN ('menu:read', 'orders:create', 'orders:read', 'orders:update', 'orders:update_status', 'tables:read', 'tables:update');
--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id" FROM "roles" r CROSS JOIN "permissions" p
WHERE r."name" = 'CASHIER' AND r."tenant_id" IS NULL AND p."key" IN ('billing:create', 'billing:read', 'billing:refund', 'orders:read', 'orders:update_status', 'tables:read');
--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id" FROM "roles" r CROSS JOIN "permissions" p
WHERE r."name" = 'INVENTORY_MANAGER' AND r."tenant_id" IS NULL AND p."key" IN ('inventory:adjust', 'inventory:read', 'inventory:update', 'inventory:waste');
--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id" FROM "roles" r CROSS JOIN "permissions" p
WHERE r."name" = 'RECEPTIONIST' AND r."tenant_id" IS NULL AND p."key" IN ('menu:read', 'orders:read', 'tables:read', 'tables:update');
--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id" FROM "roles" r CROSS JOIN "permissions" p
WHERE r."name" = 'ACCOUNTANT' AND r."tenant_id" IS NULL AND p."key" IN ('analytics:read', 'billing:read');
--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id" FROM "roles" r CROSS JOIN "permissions" p
WHERE r."name" = 'OWNER' AND r."tenant_id" IS NULL AND p."key" IN ('analytics:read', 'audit:read', 'auth:read', 'billing:create', 'billing:read', 'billing:refund', 'branch:archive', 'branch:create', 'branch:read', 'branch:update', 'inventory:adjust', 'inventory:create', 'inventory:read', 'inventory:update', 'inventory:waste', 'kitchen:read', 'kitchen:update', 'menu:create', 'menu:delete', 'menu:pricing:write', 'menu:publish', 'menu:read', 'menu:update', 'orders:cancel', 'orders:comp', 'orders:create', 'orders:read', 'orders:update', 'orders:update_status', 'orders:void', 'organization:manage', 'permissions:read', 'roles:archive', 'roles:assign_permissions', 'roles:create', 'roles:read', 'roles:update', 'settings:read', 'settings:update', 'staff:assign_branch', 'staff:assign_role', 'staff:create', 'staff:deactivate', 'staff:read', 'staff:update', 'tables:create', 'tables:delete', 'tables:read', 'tables:update', 'tenant:archive', 'tenant:create', 'tenant:manage_members', 'tenant:read', 'tenant:update');
--> statement-breakpoint
