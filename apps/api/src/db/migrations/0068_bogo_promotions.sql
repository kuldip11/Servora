ALTER TYPE "promotion_rule_type" ADD VALUE IF NOT EXISTS 'BOGO';

ALTER TABLE "promotions"
  ALTER COLUMN "value" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "trigger_menu_item_id" uuid REFERENCES "menu_items"("id") ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS "trigger_category_id" uuid REFERENCES "menu_categories"("id") ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS "reward_menu_item_id" uuid REFERENCES "menu_items"("id") ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS "reward_category_id" uuid REFERENCES "menu_categories"("id") ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS "reward_discount_percent" numeric(5,2),
  ADD COLUMN IF NOT EXISTS "trigger_quantity" integer,
  ADD COLUMN IF NOT EXISTS "reward_quantity" integer;

ALTER TABLE "promotions" DROP CONSTRAINT IF EXISTS "promotions_value_valid";
ALTER TABLE "promotions" ADD CONSTRAINT "promotions_value_valid" CHECK (
  ("rule_type"::text = 'PERCENTAGE' AND "value" > 0 AND "value" <= 100) OR
  ("rule_type"::text = 'FIXED_AMOUNT' AND "value" > 0) OR
  ("rule_type"::text = 'BOGO' AND "value" IS NULL)
);

DO $$ BEGIN
  ALTER TABLE "promotions" ADD CONSTRAINT "promotions_bogo_shape" CHECK (
    "rule_type"::text <> 'BOGO' OR (
      (("trigger_menu_item_id" IS NOT NULL)::int + ("trigger_category_id" IS NOT NULL)::int) = 1 AND
      (("reward_menu_item_id" IS NOT NULL)::int + ("reward_category_id" IS NOT NULL)::int) <= 1 AND
      "reward_discount_percent" > 0 AND "reward_discount_percent" <= 100 AND
      "trigger_quantity" > 0 AND "reward_quantity" > 0
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
