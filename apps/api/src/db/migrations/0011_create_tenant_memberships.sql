-- Canonical pre-v1 table migration.

CREATE TABLE "tenant_memberships" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "tenant_id" uuid NOT NULL,
  "status" "membership_status" DEFAULT 'ACTIVE' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "tenant_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "tenant_memberships_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_memberships_user_tenant_uniq" ON "tenant_memberships" USING btree ("user_id", "tenant_id");
--> statement-breakpoint
CREATE INDEX "tenant_memberships_user_idx" ON "tenant_memberships" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX "tenant_memberships_tenant_idx" ON "tenant_memberships" USING btree ("tenant_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_memberships_id_user_unique_fk_target" ON "tenant_memberships" USING btree ("id", "user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_memberships_id_tenant_unique_fk_target" ON "tenant_memberships" USING btree ("id", "tenant_id");
--> statement-breakpoint
