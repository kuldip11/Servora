DO $$ BEGIN
  CREATE TYPE "tax_mode" AS ENUM ('INCLUSIVE', 'EXCLUSIVE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "tenants"
  ADD COLUMN IF NOT EXISTS "default_tax_mode" tax_mode NOT NULL DEFAULT 'EXCLUSIVE';

ALTER TABLE "menu_items"
  ADD COLUMN IF NOT EXISTS "tax_mode" tax_mode NULL;

ALTER TABLE "order_items"
  ADD COLUMN IF NOT EXISTS "tax_mode" tax_mode NOT NULL DEFAULT 'EXCLUSIVE';
