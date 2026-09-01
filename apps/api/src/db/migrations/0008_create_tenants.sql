

CREATE TABLE "tenants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(200) NOT NULL,
  "created_by" uuid NOT NULL,
  "organization_id" uuid NOT NULL,
  "plan" varchar(50) DEFAULT 'starter' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "service_charge_percent" numeric(5, 2),
  "service_charge_taxable" boolean DEFAULT false NOT NULL,
  "rounding_policy" "rounding_policy" DEFAULT 'NONE' NOT NULL,
  "default_tax_mode" "tax_mode" DEFAULT 'EXCLUSIVE' NOT NULL,
  "course_sequencing_enabled" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "tenants_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT
);

CREATE INDEX "tenants_organization_idx" ON "tenants" USING btree ("organization_id");

