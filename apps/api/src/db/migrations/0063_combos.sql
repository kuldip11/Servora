CREATE TYPE "combo_price_policy" AS ENUM ('FIXED', 'PERCENT_OFF_SUM');
CREATE TABLE "combos" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE, "name" varchar(200) NOT NULL, "description" text, "price_policy" "combo_price_policy" NOT NULL, "fixed_price" numeric(10,2), "percent_off" numeric(5,2), "status" "menu_item_status" DEFAULT 'ACTIVE' NOT NULL, "created_at" timestamp DEFAULT now() NOT NULL, "updated_at" timestamp DEFAULT now() NOT NULL);
CREATE TABLE "combo_slots" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "combo_id" uuid NOT NULL REFERENCES "combos"("id") ON DELETE CASCADE, "name" varchar(150) NOT NULL, "min_selections" integer DEFAULT 1 NOT NULL, "max_selections" integer DEFAULT 1 NOT NULL, "sort_order" integer DEFAULT 0 NOT NULL);
CREATE TABLE "combo_slot_options" ("id" uuid PRIMARY KEY DEFAULT gen_random_uuid(), "slot_id" uuid NOT NULL REFERENCES "combo_slots"("id") ON DELETE CASCADE, "menu_item_id" uuid NOT NULL REFERENCES "menu_items"("id"), "variant_id" uuid REFERENCES "menu_item_variants"("id"), "upcharge" numeric(10,2) DEFAULT 0 NOT NULL);
ALTER TABLE "order_items" ADD COLUMN "combo_id" uuid REFERENCES "combos"("id") ON DELETE SET NULL;
ALTER TABLE "order_items" ADD COLUMN "combo_group_id" uuid;
CREATE INDEX "order_items_combo_group_idx" ON "order_items" ("combo_group_id");
