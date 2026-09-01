

CREATE TABLE "bills" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL,
  "split_label" varchar(100),
  "subtotal" numeric(10, 2) NOT NULL,
  "tax_amount" numeric(10, 2) NOT NULL,
  "discount_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
  "service_charge_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
  "rounding_adjustment" numeric(10, 2) DEFAULT '0' NOT NULL,
  "total_amount" numeric(10, 2) NOT NULL,
  "gst_number" varchar(50),
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "bills_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE
);

