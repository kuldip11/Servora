-- Canonical pre-v1 table migration.

CREATE TABLE "menu_item_schedules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "menu_item_id" uuid NOT NULL,
  "branch_id" uuid,
  "schedule_type" "menu_item_schedule_type" NOT NULL,
  "start_time" time,
  "end_time" time,
  "day_of_week" integer,
  "start_date" date,
  "end_date" date,
  "holiday_name" varchar(255),
  "status_during_period" "menu_item_status" DEFAULT 'ACTIVE' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "menu_item_schedules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "menu_item_schedules_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE,
  CONSTRAINT "menu_item_schedules_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE,
  CONSTRAINT "menu_item_schedules_branch_tenant_fk" FOREIGN KEY ("branch_id", "tenant_id") REFERENCES "branches"("id", "tenant_id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX "menu_schedules_menu_item_idx" ON "menu_item_schedules" USING btree ("menu_item_id");
--> statement-breakpoint
CREATE INDEX "menu_schedules_branch_idx" ON "menu_item_schedules" USING btree ("branch_id");
--> statement-breakpoint
CREATE INDEX "menu_schedules_active_idx" ON "menu_item_schedules" USING btree ("is_active");
--> statement-breakpoint
