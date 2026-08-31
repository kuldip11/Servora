

CREATE TABLE "manager_approval_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "approved_by" uuid NOT NULL,
  "action_type" "void_comp_action" NOT NULL,
  "order_id" uuid NOT NULL,
  "order_item_id" uuid NOT NULL,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "manager_approval_tokens_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "manager_approval_tokens_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "manager_approval_tokens_lookup_idx" ON "manager_approval_tokens" USING btree ("tenant_id", "order_id", "order_item_id", "action_type");

