CREATE TABLE "menu_item_channel_overrides" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "menu_item_id" uuid NOT NULL REFERENCES "menu_items"("id") ON DELETE CASCADE,
  "channel" text NOT NULL,
  "fulfillment_type" text,
  "status" "menu_item_status",
  "is_hidden" boolean DEFAULT false NOT NULL,
  "availability_reason" varchar(500),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX "menu_item_channel_overrides_item_channel_idx" ON "menu_item_channel_overrides" ("menu_item_id", "channel");
CREATE UNIQUE INDEX "menu_item_channel_overrides_scope_unique" ON "menu_item_channel_overrides" ("menu_item_id", "channel", COALESCE("fulfillment_type", ''));
