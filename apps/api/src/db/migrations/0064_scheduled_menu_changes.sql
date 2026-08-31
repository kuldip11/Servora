ALTER TABLE "menu_items" ADD COLUMN "effective_from" timestamp;
ALTER TABLE "menus" ADD COLUMN "effective_from" timestamp;
ALTER TABLE "price_rules" ADD COLUMN "effective_from" timestamp;
