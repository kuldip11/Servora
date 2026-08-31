DO $$ BEGIN
  CREATE TYPE "menu_change_entity_type" AS ENUM (
    'MENU_ITEM', 'VARIANT', 'MODIFIER_GROUP', 'MODIFIER_OPTION', 'CATEGORY',
    'MENU', 'MENU_MEMBERSHIP', 'PRICE_RULE', 'RECIPE', 'TEMPLATE', 'AVAILABILITY', 'TAG'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "menu_change_type" AS ENUM ('CREATED', 'UPDATED', 'PUBLISHED', 'ARCHIVED', 'DELETED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "menu_change_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE cascade,
  "entity_type" "menu_change_entity_type" NOT NULL,
  "entity_id" uuid NOT NULL,
  "change_type" "menu_change_type" NOT NULL,
  "diff" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "changed_by" uuid REFERENCES "users"("id") ON DELETE set null,
  "changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "menu_change_events_entity_history_idx"
  ON "menu_change_events" ("tenant_id", "entity_type", "entity_id", "changed_at" DESC);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "menu_change_events_tenant_time_idx"
  ON "menu_change_events" ("tenant_id", "changed_at" DESC);
