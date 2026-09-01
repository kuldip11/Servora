

CREATE TABLE "waste_reasons" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "label" varchar(200) NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "waste_reasons_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
);

CREATE INDEX "waste_reasons_tenant_idx" ON "waste_reasons" USING btree ("tenant_id");

CREATE INDEX "waste_reasons_tenant_active_idx" ON "waste_reasons" USING btree ("tenant_id", "is_active");

CREATE UNIQUE INDEX "waste_reasons_tenant_label_unique" ON "waste_reasons" USING btree ("tenant_id", "label");

