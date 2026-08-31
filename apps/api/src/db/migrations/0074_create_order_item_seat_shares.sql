

CREATE TABLE "order_item_seat_shares" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_item_id" uuid NOT NULL,
  "seat_label" varchar(50) NOT NULL,
  "share_ratio" numeric(8, 6) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "order_item_seat_shares_ratio_positive" CHECK ("share_ratio" > 0 AND "share_ratio" <= 1),
  CONSTRAINT "order_item_seat_shares_order_item_id_order_items_id_fk" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "order_item_seat_shares_item_seat_unique" ON "order_item_seat_shares" USING btree ("order_item_id", "seat_label");

CREATE INDEX "order_item_seat_shares_item_idx" ON "order_item_seat_shares" USING btree ("order_item_id");

