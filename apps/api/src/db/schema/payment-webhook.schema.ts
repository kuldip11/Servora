import { pgTable, uuid, varchar, text, timestamp, index, integer } from "drizzle-orm/pg-core";

export const paymentWebhookEvents = pgTable(
  "payment_webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: varchar("event_id", { length: 255 }).notNull().unique(),
    eventType: varchar("event_type", { length: 100 }).notNull(),
    payload: text("payload").notNull(),
    receivedAt: timestamp("received_at").notNull().defaultNow(),
    processedAt: timestamp("processed_at"),
    status: varchar("status", { length: 30 }).notNull().default("RECEIVED"),
    attemptCount: integer("attempt_count").notNull().default(0),
    nextAttemptAt: timestamp("next_attempt_at"),
    error: text("error"),
  },
  (t) => ({ eventTypeIdx: index("payment_webhook_events_type_idx").on(t.eventType) }),
);
