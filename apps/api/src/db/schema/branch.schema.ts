import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { tenants } from './tenant.schema';

export const branches = pgTable(
  'branches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 200 }).notNull(),
    address: text('address').notNull(),
    phone: varchar('phone', { length: 20 }),
    isActive: boolean('is_active').notNull().default(true),
    // Per-branch order-type + tables capability profile. Every column
    // defaults to true so existing branches keep behaving exactly as they
    // did before this migration ran (full-service, nothing pre-disabled).
    // An owner narrows these down per-outlet — e.g. a cloud-kitchen branch
    // gets dineInEnabled/tablesEnabled set to false.
    dineInEnabled: boolean('dine_in_enabled').notNull().default(true),
    takeawayEnabled: boolean('takeaway_enabled').notNull().default(true),
    deliveryEnabled: boolean('delivery_enabled').notNull().default(true),
    onlineEnabled: boolean('online_enabled').notNull().default(true),
    tablesEnabled: boolean('tables_enabled').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => ({
    tenantIdx: index('branches_tenant_idx').on(t.tenantId),
    tenantNameUniq: uniqueIndex('branches_tenant_name_uniq').on(t.tenantId, t.name),
    idTenantFkTarget: uniqueIndex('branches_id_tenant_unique_fk_target').on(t.id, t.tenantId),
  }),
);
