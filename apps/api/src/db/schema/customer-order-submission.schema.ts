import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { customerSessions } from "./customer-session.schema";
import { orders } from "./order.schema";

export const customerOrderSubmissions = pgTable(
  "customer_order_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerSessionId: uuid("customer_session_id")
      .notNull()
      .references(() => customerSessions.id, { onDelete: "cascade" }),
    idempotencyKey: varchar("idempotency_key", { length: 128 }).notNull(),
    orderId: uuid("order_id").references(() => orders.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    sessionKeyUnique: uniqueIndex(
      "customer_order_submissions_session_key_unique",
    ).on(t.customerSessionId, t.idempotencyKey),
    sessionIdx: index("customer_order_submissions_session_idx").on(
      t.customerSessionId,
    ),
  }),
);
