

CREATE TABLE "organizations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(200) NOT NULL,
  "business_type" varchar(50),
  "country" varchar(2),
  "timezone" varchar(64),
  "currency" varchar(3),
  "primary_contact_name" varchar(150),
  "business_email" varchar(255),
  "business_phone" varchar(30),
  "address_line_1" varchar(300),
  "address_line_2" varchar(300),
  "city" varchar(120),
  "state_province" varchar(120),
  "postal_code" varchar(24),
  "legal_name" varchar(200),
  "website" varchar(500),
  "tax_registration_number" varchar(100),
  "gstin" varchar(15),
  "pan" varchar(10),
  "company_registration_number" varchar(100),
  "logo_url" varchar(1000),
  "created_by" uuid NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "organizations_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT
);

CREATE INDEX "organizations_created_by_idx" ON "organizations" USING btree ("created_by");

