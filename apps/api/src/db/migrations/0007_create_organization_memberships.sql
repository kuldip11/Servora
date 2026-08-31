

CREATE TABLE "organization_memberships" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "organization_id" uuid NOT NULL,
  "status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "organization_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "organization_memberships_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "organization_memberships_user_organization_uniq" ON "organization_memberships" USING btree ("user_id", "organization_id");

CREATE INDEX "organization_memberships_user_idx" ON "organization_memberships" USING btree ("user_id");

CREATE INDEX "organization_memberships_organization_idx" ON "organization_memberships" USING btree ("organization_id");

