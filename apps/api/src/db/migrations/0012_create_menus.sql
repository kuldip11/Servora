

CREATE TABLE "menus" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid,
  "organization_id" uuid,
  "name" varchar(200) NOT NULL,
  "description" text,
  "status" "menu_status" DEFAULT 'DRAFT' NOT NULL,
  "is_default" boolean DEFAULT false NOT NULL,
  "available_channels" text[],
  "available_fulfillment_types" text[],
  "available_branch_ids" uuid[],
  "effective_from" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "menus_exactly_one_owner_scope" CHECK (("tenant_id" IS NOT NULL) <> ("organization_id" IS NOT NULL)),
  CONSTRAINT "menus_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "menus_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
);

CREATE INDEX "menus_tenant_status_idx" ON "menus" USING btree ("tenant_id", "status");

CREATE INDEX "menus_organization_status_idx" ON "menus" USING btree ("organization_id", "status") WHERE "organization_id" IS NOT NULL;

CREATE UNIQUE INDEX "menus_tenant_name_unique" ON "menus" USING btree ("tenant_id", "name") WHERE "tenant_id" IS NOT NULL;

CREATE UNIQUE INDEX "menus_organization_name_unique" ON "menus" USING btree ("organization_id", "name") WHERE "organization_id" IS NOT NULL;

CREATE UNIQUE INDEX "menus_one_default_per_tenant" ON "menus" USING btree ("tenant_id") WHERE "is_default" = true AND "tenant_id" IS NOT NULL;

CREATE UNIQUE INDEX "menus_one_default_per_organization" ON "menus" USING btree ("organization_id") WHERE "is_default" = true AND "organization_id" IS NOT NULL;

