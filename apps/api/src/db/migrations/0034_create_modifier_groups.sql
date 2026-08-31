-- Canonical pre-v1 table migration.

CREATE TABLE "modifier_groups" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "branch_id" uuid,
  "name" varchar(100) NOT NULL,
  "selection_type" "modifier_selection_type" DEFAULT 'SINGLE' NOT NULL,
  "group_type" "modifier_group_type" DEFAULT 'ADDON' NOT NULL,
  "min_selections" integer DEFAULT 0 NOT NULL,
  "max_selections" integer,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "depends_on_option_id" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "modifier_groups_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "modifier_groups_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE,
  CONSTRAINT "modifier_groups_branch_tenant_fk" FOREIGN KEY ("branch_id", "tenant_id") REFERENCES "branches"("id", "tenant_id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX "modifier_groups_tenant_idx" ON "modifier_groups" USING btree ("tenant_id");
--> statement-breakpoint
