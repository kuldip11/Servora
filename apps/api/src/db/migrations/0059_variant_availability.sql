ALTER TABLE "menu_item_variants" ADD COLUMN "status" "menu_item_status" DEFAULT 'ACTIVE' NOT NULL;
ALTER TABLE "menu_item_variants" ADD COLUMN "manual_override_status" "menu_item_status";
ALTER TABLE "menu_item_variants" ADD COLUMN "manual_override_reason" varchar(500);
