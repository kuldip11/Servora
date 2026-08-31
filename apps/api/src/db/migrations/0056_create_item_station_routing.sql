-- Canonical pre-v1 table migration.

CREATE TABLE "item_station_routing" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "menu_item_id" uuid NOT NULL,
  "station_id" uuid NOT NULL,
  "modifier_option_id" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "item_station_routing_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE,
  CONSTRAINT "item_station_routing_station_id_kitchen_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "kitchen_stations"("id") ON DELETE CASCADE,
  CONSTRAINT "item_station_routing_modifier_option_id_modifier_options_id_fk" FOREIGN KEY ("modifier_option_id") REFERENCES "modifier_options"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX "item_station_routing_modifier_unique" ON "item_station_routing" USING btree ("menu_item_id", "modifier_option_id") WHERE "modifier_option_id" is not null;
--> statement-breakpoint
CREATE UNIQUE INDEX "item_station_routing_default_unique" ON "item_station_routing" USING btree ("menu_item_id") WHERE "modifier_option_id" is null;
--> statement-breakpoint
CREATE INDEX "item_station_routing_station_idx" ON "item_station_routing" USING btree ("station_id");
--> statement-breakpoint
