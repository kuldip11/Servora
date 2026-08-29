ALTER TABLE "branches" ADD COLUMN "code" varchar(24);
ALTER TABLE "branches" ADD COLUMN "timezone" varchar(64) DEFAULT 'Asia/Kolkata' NOT NULL;
ALTER TABLE "branches" ADD COLUMN "currency" varchar(3) DEFAULT 'INR' NOT NULL;

UPDATE "branches"
SET "code" = 'BR-' || upper(substr(replace("id"::text, '-', ''), 1, 8))
WHERE "code" IS NULL;

ALTER TABLE "branches" ALTER COLUMN "code" SET NOT NULL;
CREATE UNIQUE INDEX "branches_tenant_code_uniq" ON "branches" USING btree ("tenant_id", "code");
