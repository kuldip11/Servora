DO $$ BEGIN
  CREATE TYPE "order_item_status" AS ENUM ('ACTIVE', 'VOIDED', 'COMPED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "item_status" "order_item_status" NOT NULL DEFAULT 'ACTIVE';
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "voided_reason" text;
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "voided_by" uuid;
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "voided_at" timestamp;
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "comped_reason" text;
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "comped_by" uuid;
--> statement-breakpoint
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "comped_at" timestamp;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "order_items" ADD CONSTRAINT "order_items_voided_by_users_id_fk"
    FOREIGN KEY ("voided_by") REFERENCES "users"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "order_items" ADD CONSTRAINT "order_items_comped_by_users_id_fk"
    FOREIGN KEY ("comped_by") REFERENCES "users"("id") ON DELETE set null;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
INSERT INTO "permissions" ("key", "module", "description") VALUES
  ('orders:void', 'orders', 'Void order items'),
  ('orders:comp', 'orders', 'Comp order items')
ON CONFLICT ("key") DO NOTHING;
--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id", "permission_id")
SELECT r."id", p."id"
FROM "roles" r CROSS JOIN "permissions" p
WHERE r."name" IN ('OWNER', 'FRANCHISE_ADMIN', 'MANAGER')
  AND p."key" IN ('orders:void', 'orders:comp')
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
