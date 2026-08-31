-- Canonical pre-v1 table migration.

CREATE TABLE "cancellation_reasons" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "label" varchar(120) NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "cancellation_reasons_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX "cancellation_reasons_tenant_label_unique" ON "cancellation_reasons" USING btree ("tenant_id", "label");
--> statement-breakpoint
CREATE INDEX "cancellation_reasons_tenant_active_idx" ON "cancellation_reasons" USING btree ("tenant_id", "is_active");
--> statement-breakpoint
