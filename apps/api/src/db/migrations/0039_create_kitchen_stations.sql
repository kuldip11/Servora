

CREATE TABLE "kitchen_stations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "branch_id" uuid NOT NULL,
  "name" varchar(100) NOT NULL,
  "printer_identifier" varchar(200),
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "kitchen_stations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "kitchen_stations_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE
);

CREATE INDEX "kitchen_stations_tenant_branch_idx" ON "kitchen_stations" USING btree ("tenant_id", "branch_id");

CREATE UNIQUE INDEX "kitchen_stations_branch_name_unique" ON "kitchen_stations" USING btree ("branch_id", "name");

