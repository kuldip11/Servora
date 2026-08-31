-- A5/D1: dedicated permission for authoritative price-rule and happy-hour writes.
-- Backward-compatible rollout: every role that already had menu:update receives
-- the new capability so existing operators keep the behavior they had before
-- the service switches to the narrower permission key.
INSERT INTO "permissions" ("key", "module", "description") VALUES
  ('menu:pricing:write', 'menu', 'Create and update menu pricing rules')
ON CONFLICT ("key") DO UPDATE
SET "module" = EXCLUDED."module", "description" = EXCLUDED."description";
--> statement-breakpoint

INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT existing."role_id", pricing."id"
FROM "role_permissions" existing
JOIN "permissions" menu_update ON menu_update."id" = existing."permission_id"
CROSS JOIN "permissions" pricing
WHERE menu_update."key" = 'menu:update'
  AND pricing."key" = 'menu:pricing:write'
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
