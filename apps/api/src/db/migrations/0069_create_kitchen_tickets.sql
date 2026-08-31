

CREATE TABLE "kitchen_tickets" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "branch_id" uuid NOT NULL,
  "order_id" uuid NOT NULL,
  "ticket_number" integer NOT NULL,
  "status" "kitchen_ticket_status" DEFAULT 'FIRED' NOT NULL,
  "course_id" uuid,
  "notes" text,
  "customer_request_id" varchar(128),
  "fired_at" timestamp DEFAULT now(),
  "ready_at" timestamp,
  "served_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "kitchen_tickets_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "kitchen_tickets_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE,
  CONSTRAINT "kitchen_tickets_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE,
  CONSTRAINT "kitchen_tickets_course_id_order_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "order_courses"("id") ON DELETE SET NULL,
  CONSTRAINT "kitchen_tickets_branch_tenant_fk" FOREIGN KEY ("branch_id", "tenant_id") REFERENCES "branches"("id", "tenant_id") ON DELETE CASCADE
);

CREATE INDEX "kitchen_tickets_tenant_branch_idx" ON "kitchen_tickets" USING btree ("tenant_id", "branch_id");

CREATE INDEX "kitchen_tickets_status_idx" ON "kitchen_tickets" USING btree ("status");

CREATE INDEX "kitchen_tickets_order_idx" ON "kitchen_tickets" USING btree ("order_id");

CREATE INDEX "kitchen_tickets_course_idx" ON "kitchen_tickets" USING btree ("course_id");

CREATE UNIQUE INDEX "kitchen_tickets_customer_request_unique" ON "kitchen_tickets" USING btree ("order_id", "customer_request_id");

