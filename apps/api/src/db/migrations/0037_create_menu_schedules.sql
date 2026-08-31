

CREATE TABLE "menu_schedules" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "menu_id" uuid NOT NULL,
  "schedule_type" "menu_item_schedule_type" NOT NULL,
  "start_time" time,
  "end_time" time,
  "day_of_week" integer,
  "start_date" date,
  "end_date" date,
  "holiday_name" varchar(255),
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "menu_schedules_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "menu_schedules_menu_id_menus_id_fk" FOREIGN KEY ("menu_id") REFERENCES "menus"("id") ON DELETE CASCADE
);

CREATE INDEX "menu_schedules_menu_idx" ON "menu_schedules" USING btree ("menu_id");

