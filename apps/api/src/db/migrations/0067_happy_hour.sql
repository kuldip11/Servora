ALTER TABLE "price_rules"
  ADD COLUMN IF NOT EXISTS "percent_off" numeric(5,2);

ALTER TABLE "price_rules"
  ALTER COLUMN "price" DROP NOT NULL;

DO $$ BEGIN
  ALTER TABLE "price_rules"
    ADD CONSTRAINT "price_rules_value_exactly_one"
    CHECK (
      ("price" IS NOT NULL AND "percent_off" IS NULL) OR
      ("price" IS NULL AND "percent_off" IS NOT NULL AND "percent_off" > 0 AND "percent_off" <= 100)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
