-- Canonical pre-v1 table migration.

CREATE TABLE "global_user_roles" (
  "user_id" uuid NOT NULL,
  "role_id" uuid NOT NULL,
  "assigned_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "global_user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "global_user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX "global_user_roles_user_role_uniq" ON "global_user_roles" USING btree ("user_id", "role_id");
--> statement-breakpoint

-- Enforce that global assignments reference application-owned GLOBAL roles.
CREATE OR REPLACE FUNCTION enforce_global_role_tenant() RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "roles" r WHERE r."id" = NEW."role_id" AND r."scope" = 'GLOBAL' AND r."tenant_id" IS NULL) THEN
    RAISE EXCEPTION 'global_user_roles requires an application GLOBAL role';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER global_user_roles_tenant_guard BEFORE INSERT OR UPDATE ON "global_user_roles"
FOR EACH ROW EXECUTE FUNCTION enforce_global_role_tenant();
--> statement-breakpoint
