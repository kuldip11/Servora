import { count, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  branches,
  customers,
  kitchenTickets,
  menuItems,
  orders,
  payments,
  restaurantTables,
  tenants,
} from "@/db/schema";
import type { SeedContext } from "./types";

export const verifyDemoSeed = async (ctx: SeedContext): Promise<void> => {
  const [tenantCount] = await db
    .select({ value: count() })
    .from(tenants)
    .where(eq(tenants.organizationId, ctx.organizationId));
  if (!tenantCount || tenantCount.value < 4)
    throw new Error(
      `Demo verification failed: expected at least 4 franchises, found ${tenantCount?.value ?? 0}`,
    );
  for (const tenantId of Object.values(ctx.tenantIds)) {
    const [branchCount, itemCount, customerCount, orderCount] =
      await Promise.all([
        db
          .select({ value: count() })
          .from(branches)
          .where(eq(branches.tenantId, tenantId)),
        db
          .select({ value: count() })
          .from(menuItems)
          .where(eq(menuItems.tenantId, tenantId)),
        db
          .select({ value: count() })
          .from(customers)
          .where(eq(customers.tenantId, tenantId)),
        db
          .select({ value: count() })
          .from(orders)
          .where(eq(orders.tenantId, tenantId)),
      ]);
    if (
      (branchCount[0]?.value ?? 0) === 0 ||
      (itemCount[0]?.value ?? 0) === 0 ||
      (customerCount[0]?.value ?? 0) === 0 ||
      (orderCount[0]?.value ?? 0) === 0
    ) {
      throw new Error(`Demo verification failed for tenant ${tenantId}`);
    }

    const [
      orderStates,
      orderTypes,
      ticketStates,
      itemStates,
      tableStates,
      paymentMethods,
      paymentStates,
    ] = await Promise.all([
      db
        .selectDistinct({ value: orders.status })
        .from(orders)
        .where(eq(orders.tenantId, tenantId)),
      db
        .selectDistinct({ value: orders.type })
        .from(orders)
        .where(eq(orders.tenantId, tenantId)),
      db
        .selectDistinct({ value: kitchenTickets.status })
        .from(kitchenTickets)
        .where(eq(kitchenTickets.tenantId, tenantId)),
      db
        .selectDistinct({ value: menuItems.status })
        .from(menuItems)
        .where(eq(menuItems.tenantId, tenantId)),
      db
        .selectDistinct({ value: restaurantTables.status })
        .from(restaurantTables)
        .where(eq(restaurantTables.tenantId, tenantId)),
      db
        .selectDistinct({ value: payments.method })
        .from(payments)
        .innerJoin(orders, eq(payments.orderId, orders.id))
        .where(eq(orders.tenantId, tenantId)),
      db
        .selectDistinct({ value: payments.status })
        .from(payments)
        .innerJoin(orders, eq(payments.orderId, orders.id))
        .where(eq(orders.tenantId, tenantId)),
    ]);
    assertCoverage("order statuses", orderStates, [
      "OPEN",
      "BILL_REQUESTED",
      "PAID",
      "CLOSED",
      "CANCELLED",
    ]);
    assertCoverage("order types", orderTypes, [
      "DINE_IN",
      "TAKEAWAY",
      "DELIVERY",
      "ONLINE",
    ]);
    assertCoverage("kitchen ticket statuses", ticketStates, [
      "PENDING_PAYMENT",
      "HELD",
      "FIRED",
      "PREPARING",
      "READY",
      "SERVED",
    ]);
    assertCoverage("menu item statuses", itemStates, [
      "ACTIVE",
      "OUT_OF_STOCK",
      "HIDDEN",
      "SEASONAL",
      "DISCONTINUED",
    ]);
    assertCoverage("table statuses", tableStates, [
      "AVAILABLE",
      "OCCUPIED",
      "CLEANING",
      "RESERVED",
    ]);
    assertCoverage("payment methods", paymentMethods, [
      "CASH",
      "CARD",
      "UPI",
      "RAZORPAY",
      "STRIPE",
    ]);
    assertCoverage("payment statuses", paymentStates, [
      "PENDING",
      "SUCCESS",
      "FAILED",
      "REFUNDED",
    ]);
  }
};

const assertCoverage = (
  label: string,
  rows: { value: string }[],
  expected: readonly string[],
): void => {
  const actual = new Set(rows.map((row) => row.value));
  const missing = expected.filter((value) => !actual.has(value));
  if (missing.length > 0)
    throw new Error(
      `Demo verification failed: missing ${label}: ${missing.join(", ")}`,
    );
};
