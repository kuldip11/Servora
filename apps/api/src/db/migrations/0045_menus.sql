CREATE TYPE "public"."menu_status" AS ENUM('DRAFT', 'PUBLISHED');
CREATE TABLE "menus" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "name" varchar(200) NOT NULL,
  "description" text,
  "status" "menu_status" DEFAULT 'DRAFT' NOT NULL,
  "is_default" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "menus_tenant_name_unique" UNIQUE("tenant_id", "name")
);
ALTER TABLE "menus" ADD CONSTRAINT "menus_tenant_id_tenants_id_fk"
  FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE CASCADE;
CREATE INDEX "menus_tenant_status_idx" ON "menus" USING btree ("tenant_id", "status");
CREATE UNIQUE INDEX "menus_one_default_per_tenant" ON "menus" USING btree ("tenant_id") WHERE "is_default" = true;
