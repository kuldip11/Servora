ALTER TABLE "order_items" ADD COLUMN "tax_rate" numeric(5,2) DEFAULT '0' NOT NULL;
ALTER TABLE "order_items" ADD COLUMN "pricing_attribution" jsonb;
