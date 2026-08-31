CREATE TYPE "menu_item_display_mode" AS ENUM ('STANDARD', 'GUIDED_BUILDER');
ALTER TABLE "menu_items" ADD COLUMN "display_mode" "menu_item_display_mode" DEFAULT 'STANDARD' NOT NULL;
