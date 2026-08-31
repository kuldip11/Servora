-- Canonical pre-v1 table migration.

CREATE TABLE "promotions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "tenant_id" uuid NOT NULL,
  "name" varchar(200) NOT NULL,
  "rule_type" "promotion_rule_type" NOT NULL,
  "scope" "promotion_scope" DEFAULT 'ORDER' NOT NULL,
  "scope_category_id" uuid,
  "scope_menu_item_id" uuid,
  "value" numeric(10, 2),
  "coupon_code" varchar(50),
  "start_date" date,
  "end_date" date,
  "start_time" time,
  "end_time" time,
  "max_uses_total" integer,
  "max_uses_per_customer" integer,
  "trigger_menu_item_id" uuid,
  "trigger_category_id" uuid,
  "reward_menu_item_id" uuid,
  "reward_category_id" uuid,
  "reward_discount_percent" numeric(5, 2),
  "trigger_quantity" integer,
  "reward_quantity" integer,
  "stackable_with_loyalty" boolean DEFAULT true NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "promotions_scope_target" CHECK (("scope"::text = 'ORDER' AND "scope_category_id" IS NULL AND "scope_menu_item_id" IS NULL) OR ("scope"::text = 'CATEGORY' AND "scope_category_id" IS NOT NULL AND "scope_menu_item_id" IS NULL) OR ("scope"::text = 'ITEM' AND "scope_category_id" IS NULL AND "scope_menu_item_id" IS NOT NULL)),
  CONSTRAINT "promotions_value_valid" CHECK (("rule_type"::text = 'PERCENTAGE' AND "value" > 0 AND "value" <= 100) OR ("rule_type"::text = 'FIXED_AMOUNT' AND "value" > 0) OR ("rule_type"::text = 'BOGO' AND "value" IS NULL)),
  CONSTRAINT "promotions_bogo_shape" CHECK ("rule_type"::text <> 'BOGO' OR ((((("trigger_menu_item_id" IS NOT NULL)::int + ("trigger_category_id" IS NOT NULL)::int) = 1) AND ((("reward_menu_item_id" IS NOT NULL)::int + ("reward_category_id" IS NOT NULL)::int) <= 1) AND "reward_discount_percent" > 0 AND "reward_discount_percent" <= 100 AND "trigger_quantity" > 0 AND "reward_quantity" > 0))),
  CONSTRAINT "promotions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE,
  CONSTRAINT "promotions_scope_category_id_menu_categories_id_fk" FOREIGN KEY ("scope_category_id") REFERENCES "menu_categories"("id") ON DELETE CASCADE,
  CONSTRAINT "promotions_scope_menu_item_id_menu_items_id_fk" FOREIGN KEY ("scope_menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE,
  CONSTRAINT "promotions_trigger_menu_item_id_menu_items_id_fk" FOREIGN KEY ("trigger_menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE,
  CONSTRAINT "promotions_trigger_category_id_menu_categories_id_fk" FOREIGN KEY ("trigger_category_id") REFERENCES "menu_categories"("id") ON DELETE CASCADE,
  CONSTRAINT "promotions_reward_menu_item_id_menu_items_id_fk" FOREIGN KEY ("reward_menu_item_id") REFERENCES "menu_items"("id") ON DELETE CASCADE,
  CONSTRAINT "promotions_reward_category_id_menu_categories_id_fk" FOREIGN KEY ("reward_category_id") REFERENCES "menu_categories"("id") ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX "promotions_tenant_active_idx" ON "promotions" USING btree ("tenant_id", "is_active");
--> statement-breakpoint
CREATE UNIQUE INDEX "promotions_tenant_coupon_unique" ON "promotions" USING btree ("tenant_id", "coupon_code");
--> statement-breakpoint
