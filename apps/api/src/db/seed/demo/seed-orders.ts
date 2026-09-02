import { db } from "@/db";
import {
  billOrderItems,
  bills,
  kitchenTickets,
  orderItems,
  orderStatusHistory,
  orders,
  payments,
  paymentRefunds,
  promotionRedemptions,
} from "@/db/schema";
import type { DemoConfig, SeedContext } from "./types";
import { money, seededNumber, uuidFor } from "./utils";

const MS_DAY = 86_400_000;
const paymentMethods = ["CASH", "CARD", "UPI", "RAZORPAY", "STRIPE"] as const;
const orderTypes = ["DINE_IN", "TAKEAWAY", "DELIVERY", "ONLINE"] as const;

export const seedOrders = async (
  config: DemoConfig,
  ctx: SeedContext,
): Promise<{ orders: number; orderItems: number }> => {
  let totalOrders = 0;
  let totalItems = 0;
  const now = new Date();

  for (const brand of config.brands) {
    const tenantId = ctx.tenantIds[brand.key]!;
    for (const [branchIndex, branchId] of ctx.branchIds[brand.key]!.entries()) {
      const staffIds = ctx.staffUserIdsByBranch[branchId]!;
      const orderRows: (typeof orders.$inferInsert)[] = [];
      const ticketRows: (typeof kitchenTickets.$inferInsert)[] = [];
      const itemRows: (typeof orderItems.$inferInsert)[] = [];
      const billRows: (typeof bills.$inferInsert)[] = [];
      const billItemRows: (typeof billOrderItems.$inferInsert)[] = [];
      const paymentRows: (typeof payments.$inferInsert)[] = [];
      const refundRows: (typeof paymentRefunds.$inferInsert)[] = [];
      const historyRows: (typeof orderStatusHistory.$inferInsert)[] = [];
      const redemptionRows: (typeof promotionRedemptions.$inferInsert)[] = [];

      let ticketNo = 1;
      for (let day = config.historyDays; day >= 1; day--) {
        const date = new Date(now.getTime() - day * MS_DAY);
        const dayOfWeek = date.getDay();
        const weekendMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 1.35 : 1;
        const count = Math.max(
          1,
          Math.round(config.ordersPerBranchPerDay * weekendMultiplier),
        );

        for (let n = 0; n < count; n++) {
          const key = `${brand.key}:${branchIndex}:${day}:${n}`;
          const orderId = uuidFor(`order:${key}`);
          const ticketId = uuidFor(`ticket:${key}`);
          const scenario = day * config.ordersPerBranchPerDay + n;
          const status =
            scenario % 40 === 0
              ? ("CANCELLED" as const)
              : scenario % 17 === 0
                ? ("CLOSED" as const)
                : ("PAID" as const);
          const type = orderTypes[scenario % orderTypes.length]!;
          const hourRand = seededNumber(`hour:${key}`);
          const hour =
            hourRand < 0.18
              ? 9 + Math.floor(hourRand * 10)
              : hourRand < 0.55
                ? 12 + Math.floor(hourRand * 5)
                : 18 + Math.floor(hourRand * 5);
          const createdAt = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            Math.min(hour, 22),
            Math.floor(seededNumber(`minute:${key}`) * 60),
          );
          const lineCount = 1 + Math.floor(seededNumber(`lines:${key}`) * 4);
          let subtotal = 0;
          const currentItemRows: (typeof orderItems.$inferInsert)[] = [];

          for (let line = 0; line < lineCount; line++) {
            const itemIndex = Math.floor(
              seededNumber(`item:${key}:${line}`) * brand.menuItemCount,
            );
            const menuItemId = uuidFor(`item:${brand.key}:${itemIndex}`);
            const root = brand.itemRoots[itemIndex % brand.itemRoots.length]!;
            const quantity = seededNumber(`qty:${key}:${line}`) > 0.8 ? 2 : 1;
            const unitPrice =
              89 + ((itemIndex * 37 + config.brands.indexOf(brand) * 29) % 510);
            const lineSubtotal = unitPrice * quantity;
            subtotal += lineSubtotal;
            const resolutionAsOf = createdAt;
            currentItemRows.push({
              id: uuidFor(`order-item:${key}:${line}`),
              orderId,
              kitchenTicketId: ticketId,
              menuItemId,
              menuItemName: root,
              quantity,
              unitPrice: money(unitPrice),
              subtotal: money(lineSubtotal),
              taxRate: "5.00",
              taxMode: "EXCLUSIVE",
              pricingAttribution: {
                BASE_PRICE: unitPrice,
                VARIANT: 0,
                MODIFIER: 0,
                TAXABLE_BASE: lineSubtotal,
                PRICE_SOURCE: {
                  kind: "MENU_ITEM",
                  id: menuItemId,
                  description: "Demo menu price",
                },
              },
              fulfillmentType: type === "DINE_IN" ? "DINE_IN" : "TAKEAWAY",
              stationId: uuidFor(
                `station:${brand.key}:${branchIndex}:${itemIndex % 5 === 0 ? "beverage" : "hot"}`,
              ),
              resolutionAsOf,
              availabilitySnapshot: {
                asOf: resolutionAsOf.toISOString(),
                branchId,
                channel: "STAFF",
                fulfillmentType: type,
                effectiveStatus: "ACTIVE",
                isHidden: false,
                reason: null,
                cause: "DEMO_SEED",
              },
              pricingReplayEvidence: { source: "DEMO_SEED", unitPrice },
              availabilityReplayEvidence: {
                source: "DEMO_SEED",
                status: "ACTIVE",
              },
              itemStatus: "ACTIVE",
              createdAt,
            });
          }

          const discount =
            seededNumber(`discount:${key}`) < 0.18
              ? Math.round(subtotal * 0.1 * 100) / 100
              : 0;
          const tax = Math.round((subtotal - discount) * 0.05 * 100) / 100;
          const service =
            brand.key === "qsr"
              ? 0
              : Math.round((subtotal - discount) * 0.05 * 100) / 100;
          const total = subtotal - discount + tax + service;
          const customerIndex = Math.floor(
            seededNumber(`customer:${key}`) * config.customersPerTenant,
          );
          const customerId = uuidFor(`customer:${brand.key}:${customerIndex}`);
          const tableId =
            type === "DINE_IN"
              ? uuidFor(
                  `table:${brand.key}:${branchIndex}:${Math.floor(seededNumber(`table:${key}`) * config.tablesPerBranch)}`,
                )
              : null;
          const createdBy = staffIds[n % staffIds.length] ?? ctx.ownerUserId;

          orderRows.push({
            id: orderId,
            tenantId,
            branchId,
            tableId,
            customerId,
            createdBy,
            source: "STAFF",
            status,
            type,
            subtotal: money(subtotal),
            taxAmount: money(tax),
            discountAmount: money(discount),
            serviceChargeAmount: money(service),
            totalAmount: money(total),
            resolutionAsOf: createdAt,
            createdAt,
            updatedAt: createdAt,
          });
          ticketRows.push({
            id: ticketId,
            tenantId,
            branchId,
            orderId,
            ticketNumber: ticketNo++,
            status: "SERVED",
            firedAt: createdAt,
            readyAt: new Date(createdAt.getTime() + 12 * 60000),
            servedAt: new Date(createdAt.getTime() + 16 * 60000),
            createdAt,
            updatedAt: createdAt,
          });
          itemRows.push(...currentItemRows);
          historyRows.push({
            id: uuidFor(`history:${key}:open`),
            orderId,
            oldStatus: null,
            newStatus: "OPEN",
            changedBy: createdBy,
            changedAt: createdAt,
          });
          historyRows.push({
            id: uuidFor(`history:${key}:final`),
            orderId,
            oldStatus: "OPEN",
            newStatus: status,
            changedBy: createdBy,
            changedAt: new Date(createdAt.getTime() + 25 * 60000),
          });

          if (status !== "CANCELLED") {
            const billId = uuidFor(`bill:${key}`);
            const paymentId = uuidFor(`payment:${key}`);
            billRows.push({
              id: billId,
              orderId,
              subtotal: money(subtotal),
              taxAmount: money(tax),
              discountAmount: money(discount),
              serviceChargeAmount: money(service),
              totalAmount: money(total),
              gstNumber: "27ABCDE1234F1Z5",
              createdAt: new Date(createdAt.getTime() + 20 * 60000),
            });
            for (const item of currentItemRows)
              billItemRows.push({
                id: uuidFor(`bill-item:${key}:${item.id}`),
                billId,
                orderItemId: item.id!,
                allocationRatio: "1.000000",
              });
            const isRefunded = scenario % 53 === 0;
            paymentRows.push({
              id: paymentId,
              orderId,
              billId,
              method: paymentMethods[scenario % paymentMethods.length]!,
              status: isRefunded ? "REFUNDED" : "SUCCESS",
              amount: money(total),
              reference: `DEMO-${orderId.slice(0, 8)}`,
              metadata: JSON.stringify({ demo: true, preset: config.preset }),
              createdAt: new Date(createdAt.getTime() + 24 * 60000),
              updatedAt: new Date(createdAt.getTime() + 24 * 60000),
            });
            if (isRefunded)
              refundRows.push({
                id: uuidFor(`refund:${key}`),
                paymentId,
                amount: money(total),
                reason: "Demo full refund",
                processedBy: createdBy,
                createdAt: new Date(createdAt.getTime() + 48 * 60000),
              });
            if (discount > 0)
              redemptionRows.push({
                id: uuidFor(`redemption:${key}`),
                promotionId: uuidFor(`promo:${brand.key}:weekday`),
                orderId,
                customerId,
                discountAmount: money(discount),
                redeemedAt: createdAt,
              });
          }
        }
      }

      const liveCount = Math.min(6, config.tablesPerBranch);
      const liveTicketStatuses = [
        "PENDING_PAYMENT",
        "HELD",
        "FIRED",
        "PREPARING",
        "READY",
        "SERVED",
      ] as const;
      for (let n = 0; n < liveCount; n++) {
        const key = `${brand.key}:${branchIndex}:live:${n}`;
        const orderId = uuidFor(`order:${key}`);
        const ticketId = uuidFor(`ticket:${key}`);
        const menuItemId = uuidFor(
          `item:${brand.key}:${n % brand.menuItemCount}`,
        );
        const unitPrice = 189 + n * 45;
        const createdAt = new Date(now.getTime() - (8 + n * 4) * 60000);
        const tableId = uuidFor(`table:${brand.key}:${branchIndex}:${n}`);
        const ticketStatus = liveTicketStatuses[n]!;
        orderRows.push({
          id: orderId,
          tenantId,
          branchId,
          tableId,
          customerId: uuidFor(`customer:${brand.key}:${n}`),
          createdBy: staffIds[n % staffIds.length] ?? ctx.ownerUserId,
          source: n === 0 ? "CUSTOMER_QR" : "STAFF",
          status: n === 4 ? "BILL_REQUESTED" : "OPEN",
          type: "DINE_IN",
          subtotal: money(unitPrice),
          taxAmount: money(unitPrice * 0.05),
          serviceChargeAmount: money(
            brand.key === "qsr" ? 0 : unitPrice * 0.05,
          ),
          totalAmount: money(unitPrice * (brand.key === "qsr" ? 1.05 : 1.1)),
          resolutionAsOf: createdAt,
          notes: n === 1 ? "Demo order with guest notes: nut allergy" : null,
          createdAt,
          updatedAt: createdAt,
        });
        ticketRows.push({
          id: ticketId,
          tenantId,
          branchId,
          orderId,
          ticketNumber: ticketNo++,
          status: ticketStatus,
          firedAt:
            ticketStatus === "PENDING_PAYMENT" || ticketStatus === "HELD"
              ? null
              : createdAt,
          readyAt: n >= 4 ? new Date(createdAt.getTime() + 10 * 60000) : null,
          servedAt: n === 5 ? new Date(createdAt.getTime() + 14 * 60000) : null,
          notes: n === 1 ? "Hold until guest confirms" : null,
          createdAt,
          updatedAt: createdAt,
        });
        itemRows.push({
          id: uuidFor(`order-item:${key}:0`),
          orderId,
          kitchenTicketId: ticketId,
          menuItemId,
          menuItemName: brand.itemRoots[n % brand.itemRoots.length]!,
          quantity: 1,
          unitPrice: money(unitPrice),
          subtotal: money(unitPrice),
          taxRate: "5.00",
          taxMode: "EXCLUSIVE",
          pricingAttribution: {
            BASE_PRICE: unitPrice,
            VARIANT: 0,
            MODIFIER: 0,
          },
          chefNotes: n === 1 ? "No nuts; allergy noted" : null,
          seatLabel: `Seat ${n + 1}`,
          fulfillmentType: "DINE_IN",
          stationId: uuidFor(`station:${brand.key}:${branchIndex}:hot`),
          resolutionAsOf: createdAt,
          availabilitySnapshot: {
            asOf: createdAt.toISOString(),
            branchId,
            channel: n === 0 ? "CUSTOMER_QR" : "STAFF",
            fulfillmentType: "DINE_IN",
            effectiveStatus: "ACTIVE",
            isHidden: false,
            reason: null,
            cause: "DEMO_SEED",
          },
          pricingReplayEvidence: { source: "DEMO_SEED" },
          availabilityReplayEvidence: { source: "DEMO_SEED" },
          itemStatus: "ACTIVE",
          createdAt,
        });
        if (n < 2)
          paymentRows.push({
            id: uuidFor(`payment:${key}:attempt`),
            orderId,
            method: n === 0 ? "RAZORPAY" : "CARD",
            status: n === 0 ? "PENDING" : "FAILED",
            amount: money(unitPrice),
            reference: `DEMO-ATTEMPT-${orderId.slice(0, 8)}`,
            metadata: JSON.stringify({
              demo: true,
              expectedOutcome: n === 0 ? "pending" : "declined",
            }),
            createdAt,
            updatedAt: createdAt,
          });
      }

      for (let i = 0; i < orderRows.length; i += 500)
        await db.insert(orders).values(orderRows.slice(i, i + 500));
      for (let i = 0; i < ticketRows.length; i += 500)
        await db.insert(kitchenTickets).values(ticketRows.slice(i, i + 500));
      for (let i = 0; i < itemRows.length; i += 500)
        await db.insert(orderItems).values(itemRows.slice(i, i + 500));
      for (let i = 0; i < historyRows.length; i += 500)
        await db
          .insert(orderStatusHistory)
          .values(historyRows.slice(i, i + 500));
      for (let i = 0; i < billRows.length; i += 500)
        await db.insert(bills).values(billRows.slice(i, i + 500));
      for (let i = 0; i < billItemRows.length; i += 500)
        await db.insert(billOrderItems).values(billItemRows.slice(i, i + 500));
      for (let i = 0; i < paymentRows.length; i += 500)
        await db.insert(payments).values(paymentRows.slice(i, i + 500));
      for (let i = 0; i < refundRows.length; i += 500)
        await db.insert(paymentRefunds).values(refundRows.slice(i, i + 500));
      for (let i = 0; i < redemptionRows.length; i += 500)
        await db
          .insert(promotionRedemptions)
          .values(redemptionRows.slice(i, i + 500));
      totalOrders += orderRows.length;
      totalItems += itemRows.length;
    }
  }
  return { orders: totalOrders, orderItems: totalItems };
};
