-- Canonical pre-v1 table migration.

CREATE TABLE "order_status_history" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "order_id" uuid NOT NULL,
  "old_status" "order_status",
  "new_status" "order_status" NOT NULL,
  "changed_by" uuid,
  "reason" text,
  "cancellation_reason_id" uuid,
  "changed_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "order_status_history_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE,
  CONSTRAINT "order_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "users"("id"),
  CONSTRAINT "order_status_history_cancellation_reason_id_cancellation_reasons_id_fk" FOREIGN KEY ("cancellation_reason_id") REFERENCES "cancellation_reasons"("id") ON DELETE SET NULL
);
--> statement-breakpoint
