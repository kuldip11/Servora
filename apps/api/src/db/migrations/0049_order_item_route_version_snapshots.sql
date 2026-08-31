ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "station_id" uuid;
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "menu_change_event_id" uuid;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "order_items" ADD CONSTRAINT "order_items_station_id_kitchen_stations_id_fk"
    FOREIGN KEY ("station_id") REFERENCES "kitchen_stations"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_change_event_id_menu_change_events_id_fk"
    FOREIGN KEY ("menu_change_event_id") REFERENCES "menu_change_events"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
