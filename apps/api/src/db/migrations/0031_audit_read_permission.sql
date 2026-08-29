INSERT INTO "permissions" ("key", "module", "description")
VALUES ('audit:read', 'audit', 'Read tenant audit logs')
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r CROSS JOIN "permissions" p
WHERE r."name" IN ('OWNER', 'FRANCHISE_ADMIN', 'MANAGER')
  AND p."key" = 'audit:read'
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
