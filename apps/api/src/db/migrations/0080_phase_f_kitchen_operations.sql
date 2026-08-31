-- Phase F — Kitchen Operations foundation (F2/F3).
ALTER TYPE "kitchen_ticket_status" ADD VALUE IF NOT EXISTS 'HELD';
ALTER TYPE "order_item_status" ADD VALUE IF NOT EXISTS 'REFIRED';

CREATE TABLE IF NOT EXISTS "order_courses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
  "course_number" integer NOT NULL,
  "name" varchar(100),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "order_courses_number_positive" CHECK ("course_number" > 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS "order_courses_order_number_unique" ON "order_courses" ("order_id", "course_number");
CREATE INDEX IF NOT EXISTS "order_courses_order_idx" ON "order_courses" ("order_id");

ALTER TABLE "kitchen_tickets" ADD COLUMN IF NOT EXISTS "course_id" uuid REFERENCES "order_courses"("id") ON DELETE SET NULL;
ALTER TABLE "kitchen_tickets" ALTER COLUMN "fired_at" DROP NOT NULL;
CREATE INDEX IF NOT EXISTS "kitchen_tickets_course_idx" ON "kitchen_tickets" ("course_id");

ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "refires_order_item_id" uuid REFERENCES "order_items"("id") ON DELETE SET NULL;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "refire_reason" text;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "refired_by" uuid REFERENCES "users"("id") ON DELETE SET NULL;
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "refired_at" timestamp;
CREATE INDEX IF NOT EXISTS "order_items_refires_idx" ON "order_items" ("refires_order_item_id");
