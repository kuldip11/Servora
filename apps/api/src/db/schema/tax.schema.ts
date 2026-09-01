import { pgEnum } from "drizzle-orm/pg-core";

export const taxModeEnum = pgEnum("tax_mode", ["INCLUSIVE", "EXCLUSIVE"]);
export type TaxMode = (typeof taxModeEnum.enumValues)[number];
