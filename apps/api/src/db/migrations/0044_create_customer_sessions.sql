

CREATE TABLE "customer_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "branch_id" uuid NOT NULL,
  "table_id" uuid,
  "mode" "customer_session_mode" DEFAULT 'DINE_IN' NOT NULL,
  "token" uuid DEFAULT gen_random_uuid() NOT NULL CONSTRAINT "customer_sessions_token_unique" UNIQUE,
  "active" boolean DEFAULT true NOT NULL,
  "expires_at" timestamp NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "customer_sessions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "customer_sessions_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE,
  CONSTRAINT "customer_sessions_table_id_restaurant_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "restaurant_tables"("id") ON DELETE CASCADE
);

CREATE INDEX "customer_sessions_token_idx" ON "customer_sessions" USING btree ("token");

CREATE INDEX "customer_sessions_table_active_idx" ON "customer_sessions" USING btree ("table_id", "active");

CREATE INDEX "customer_sessions_branch_mode_idx" ON "customer_sessions" USING btree ("branch_id", "mode", "active");

