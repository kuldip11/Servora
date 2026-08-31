-- E3: optional recipe/prep yield plus reason-coded waste transactions.
ALTER TABLE "recipes" ADD COLUMN "yield_percent" numeric(5,2);
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_yield_percent_check"
  CHECK ("yield_percent" IS NULL OR ("yield_percent" > 0 AND "yield_percent" <= 100));
ALTER TABLE "sub_recipes" ADD COLUMN "yield_percent" numeric(5,2);
ALTER TABLE "sub_recipes" ADD CONSTRAINT "sub_recipes_yield_percent_check"
  CHECK ("yield_percent" IS NULL OR ("yield_percent" > 0 AND "yield_percent" <= 100));
--> statement-breakpoint
CREATE TABLE "waste_reasons" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "label" varchar(200) NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "waste_reasons" ADD CONSTRAINT "waste_reasons_tenant_id_tenants_id_fk"
  FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "waste_reasons_tenant_idx" ON "waste_reasons" USING btree ("tenant_id");
--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD COLUMN "waste_reason_id" uuid;
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_waste_reason_id_waste_reasons_id_fk"
  FOREIGN KEY ("waste_reason_id") REFERENCES "public"."waste_reasons"("id") ON DELETE set null ON UPDATE no action;
CREATE INDEX "inventory_transactions_waste_reason_idx" ON "inventory_transactions" USING btree ("waste_reason_id");
