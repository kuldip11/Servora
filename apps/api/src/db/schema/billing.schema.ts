import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  timestamp,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { orders } from './order.schema';
import { users } from './auth.schema';

export const paymentMethodEnum = pgEnum('payment_method', [
  'CASH',
  'CARD',
  'UPI',
  'RAZORPAY',
  'STRIPE',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'PENDING',
  'SUCCESS',
  'FAILED',
  'REFUNDED',
]);

export const bills = pgTable('bills', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .unique()
    .references(() => orders.id, { onDelete: 'cascade' }),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).notNull(),
  discountAmount: numeric('discount_amount', { precision: 10, scale: 2 })
    .notNull()
    .default('0'),
  totalAmount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  gstNumber: varchar('gst_number', { length: 50 }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    billId: uuid('bill_id').references(() => bills.id),
    method: paymentMethodEnum('method').notNull(),
    status: paymentStatusEnum('status').notNull().default('PENDING'),
    amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
    reference: varchar('reference', { length: 255 }),
    metadata: text('metadata').default('{}'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({ orderIdx: index('payments_order_idx').on(t.orderId) }),
);

export const paymentRefunds = pgTable('payment_refunds', {
  id: uuid('id').primaryKey().defaultRandom(),
  paymentId: uuid('payment_id')
    .notNull()
    .references(() => payments.id, { onDelete: 'cascade' }),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  reason: text('reason').notNull(),
  processedBy: uuid('processed_by')
    .notNull()
    .references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
