-- Canonical pre-v1 table migration.

CREATE TABLE "combo_slots" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "combo_id" uuid NOT NULL,
  "name" varchar(150) NOT NULL,
  "min_selections" integer DEFAULT 1 NOT NULL,
  "max_selections" integer DEFAULT 1 NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  CONSTRAINT "combo_slots_combo_id_combos_id_fk" FOREIGN KEY ("combo_id") REFERENCES "combos"("id") ON DELETE CASCADE
);
--> statement-breakpoint
