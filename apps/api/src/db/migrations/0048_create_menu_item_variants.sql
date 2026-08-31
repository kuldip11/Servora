-- Canonical pre-v1 table migration.

CREATE TABLE "menu_item_variants" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "menu_item_id" uuid NOT NULL,
  "name" varchar(100) NOT NULL,
  "price" numeric(10, 2) DEFAULT '0' NOT NULL,
  "status" "menu_item_status" DEFAULT 'ACTIVE' NOT NULL,
  "manual_override_status" "menu_item_status",
  "manual_override_reason" varchar(500),
  "manual_stock_count" integer,
  "manual_stock_count_updated_at" timestamp,
  CONSTRAINT "menu_item_variants_manual_stock_count_nonnegative" CHECK ("manual_stock_count" IS NULL OR "manual_stock_count" >= 0),
  CONSTRAINT "menu_item_variants_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX "menu_item_variants_manual_stock_count_idx" ON "menu_item_variants" USING btree ("manual_stock_count") WHERE "manual_stock_count" IS NOT NULL;
--> statement-breakpoint
