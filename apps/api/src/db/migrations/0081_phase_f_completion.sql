-- Phase F final schema. Fresh pre-production databases enable HELD/REFIRED
-- directly; course sequencing remains an explicit tenant setting.
ALTER TABLE "tenants"
  ADD COLUMN IF NOT EXISTS "course_sequencing_enabled" boolean NOT NULL DEFAULT false;
