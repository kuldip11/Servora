import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const userStatusEnum = pgEnum("user_status", [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    displayName: varchar("display_name", { length: 150 }),
    email: varchar("email", { length: 255 }).notNull(),
    phone: varchar("phone", { length: 30 }),
    profileImageUrl: varchar("profile_image_url", { length: 1000 }),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    status: userStatusEnum("status").notNull().default("ACTIVE"),
    failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
    lockedUntil: timestamp("locked_until"),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    emailLowerUnique: uniqueIndex("users_email_lower_unique")
      .on(sql`lower(${t.email})`)
      .where(sql`${t.deletedAt} IS NULL`),
    lockedUntilIdx: index("users_locked_until_idx").on(t.lockedUntil),
  }),
);
