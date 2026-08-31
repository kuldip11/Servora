-- E4 hardening: preserve manager modifier holds independently from
-- ingredient-driven computed availability while retaining `is_available`
-- as the effective backward-compatible field used by existing clients.
ALTER TABLE "modifier_options"
  ADD COLUMN "computed_availability" boolean DEFAULT true NOT NULL;
ALTER TABLE "modifier_options"
  ADD COLUMN "manual_override_availability" boolean;
