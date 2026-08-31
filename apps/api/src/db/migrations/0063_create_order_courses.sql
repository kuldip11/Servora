-- Canonical pre-v1 table migration.

CREATE TABLE "order_courses" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL,
  "course_number" integer NOT NULL,
  "name" varchar(100),
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "order_courses_number_positive" CHECK ("course_number" > 0),
  CONSTRAINT "order_courses_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX "order_courses_order_number_unique" ON "order_courses" USING btree ("order_id", "course_number");
--> statement-breakpoint
CREATE INDEX "order_courses_order_idx" ON "order_courses" USING btree ("order_id");
--> statement-breakpoint
