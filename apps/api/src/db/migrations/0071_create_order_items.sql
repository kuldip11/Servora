

CREATE TABLE "order_items" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL,
  "kitchen_ticket_id" uuid NOT NULL,
  "menu_item_id" uuid,
  "combo_id" uuid,
  "combo_group_id" uuid,
  "combo_slot_option_id" uuid,
  "menu_item_name" varchar(200) NOT NULL,
  "variant_id" uuid,
  "variant_name" varchar(100),
  "quantity" integer NOT NULL,
  "weight_quantity" numeric(12, 4),
  "weight_unit" "weight_unit",
  "manual_price" numeric(10, 2),
  "billing_excluded" boolean DEFAULT false NOT NULL,
  "unit_price" numeric(10, 2) NOT NULL,
  "subtotal" numeric(10, 2) NOT NULL,
  "tax_rate" numeric(5, 2) DEFAULT '0' NOT NULL,
  "tax_mode" "tax_mode" DEFAULT 'EXCLUSIVE' NOT NULL,
  "pricing_attribution" jsonb,
  "chef_notes" text,
  "seat_label" varchar(50),
  "fulfillment_type" "order_item_fulfillment_type" DEFAULT 'DINE_IN' NOT NULL,
  "station_id" uuid,
  "menu_change_event_id" uuid,
  "resolution_as_of" timestamp,
  "availability_snapshot" jsonb,
  "pricing_replay_evidence" jsonb,
  "availability_replay_evidence" jsonb,
  "item_status" "order_item_status" DEFAULT 'ACTIVE' NOT NULL,
  "refires_order_item_id" uuid,
  "refire_reason" text,
  "refire_type" "refire_type",
  "refired_by" uuid,
  "refired_at" timestamp,
  "voided_reason" text,
  "voided_by" uuid,
  "voided_at" timestamp,
  "voided_reason_id" uuid,
  "comped_reason" text,
  "comped_by" uuid,
  "comped_at" timestamp,
  "comped_reason_id" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "order_items_menu_item_replay_evidence_required" CHECK ("menu_item_id" IS NULL OR ("resolution_as_of" IS NOT NULL AND "availability_snapshot" IS NOT NULL AND "pricing_replay_evidence" IS NOT NULL AND "availability_replay_evidence" IS NOT NULL)),
  CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE,
  CONSTRAINT "order_items_kitchen_ticket_id_kitchen_tickets_id_fk" FOREIGN KEY ("kitchen_ticket_id") REFERENCES "kitchen_tickets"("id") ON DELETE CASCADE,
  CONSTRAINT "order_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id"),
  CONSTRAINT "order_items_combo_id_combos_id_fk" FOREIGN KEY ("combo_id") REFERENCES "combos"("id"),
  CONSTRAINT "order_items_combo_slot_option_id_combo_slot_options_id_fk" FOREIGN KEY ("combo_slot_option_id") REFERENCES "combo_slot_options"("id") ON DELETE SET NULL,
  CONSTRAINT "order_items_variant_id_menu_item_variants_id_fk" FOREIGN KEY ("variant_id") REFERENCES "menu_item_variants"("id"),
  CONSTRAINT "order_items_station_id_kitchen_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "kitchen_stations"("id") ON DELETE SET NULL,
  CONSTRAINT "order_items_menu_change_event_id_menu_change_events_id_fk" FOREIGN KEY ("menu_change_event_id") REFERENCES "menu_change_events"("id") ON DELETE SET NULL,
  CONSTRAINT "order_items_refires_order_item_id_order_items_id_fk" FOREIGN KEY ("refires_order_item_id") REFERENCES "order_items"("id") ON DELETE SET NULL,
  CONSTRAINT "order_items_refired_by_users_id_fk" FOREIGN KEY ("refired_by") REFERENCES "users"("id"),
  CONSTRAINT "order_items_voided_by_users_id_fk" FOREIGN KEY ("voided_by") REFERENCES "users"("id"),
  CONSTRAINT "order_items_voided_reason_id_cancellation_reasons_id_fk" FOREIGN KEY ("voided_reason_id") REFERENCES "cancellation_reasons"("id") ON DELETE SET NULL,
  CONSTRAINT "order_items_comped_by_users_id_fk" FOREIGN KEY ("comped_by") REFERENCES "users"("id"),
  CONSTRAINT "order_items_comped_reason_id_cancellation_reasons_id_fk" FOREIGN KEY ("comped_reason_id") REFERENCES "cancellation_reasons"("id") ON DELETE SET NULL
);

CREATE INDEX "order_items_combo_group_idx" ON "order_items" USING btree ("combo_group_id");

CREATE INDEX "order_items_combo_slot_option_idx" ON "order_items" USING btree ("combo_slot_option_id");

CREATE INDEX "order_items_refires_idx" ON "order_items" USING btree ("refires_order_item_id");

CREATE INDEX "order_items_resolution_as_of_idx" ON "order_items" USING btree ("resolution_as_of");

