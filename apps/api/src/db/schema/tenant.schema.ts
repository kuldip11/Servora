import { pgTable, uuid, varchar, boolean, timestamp } from 'drizzle-orm/pg-core';

// Tenant is the business/franchise isolation boundary. Identity is the
// generated UUID; name is display-only and is intentionally not unique.
export const tenants = pgTable('tenants', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 200 }).notNull(),
  createdBy: uuid('created_by').notNull(),
  plan: varchar('plan', { length: 50 }).notNull().default('starter'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
