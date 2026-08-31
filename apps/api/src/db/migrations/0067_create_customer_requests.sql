-- Canonical pre-v1 table migration.

CREATE TABLE "customer_requests" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "branch_id" uuid NOT NULL,
  "table_id" uuid NOT NULL,
  "customer_session_id" uuid NOT NULL,
  "order_id" uuid,
  "type" "customer_request_type" NOT NULL,
  "status" "customer_request_status" DEFAULT 'OPEN' NOT NULL,
  "note" text,
  "resolved_by" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "customer_requests_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "customer_requests_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE,
  CONSTRAINT "customer_requests_table_id_restaurant_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "restaurant_tables"("id") ON DELETE CASCADE,
  CONSTRAINT "customer_requests_customer_session_id_customer_sessions_id_fk" FOREIGN KEY ("customer_session_id") REFERENCES "customer_sessions"("id") ON DELETE CASCADE,
  CONSTRAINT "customer_requests_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL,
  CONSTRAINT "customer_requests_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL
);
--> statement-breakpoint
CREATE INDEX "customer_requests_branch_status_idx" ON "customer_requests" USING btree ("branch_id", "status");
--> statement-breakpoint
CREATE INDEX "customer_requests_session_idx" ON "customer_requests" USING btree ("customer_session_id");
--> statement-breakpoint
