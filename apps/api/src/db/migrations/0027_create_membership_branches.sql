-- Canonical pre-v1 table migration.

CREATE TABLE "membership_branches" (
  "membership_id" uuid NOT NULL,
  "tenant_id" uuid NOT NULL,
  "branch_id" uuid NOT NULL,
  "assigned_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "membership_branches_membership_id_tenant_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "tenant_memberships"("id") ON DELETE CASCADE,
  CONSTRAINT "membership_branches_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "membership_branches_branch_id_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "branches"("id") ON DELETE CASCADE,
  CONSTRAINT "membership_branches_branch_tenant_fk" FOREIGN KEY ("branch_id", "tenant_id") REFERENCES "branches"("id", "tenant_id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX "membership_branches_membership_branch_uniq" ON "membership_branches" USING btree ("membership_id", "branch_id");
--> statement-breakpoint
CREATE INDEX "membership_branches_membership_idx" ON "membership_branches" USING btree ("membership_id");
--> statement-breakpoint
CREATE INDEX "membership_branches_branch_idx" ON "membership_branches" USING btree ("branch_id");
--> statement-breakpoint
CREATE INDEX "membership_branches_tenant_idx" ON "membership_branches" USING btree ("tenant_id");
--> statement-breakpoint
