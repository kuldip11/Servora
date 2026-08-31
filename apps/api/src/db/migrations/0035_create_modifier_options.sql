-- Canonical pre-v1 table migration.

CREATE TABLE "modifier_options" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "modifier_group_id" uuid NOT NULL,
  "name" varchar(100) NOT NULL,
  "additional_price" numeric(10, 2) DEFAULT '0' NOT NULL,
  "computed_availability" boolean DEFAULT true NOT NULL,
  "manual_override_availability" boolean,
  "max_quantity" integer DEFAULT 1 NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "is_default" boolean DEFAULT false NOT NULL,
  "replaces_default_component" varchar(200),
  CONSTRAINT "modifier_options_modifier_group_id_modifier_groups_id_fk" FOREIGN KEY ("modifier_group_id") REFERENCES "modifier_groups"("id") ON DELETE CASCADE
);
--> statement-breakpoint

ALTER TABLE "modifier_groups" ADD CONSTRAINT "modifier_groups_depends_on_option_id_modifier_options_id_fk" FOREIGN KEY ("depends_on_option_id") REFERENCES "modifier_options"("id") ON DELETE SET NULL;
--> statement-breakpoint
