

CREATE TABLE "promotion_redemptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "promotion_id" uuid NOT NULL,
  "order_id" uuid NOT NULL,
  "customer_id" uuid,
  "discount_amount" numeric(10, 2) NOT NULL,
  "redeemed_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "promotion_redemptions_promotion_id_promotions_id_fk" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE RESTRICT,
  CONSTRAINT "promotion_redemptions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE
);

CREATE INDEX "promotion_redemptions_promotion_idx" ON "promotion_redemptions" USING btree ("promotion_id", "redeemed_at");

CREATE INDEX "promotion_redemptions_customer_idx" ON "promotion_redemptions" USING btree ("promotion_id", "customer_id");

CREATE UNIQUE INDEX "promotion_redemptions_promotion_order_unique" ON "promotion_redemptions" USING btree ("promotion_id", "order_id");

