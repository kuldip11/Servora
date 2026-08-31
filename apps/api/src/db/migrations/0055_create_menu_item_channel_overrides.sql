-- Canonical pre-v1 table migration.

CREATE TABLE "menu_item_channel_overrides" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "menu_item_id" uuid NOT NULL,
  "channel" text NOT NULL,
  "fulfillment_type" text,
  "status" "menu_item_status",
  "is_hidden" boolean DEFAULT false NOT NULL,
  "availability_reason" varchar(500),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "menu_item_channel_overrides_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "menu_item_channel_overrides_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX "menu_item_channel_overrides_item_channel_idx" ON "menu_item_channel_overrides" USING btree ("menu_item_id", "channel");
--> statement-breakpoint
CREATE UNIQUE INDEX "menu_item_channel_overrides_scope_unique" ON "menu_item_channel_overrides" USING btree ("menu_item_id", "channel", COALESCE("fulfillment_type", ''));
--> statement-breakpoint
