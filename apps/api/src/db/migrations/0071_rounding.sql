DO $$ BEGIN
  CREATE TYPE "rounding_policy" AS ENUM ('NONE', 'NEAREST_1', 'NEAREST_5', 'NEAREST_10');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "tenants"
  ADD COLUMN IF NOT EXISTS "rounding_policy" rounding_policy NOT NULL DEFAULT 'NONE';

ALTER TABLE "orders"
  ADD COLUMN IF NOT EXISTS "rounding_adjustment" numeric(10,2) NOT NULL DEFAULT 0;

ALTER TABLE "bills"
  ADD COLUMN IF NOT EXISTS "rounding_adjustment" numeric(10,2) NOT NULL DEFAULT 0;
