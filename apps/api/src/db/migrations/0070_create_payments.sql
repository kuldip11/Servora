

CREATE TABLE "payments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL,
  "bill_id" uuid,
  "method" "payment_method" NOT NULL,
  "status" "payment_status" DEFAULT 'PENDING' NOT NULL,
  "amount" numeric(10, 2) NOT NULL,
  "reference" varchar(255),
  "gateway_order_id" varchar(255),
  "gateway_payment_id" varchar(255),
  "metadata" text DEFAULT '{}',
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE,
  CONSTRAINT "payments_bill_id_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "bills"("id")
);

CREATE INDEX "payments_order_idx" ON "payments" USING btree ("order_id");

CREATE UNIQUE INDEX "payments_gateway_payment_id_unique" ON "payments" USING btree ("gateway_payment_id") WHERE "gateway_payment_id" IS NOT NULL;

