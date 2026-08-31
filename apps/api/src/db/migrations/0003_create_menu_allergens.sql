

CREATE TABLE "menu_allergens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "name" varchar(50) NOT NULL CONSTRAINT "menu_allergens_name_unique" UNIQUE
);

INSERT INTO "menu_allergens" ("name") VALUES
  ('Nuts'),
  ('Dairy'),
  ('Gluten'),
  ('Soy'),
  ('Shellfish'),
  ('Egg'),
  ('Sesame');

