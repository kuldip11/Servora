-- Canonical pre-v1 table migration.

CREATE TABLE "combo_slot_options" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "slot_id" uuid NOT NULL,
  "menu_item_id" uuid NOT NULL,
  "variant_id" uuid,
  "upcharge" numeric(10, 2) DEFAULT '0' NOT NULL,
  "is_unlimited_refill" boolean DEFAULT false NOT NULL,
  CONSTRAINT "combo_slot_options_slot_id_combo_slots_id_fk" FOREIGN KEY ("slot_id") REFERENCES "combo_slots"("id") ON DELETE CASCADE,
  CONSTRAINT "combo_slot_options_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id"),
  CONSTRAINT "combo_slot_options_variant_id_menu_item_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "menu_item_variants"("id")
);
--> statement-breakpoint
