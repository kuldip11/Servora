CREATE TABLE IF NOT EXISTS "cancellation_reasons" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE cascade,
  "label" varchar(120) NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "cancellation_reasons_tenant_label_unique"
  ON "cancellation_reasons" ("tenant_id", "label");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "cancellation_reasons_tenant_active_idx"
  ON "cancellation_reasons" ("tenant_id", "is_active");
--> statement-breakpoint
ALTER TABLE "order_status_history" ADD COLUMN IF NOT EXISTS "cancellation_reason_id" uuid;
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "voided_reason_id" uuid;
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "comped_reason_id" uuid;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "order_status_history" ADD CONSTRAINT "order_status_history_cancellation_reason_id_fk"
    FOREIGN KEY ("cancellation_reason_id") REFERENCES "cancellation_reasons"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "order_items" ADD CONSTRAINT "order_items_voided_reason_id_fk"
    FOREIGN KEY ("voided_reason_id") REFERENCES "cancellation_reasons"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "order_items" ADD CONSTRAINT "order_items_comped_reason_id_fk"
    FOREIGN KEY ("comped_reason_id") REFERENCES "cancellation_reasons"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
--> statement-breakpoint
