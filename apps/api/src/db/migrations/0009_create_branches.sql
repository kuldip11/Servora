

CREATE TABLE "branches" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "name" varchar(200) NOT NULL,
  "code" varchar(24) NOT NULL,
  "timezone" varchar(64) DEFAULT 'Asia/Kolkata' NOT NULL,
  "currency" varchar(3) DEFAULT 'INR' NOT NULL,
  "address" text NOT NULL,
  "address_line_1" varchar(300),
  "address_line_2" varchar(300),
  "city" varchar(120),
  "state_province" varchar(120),
  "postal_code" varchar(24),
  "country" varchar(2),
  "phone" varchar(30),
  "manager_name" varchar(150),
  "email" varchar(255),
  "opening_time" varchar(5),
  "closing_time" varchar(5),
  "weekly_operating_days" jsonb,
  "tax_override" numeric(5, 2),
  "service_charge_override" numeric(5, 2),
  "invoice_prefix" varchar(30),
  "receipt_footer" text,
  "inventory_tracking_enabled" boolean DEFAULT true NOT NULL,
  "negative_stock_policy" varchar(20) DEFAULT 'BLOCK' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "dine_in_enabled" boolean DEFAULT true NOT NULL,
  "takeaway_enabled" boolean DEFAULT true NOT NULL,
  "delivery_enabled" boolean DEFAULT true NOT NULL,
  "online_enabled" boolean DEFAULT true NOT NULL,
  "tables_enabled" boolean DEFAULT true NOT NULL,
  "customer_qr_enabled" boolean DEFAULT true NOT NULL,
  "kds_enabled" boolean DEFAULT true NOT NULL,
  "waiter_app_enabled" boolean DEFAULT true NOT NULL,
  "public_takeaway_qr_token" uuid DEFAULT gen_random_uuid() NOT NULL CONSTRAINT "branches_public_takeaway_qr_token_unique" UNIQUE,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "branches_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
);

CREATE INDEX "branches_tenant_idx" ON "branches" USING btree ("tenant_id");

CREATE UNIQUE INDEX "branches_tenant_name_uniq" ON "branches" USING btree ("tenant_id", "name");

CREATE UNIQUE INDEX "branches_tenant_code_uniq" ON "branches" USING btree ("tenant_id", "code");

CREATE UNIQUE INDEX "branches_id_tenant_unique_fk_target" ON "branches" USING btree ("id", "tenant_id");

