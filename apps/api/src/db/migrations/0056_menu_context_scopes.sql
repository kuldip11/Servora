ALTER TABLE "menus" ADD COLUMN IF NOT EXISTS "available_channels" text[];
--> statement-breakpoint
ALTER TABLE "menus" ADD COLUMN IF NOT EXISTS "available_fulfillment_types" text[];
--> statement-breakpoint
ALTER TABLE "menus" ADD COLUMN IF NOT EXISTS "available_branch_ids" uuid[];
