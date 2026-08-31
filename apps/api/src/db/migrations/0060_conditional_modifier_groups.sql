ALTER TABLE "modifier_groups" ADD COLUMN "depends_on_option_id" uuid;
ALTER TABLE "modifier_groups" ADD CONSTRAINT "modifier_groups_depends_on_option_id_modifier_options_id_fk" FOREIGN KEY ("depends_on_option_id") REFERENCES "modifier_options"("id") ON DELETE SET NULL;
ALTER TABLE "modifier_options" ADD COLUMN "is_default" boolean DEFAULT false NOT NULL;
