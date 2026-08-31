-- Phase E hardening: prepared components consume branch-scoped physical stock,
-- so make their branch affinity explicit instead of silently skipping raw
-- ingredients from another branch at resolution time.
ALTER TABLE "sub_recipes" ADD COLUMN "branch_id" uuid NOT NULL;
ALTER TABLE "sub_recipes" ADD CONSTRAINT "sub_recipes_branch_id_branches_id_fk"
  FOREIGN KEY ("branch_id") REFERENCES "public"."branches"("id") ON DELETE cascade ON UPDATE no action;
CREATE INDEX "sub_recipes_tenant_branch_idx" ON "sub_recipes" USING btree ("tenant_id", "branch_id");
--> statement-breakpoint
-- E3 mirrors the cancellation-reason lookup shape: labels are unique per
-- tenant and active-reason listing has its own composite index.
CREATE INDEX "waste_reasons_tenant_active_idx" ON "waste_reasons" USING btree ("tenant_id", "is_active");
CREATE UNIQUE INDEX "waste_reasons_tenant_label_unique" ON "waste_reasons" USING btree ("tenant_id", "label");
