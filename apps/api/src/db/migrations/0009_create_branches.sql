

CREATE TABLE "branches" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "name" varchar(200) NOT NULL,
  "code" varchar(24) NOT NULL,
  "timezone" varchar(64) DEFAULT 'Asia/Kolkata' NOT NULL,
  "currency" varchar(3) DEFAULT 'INR' NOT NULL,
  "address" text NOT NULL,
  "phone" varchar(20),
  "is_active" boolean DEFAULT true NOT NULL,
  "dine_in_enabled" boolean DEFAULT true NOT NULL,
  "takeaway_enabled" boolean DEFAULT true NOT NULL,
  "delivery_enabled" boolean DEFAULT true NOT NULL,
  "online_enabled" boolean DEFAULT true NOT NULL,
  "tables_enabled" boolean DEFAULT true NOT NULL,
  "public_takeaway_qr_token" uuid DEFAULT gen_random_uuid() NOT NULL CONSTRAINT "branches_public_takeaway_qr_token_unique" UNIQUE,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "branches_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
);

CREATE INDEX "branches_tenant_idx" ON "branches" USING btree ("tenant_id");

CREATE UNIQUE INDEX "branches_tenant_name_uniq" ON "branches" USING btree ("tenant_id", "name");

CREATE UNIQUE INDEX "branches_tenant_code_uniq" ON "branches" USING btree ("tenant_id", "code");

CREATE UNIQUE INDEX "branches_id_tenant_unique_fk_target" ON "branches" USING btree ("id", "tenant_id");

