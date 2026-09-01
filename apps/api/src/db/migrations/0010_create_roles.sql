

CREATE TABLE "roles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid,
  "name" varchar(80) NOT NULL,
  "scope" "role_scope" DEFAULT 'BRANCH' NOT NULL,
  "description" text,
  "is_system" boolean DEFAULT false NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "roles_custom_scope_check" CHECK ("tenant_id" IS NULL OR "scope" IN ('TENANT', 'BRANCH')),
  CONSTRAINT "roles_reserved_system_name_check" CHECK ("tenant_id" IS NULL OR upper(trim("name")) NOT IN ('OWNER', 'FRANCHISE_ADMIN', 'MANAGER', 'CHEF', 'WAITER', 'CASHIER', 'INVENTORY_MANAGER', 'RECEPTIONIST', 'ACCOUNTANT')),
  CONSTRAINT "roles_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
);

CREATE INDEX "roles_tenant_active_idx" ON "roles" USING btree ("tenant_id", "is_active");

CREATE UNIQUE INDEX "roles_system_name_scope_uniq" ON "roles" USING btree (lower("name"), "scope") WHERE "tenant_id" IS NULL;

CREATE UNIQUE INDEX "roles_tenant_name_scope_uniq" ON "roles" USING btree ("tenant_id", lower("name"), "scope") WHERE "tenant_id" IS NOT NULL;

INSERT INTO "roles" ("name", "scope", "description", "is_system") VALUES
  ('OWNER','GLOBAL','Global owner access',true),
  ('FRANCHISE_ADMIN','TENANT','Tenant-wide administration access',true),
  ('MANAGER','BRANCH','Branch management access',true),
  ('CHEF','BRANCH','Kitchen operations access',true),
  ('WAITER','BRANCH','Order management access',true),
  ('CASHIER','BRANCH','Billing and payments access',true),
  ('INVENTORY_MANAGER','BRANCH','Inventory management access',true),
  ('RECEPTIONIST','BRANCH','Table and reservation management',true),
  ('ACCOUNTANT','BRANCH','Financial reports access',true);

