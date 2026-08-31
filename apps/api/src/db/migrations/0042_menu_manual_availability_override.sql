ALTER TABLE "menu_items" ADD COLUMN "manual_override_status" "menu_item_status";
ALTER TABLE "menu_items" ADD COLUMN "manual_override_reason" varchar(500);
ALTER TABLE "menu_items" ADD COLUMN "manual_override_set_by" uuid;
ALTER TABLE "menu_items" ADD COLUMN "manual_override_set_at" timestamp;
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_manual_override_set_by_users_id_fk"
  FOREIGN KEY ("manual_override_set_by") REFERENCES "public"."users"("id")
  ON DELETE SET NULL ON UPDATE NO ACTION;
