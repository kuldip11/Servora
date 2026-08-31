CREATE TABLE IF NOT EXISTS "kitchen_stations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE cascade,
  "branch_id" uuid NOT NULL REFERENCES "branches"("id") ON DELETE cascade,
  "name" varchar(100) NOT NULL,
  "printer_identifier" varchar(200),
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "kitchen_stations_tenant_branch_idx" ON "kitchen_stations" ("tenant_id", "branch_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "kitchen_stations_branch_name_unique" ON "kitchen_stations" ("branch_id", "name");
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "item_station_routing" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "menu_item_id" uuid NOT NULL REFERENCES "menu_items"("id") ON DELETE cascade,
  "station_id" uuid NOT NULL REFERENCES "kitchen_stations"("id") ON DELETE cascade,
  "modifier_option_id" uuid REFERENCES "modifier_options"("id") ON DELETE cascade,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "item_station_routing_modifier_unique" ON "item_station_routing" ("menu_item_id", "modifier_option_id") WHERE "modifier_option_id" IS NOT NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "item_station_routing_default_unique" ON "item_station_routing" ("menu_item_id") WHERE "modifier_option_id" IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "item_station_routing_station_idx" ON "item_station_routing" ("station_id");
