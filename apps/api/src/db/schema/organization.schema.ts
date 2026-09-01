import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { users } from "./user.schema";

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 200 }).notNull(),
    businessType: varchar("business_type", { length: 50 }),
    country: varchar("country", { length: 2 }),
    timezone: varchar("timezone", { length: 64 }),
    currency: varchar("currency", { length: 3 }),
    primaryContactName: varchar("primary_contact_name", { length: 150 }),
    businessEmail: varchar("business_email", { length: 255 }),
    businessPhone: varchar("business_phone", { length: 30 }),
    addressLine1: varchar("address_line_1", { length: 300 }),
    addressLine2: varchar("address_line_2", { length: 300 }),
    city: varchar("city", { length: 120 }),
    stateProvince: varchar("state_province", { length: 120 }),
    postalCode: varchar("postal_code", { length: 24 }),
    legalName: varchar("legal_name", { length: 200 }),
    website: varchar("website", { length: 500 }),
    taxRegistrationNumber: varchar("tax_registration_number", { length: 100 }),
    gstin: varchar("gstin", { length: 15 }),
    pan: varchar("pan", { length: 10 }),
    companyRegistrationNumber: varchar("company_registration_number", {
      length: 100,
    }),
    logoUrl: varchar("logo_url", { length: 1000 }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    creatorIdx: index("organizations_created_by_idx").on(t.createdBy),
  }),
);

export const organizationMemberships = pgTable(
  "organization_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 20 }).notNull().default("ACTIVE"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    userOrganizationUniq: uniqueIndex(
      "organization_memberships_user_organization_uniq",
    ).on(t.userId, t.organizationId),
    userIdx: index("organization_memberships_user_idx").on(t.userId),
    organizationIdx: index("organization_memberships_organization_idx").on(
      t.organizationId,
    ),
  }),
);
