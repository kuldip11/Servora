

CREATE TABLE "restaurant_tables" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "branch_id" uuid NOT NULL,
  "name" varchar(50) NOT NULL,
  "public_qr_token" uuid DEFAULT gen_random_uuid() NOT NULL,
  "capacity" integer DEFAULT 4 NOT NULL,
  "status" "table_status" DEFAULT 'AVAILABLE' NOT NULL,
  "section" varchar(50),
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "restaurant_tables_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "restaurant_tables_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE,
  CONSTRAINT "restaurant_tables_branch_tenant_fk" FOREIGN KEY ("branch_id", "tenant_id") REFERENCES "branches"("id", "tenant_id") ON DELETE CASCADE
);

CREATE INDEX "tables_tenant_branch_idx" ON "restaurant_tables" USING btree ("tenant_id", "branch_id");

CREATE UNIQUE INDEX "tables_public_qr_token_uniq" ON "restaurant_tables" USING btree ("public_qr_token");

