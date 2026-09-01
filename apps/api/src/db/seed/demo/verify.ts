import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import { branches, customers, menuItems, orders, tenants } from "@/db/schema";
import type { SeedContext } from "./types";

export const verifyDemoSeed = async (ctx: SeedContext): Promise<void> => {
  const [tenantCount] = await db.select({ value: count() }).from(tenants).where(eq(tenants.organizationId, ctx.organizationId));
  if (!tenantCount || tenantCount.value < 4) throw new Error(`Demo verification failed: expected at least 4 franchises, found ${tenantCount?.value ?? 0}`);
  for (const tenantId of Object.values(ctx.tenantIds)) {
    const [branchCount, itemCount, customerCount, orderCount] = await Promise.all([
      db.select({ value: count() }).from(branches).where(eq(branches.tenantId, tenantId)),
      db.select({ value: count() }).from(menuItems).where(eq(menuItems.tenantId, tenantId)),
      db.select({ value: count() }).from(customers).where(eq(customers.tenantId, tenantId)),
      db.select({ value: count() }).from(orders).where(eq(orders.tenantId, tenantId)),
    ]);
    if ((branchCount[0]?.value ?? 0) === 0 || (itemCount[0]?.value ?? 0) === 0 || (customerCount[0]?.value ?? 0) === 0 || (orderCount[0]?.value ?? 0) === 0) {
      throw new Error(`Demo verification failed for tenant ${tenantId}`);
    }
  }
};
