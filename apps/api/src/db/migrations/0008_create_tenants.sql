

CREATE TABLE "tenants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(200) NOT NULL,
  "display_name" varchar(200),
  "description" text,
  "cuisine_types" jsonb,
  "business_model" varchar(50),
  "default_currency" varchar(3),
  "default_timezone" varchar(64),
  "support_email" varchar(255),
  "support_phone" varchar(30),
  "website" varchar(500),
  "logo_url" varchar(1000),
  "primary_brand_image_url" varchar(1000),
  "created_by" uuid NOT NULL,
  "organization_id" uuid NOT NULL,
  "plan" varchar(50) DEFAULT 'starter' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "service_charge_percent" numeric(5, 2),
  "service_charge_taxable" boolean DEFAULT false NOT NULL,
  "rounding_policy" "rounding_policy" DEFAULT 'NONE' NOT NULL,
  "default_tax_mode" "tax_mode" DEFAULT 'EXCLUSIVE' NOT NULL,
  "default_tax_rate" numeric(5, 2),
  "dine_in_enabled" boolean DEFAULT true NOT NULL,
  "takeaway_enabled" boolean DEFAULT true NOT NULL,
  "delivery_enabled" boolean DEFAULT true NOT NULL,
  "customer_qr_enabled" boolean DEFAULT true NOT NULL,
  "table_management_enabled" boolean DEFAULT true NOT NULL,
  "kds_enabled" boolean DEFAULT true NOT NULL,
  "waiter_service_enabled" boolean DEFAULT true NOT NULL,
  "course_sequencing_enabled" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "tenants_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE RESTRICT
);

CREATE INDEX "tenants_organization_idx" ON "tenants" USING btree ("organization_id");

