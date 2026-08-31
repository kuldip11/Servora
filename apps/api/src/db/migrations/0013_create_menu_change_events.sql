-- Canonical pre-v1 table migration.

CREATE TABLE "menu_change_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "entity_type" "menu_change_entity_type" NOT NULL,
  "entity_id" uuid NOT NULL,
  "change_type" "menu_change_type" NOT NULL,
  "diff" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "changed_by" uuid,
  "changed_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "menu_change_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "menu_change_events_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX "menu_change_events_entity_history_idx" ON "menu_change_events" USING btree ("tenant_id", "entity_type", "entity_id", "changed_at");
--> statement-breakpoint
CREATE INDEX "menu_change_events_tenant_time_idx" ON "menu_change_events" USING btree ("tenant_id", "changed_at");
--> statement-breakpoint
