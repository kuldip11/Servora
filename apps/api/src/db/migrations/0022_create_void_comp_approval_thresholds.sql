-- Canonical pre-v1 table migration.

CREATE TABLE "void_comp_approval_thresholds" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "action_type" "void_comp_action" NOT NULL,
  "threshold_amount" numeric(12, 2) NOT NULL,
  "requires_role" varchar(50) DEFAULT 'Manager' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "void_comp_approval_thresholds_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX "void_comp_threshold_tenant_action_unique" ON "void_comp_approval_thresholds" USING btree ("tenant_id", "action_type");
--> statement-breakpoint
