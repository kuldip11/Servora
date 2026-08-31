CREATE TABLE "menu_schedules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
  "menu_id" uuid NOT NULL REFERENCES "menus"("id") ON DELETE CASCADE,
  "schedule_type" "menu_item_schedule_type" NOT NULL,
  "start_time" time, "end_time" time, "day_of_week" integer,
  "start_date" date, "end_date" date, "holiday_name" varchar(255),
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX "menu_schedules_menu_idx" ON "menu_schedules" ("menu_id");
