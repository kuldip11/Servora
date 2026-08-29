INSERT INTO "permissions" ("key", "module", "description") VALUES
  ('roles:read', 'roles', 'Read roles and role permissions'),
  ('roles:create', 'roles', 'Create custom roles'),
  ('roles:update', 'roles', 'Update custom roles'),
  ('roles:archive', 'roles', 'Archive custom roles'),
  ('roles:assign_permissions', 'roles', 'Assign permissions to custom roles'),
  ('permissions:read', 'permissions', 'Read the permission catalog')
ON CONFLICT ("key") DO UPDATE SET "module" = EXCLUDED."module", "description" = EXCLUDED."description";

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r CROSS JOIN "permissions" p
WHERE r."name" = 'OWNER' AND p."key" IN (
  'roles:read','roles:create','roles:update','roles:archive','roles:assign_permissions','permissions:read'
)
ON CONFLICT ("role_id", "permission_id") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r JOIN "permissions" p ON p."key" IN (
  'roles:read','roles:create','roles:update','roles:archive','roles:assign_permissions','permissions:read'
)
WHERE r."name" = 'FRANCHISE_ADMIN' AND r."tenant_id" IS NULL
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
