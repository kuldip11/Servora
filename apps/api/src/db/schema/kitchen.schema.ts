import {
  pgTable,
  uuid,
  varchar,
  integer,
  numeric,
  text,
  timestamp,
  pgEnum,
  index,
} from 'drizzle-orm/pg-core';
import { tenants } from './tenant.schema';
import { branches } from './branch.schema';
import { users } from './auth.schema';
import { orders, orderStatusEnum } from './order.schema';
import { menuItems, menuItemVariants, modifierOptions } from './menu.schema';

// One row per "fire to kitchen" action (a KOT/ticket). A tab can have many.
export const kitchenTicketStatusEnum = pgEnum('kitchen_ticket_status', [
  'FIRED',
  'PREPARING',
  'READY',
  'SERVED',
]);

// ─── Kitchen Tickets (KOTs) ──────────────────────────────────────────────────
// Each "Send to Kitchen" action creates one ticket. A tab (order) can have
// many, fired at different times as rounds are ordered. This is what the
// kitchen display actually shows — one card per ticket, not per order.

export const kitchenTickets = pgTable(
  'kitchen_tickets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    branchId: uuid('branch_id')
      .notNull()
      .references(() => branches.id, { onDelete: 'cascade' }),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    // 1, 2, 3… per order — "Round 2", "Round 3" etc.
    ticketNumber: integer('ticket_number').notNull(),
    status: kitchenTicketStatusEnum('status').notNull().default('FIRED'),
    // Notes scoped to just this round (e.g. "no onions on this batch"),
    // instead of one note blob shared across every round on the order.
    notes: text('notes'),
    firedAt: timestamp('fired_at').notNull().defaultNow(),
    readyAt: timestamp('ready_at'),
    servedAt: timestamp('served_at'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    tenantBranchIdx: index('kitchen_tickets_tenant_branch_idx').on(t.tenantId, t.branchId),
    statusIdx: index('kitchen_tickets_status_idx').on(t.status),
    orderIdx: index('kitchen_tickets_order_idx').on(t.orderId),
  }),
);

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  kitchenTicketId: uuid('kitchen_ticket_id')
    .notNull()
    .references(() => kitchenTickets.id, { onDelete: 'cascade' }),
  menuItemId: uuid('menu_item_id')
    .notNull()
    .references(() => menuItems.id),
  menuItemName: varchar('menu_item_name', { length: 200 }).notNull(),
  variantId: uuid('variant_id').references(() => menuItemVariants.id),
  // Snapshot of the variant name at order time — same reasoning as
  // menuItemName above: survives menu edits/deletions and lets the kitchen
  // ticket actually display "Half" / "Full" without an extra lookup.
  variantName: varchar('variant_name', { length: 100 }),
  quantity: integer('quantity').notNull(),
  unitPrice: numeric('unit_price', { precision: 10, scale: 2 }).notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  chefNotes: text('chef_notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const orderItemModifiers = pgTable('order_item_modifiers', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderItemId: uuid('order_item_id')
    .notNull()
    .references(() => orderItems.id, { onDelete: 'cascade' }),
  modifierId: uuid('modifier_id').references(() => modifierOptions.id),
  modifierGroupName: varchar('modifier_group_name', { length: 100 }),
  name: varchar('name', { length: 100 }).notNull(),
  price: numeric('price', { precision: 10, scale: 2 }).notNull().default('0'),
  quantity: integer('quantity').notNull().default(1),
});

export const orderStatusHistory = pgTable('order_status_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, { onDelete: 'cascade' }),
  oldStatus: orderStatusEnum('old_status'),
  newStatus: orderStatusEnum('new_status').notNull(),
  changedBy: uuid('changed_by')
    .notNull()
    .references(() => users.id),
  reason: text('reason'),
  changedAt: timestamp('changed_at').notNull().defaultNow(),
});
