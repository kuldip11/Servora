

CREATE TABLE "holidays" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "name" varchar(255) NOT NULL,
  "holiday_date" date NOT NULL,
  "region" varchar(100),
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "holidays_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "holidays_tenant_date_region_unique" ON "holidays" USING btree ("tenant_id", "holiday_date", "region");

