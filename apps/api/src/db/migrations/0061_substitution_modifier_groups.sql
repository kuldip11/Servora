CREATE TYPE "modifier_group_type" AS ENUM ('ADDON', 'SUBSTITUTION');
ALTER TABLE "modifier_groups" ADD COLUMN "group_type" "modifier_group_type" DEFAULT 'ADDON' NOT NULL;
ALTER TABLE "modifier_options" ADD COLUMN "replaces_default_component" varchar(200);
