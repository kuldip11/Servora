-- Canonical pre-v1 table migration.

CREATE TABLE "menu_tags" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "name" varchar(50) NOT NULL,
  "color" varchar(20),
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "menu_tags_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
);
--> statement-breakpoint
