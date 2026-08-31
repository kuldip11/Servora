ALTER TABLE "tenants"
  ADD COLUMN IF NOT EXISTS "service_charge_percent" numeric(5,2),
  ADD COLUMN IF NOT EXISTS "service_charge_taxable" boolean NOT NULL DEFAULT false;

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "service_charge_amount" numeric(10,2) NOT NULL DEFAULT 0;

ALTER TABLE "bills"
  ADD COLUMN IF NOT EXISTS "service_charge_amount" numeric(10,2) NOT NULL DEFAULT 0;
