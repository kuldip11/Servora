

CREATE TABLE "inventory_transactions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "inventory_item_id" uuid NOT NULL,
  "transaction_type" "inventory_transaction_type" NOT NULL,
  "quantity" numeric(12, 3) NOT NULL,
  "balance_before" numeric(12, 3) NOT NULL,
  "balance_after" numeric(12, 3) NOT NULL,
  "notes" text,
  "performed_by" uuid,
  "waste_reason_id" uuid,
  "reversal_of_deduction_id" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "inventory_transactions_inventory_item_id_inventory_items_id_fk" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE,
  CONSTRAINT "inventory_transactions_performed_by_users_id_fk" FOREIGN KEY ("performed_by") REFERENCES "users"("id"),
  CONSTRAINT "inventory_transactions_waste_reason_id_waste_reasons_id_fk" FOREIGN KEY ("waste_reason_id") REFERENCES "waste_reasons"("id") ON DELETE SET NULL,
  CONSTRAINT "inventory_transactions_reversal_of_deduction_id_order_inventory_deductions_id_fk" FOREIGN KEY ("reversal_of_deduction_id") REFERENCES "order_inventory_deductions"("id") ON DELETE SET NULL
);

CREATE INDEX "inventory_transactions_item_idx" ON "inventory_transactions" USING btree ("inventory_item_id");

CREATE INDEX "inventory_transactions_waste_reason_idx" ON "inventory_transactions" USING btree ("waste_reason_id");

CREATE UNIQUE INDEX "inventory_transactions_reversal_unique" ON "inventory_transactions" USING btree ("reversal_of_deduction_id");

