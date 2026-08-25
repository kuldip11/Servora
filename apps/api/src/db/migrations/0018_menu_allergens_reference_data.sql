-- Required platform reference data.
-- Allergens are canonical, non-tenant-editable values used by menu labeling.
-- Keep this idempotent so every migrated database receives the same reference set.

INSERT INTO "menu_allergens" ("name") VALUES
  ('Nuts'),
  ('Dairy'),
  ('Gluten'),
  ('Soy'),
  ('Shellfish'),
  ('Egg'),
  ('Sesame')
ON CONFLICT ("name") DO NOTHING;
