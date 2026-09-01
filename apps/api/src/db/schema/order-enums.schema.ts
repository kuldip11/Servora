import { pgEnum } from "drizzle-orm/pg-core";

export const orderSourceEnum = pgEnum("order_source", ["STAFF", "CUSTOMER_QR"]);

export const orderTypeEnum = pgEnum("order_type", [
  "DINE_IN",
  "TAKEAWAY",
  "DELIVERY",
  "ONLINE",
]);
