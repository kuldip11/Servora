import { and, eq, sql } from "drizzle-orm";
import { db } from "../../../db";
import { promotionRedemptions, promotions } from "../../../db/schema";
import { compact } from "../../../lib/object-utils";
import { ValidationError } from "../../../core/errors";

export type PromotionRow = typeof promotions.$inferSelect;
export type NewPromotion = typeof promotions.$inferInsert;
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export const promotionRepository = {
  list(tenantId: string) {
    return db.query.promotions.findMany({
      where: eq(promotions.tenantId, tenantId),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
  },
  findById(tenantId: string, id: string) {
    return db.query.promotions.findFirst({ where: and(eq(promotions.id, id), eq(promotions.tenantId, tenantId)) });
  },
  findCandidates(tenantId: string) {
    return db.query.promotions.findMany({ where: and(eq(promotions.tenantId, tenantId), eq(promotions.isActive, true)) });
  },
  async create(data: NewPromotion) {
    const [row] = await db.insert(promotions).values(data).returning();
    return row!;
  },
  async update(tenantId: string, id: string, data: Partial<NewPromotion>) {
    const [row] = await db.update(promotions).set(compact({ ...data, updatedAt: new Date() }) as Partial<NewPromotion>)
      .where(and(eq(promotions.id, id), eq(promotions.tenantId, tenantId))).returning();
    return row;
  },
  async remove(tenantId: string, id: string) {
    await db.delete(promotions).where(and(eq(promotions.id, id), eq(promotions.tenantId, tenantId)));
  },
  async listRedemptionsForOrder(orderId: string): Promise<PendingPromotionRedemption[]> {
    const rows = await db.query.promotionRedemptions.findMany({ where: eq(promotionRedemptions.orderId, orderId) });
    return rows.map((row) => ({
      promotionId: row.promotionId,
      customerId: row.customerId,
      discountAmount: Number(row.discountAmount),
    }));
  },
  async stats(tenantId: string, promotionId: string) {
    const [row] = await db.select({
      uses: sql<number>`count(${promotionRedemptions.id})::int`,
      discountAmount: sql<string>`coalesce(sum(${promotionRedemptions.discountAmount}), 0)`,
    }).from(promotionRedemptions)
      .innerJoin(promotions, eq(promotions.id, promotionRedemptions.promotionId))
      .where(and(eq(promotions.tenantId, tenantId), eq(promotions.id, promotionId)));
    return row ?? { uses: 0, discountAmount: "0" };
  },
};

export interface PendingPromotionRedemption {
  promotionId: string;
  customerId?: string | null;
  discountAmount: number;
}

/**
 * D3 concurrency gate. The promotion row is locked before counts are read, so
 * concurrent orders for the same promotion serialize and cannot over-redeem.
 */
export async function assertAndInsertPromotionRedemptions(
  tx: Transaction,
  tenantId: string,
  orderId: string,
  pending: PendingPromotionRedemption[],
) {
  for (const redemption of pending) {
    const [promotion] = await tx.select().from(promotions)
      .where(and(eq(promotions.id, redemption.promotionId), eq(promotions.tenantId, tenantId)))
      .for("update");
    if (!promotion || !promotion.isActive) throw new ValidationError("Promotion is no longer available");

    const existing = await tx.query.promotionRedemptions.findFirst({
      where: and(eq(promotionRedemptions.promotionId, promotion.id), eq(promotionRedemptions.orderId, orderId)),
    });
    if (!existing) {
      if (promotion.maxUsesTotal != null) {
        const [count] = await tx.select({ value: sql<number>`count(*)::int` }).from(promotionRedemptions)
          .where(eq(promotionRedemptions.promotionId, promotion.id));
        if ((count?.value ?? 0) >= promotion.maxUsesTotal) throw new ValidationError(`${promotion.name} has reached its usage limit`);
      }
      if (promotion.maxUsesPerCustomer != null) {
        if (!redemption.customerId) throw new ValidationError(`${promotion.name} requires an identified customer`);
        const [count] = await tx.select({ value: sql<number>`count(*)::int` }).from(promotionRedemptions)
          .where(and(eq(promotionRedemptions.promotionId, promotion.id), eq(promotionRedemptions.customerId, redemption.customerId)));
        if ((count?.value ?? 0) >= promotion.maxUsesPerCustomer) throw new ValidationError(`${promotion.name} has reached this customer's usage limit`);
      }
      await tx.insert(promotionRedemptions).values({
        promotionId: promotion.id,
        orderId,
        customerId: redemption.customerId ?? null,
        discountAmount: redemption.discountAmount.toFixed(2),
      });
    } else {
      await tx.update(promotionRedemptions).set({
        discountAmount: (Number(existing.discountAmount) + redemption.discountAmount).toFixed(2),
      }).where(eq(promotionRedemptions.id, existing.id));
    }
  }
}


/**
 * Replaces this order's promotion ledger with the authoritative whole-order
 * result. Existing rows are updated in place (so usage count stays one), rows
 * no longer applicable are removed, and new rows are limit-checked while the
 * promotion row is locked.
 */
export async function assertAndReplacePromotionRedemptions(
  tx: Transaction,
  tenantId: string,
  orderId: string,
  pending: PendingPromotionRedemption[],
) {
  const existingRows = await tx.query.promotionRedemptions.findMany({
    where: eq(promotionRedemptions.orderId, orderId),
  });
  const desiredByPromotion = new Map(
    pending
      .filter((entry) => entry.discountAmount > 0)
      .map((entry) => [entry.promotionId, entry] as const),
  );
  const existingByPromotion = new Map(
    existingRows.map((entry) => [entry.promotionId, entry] as const),
  );
  const promotionIds = [...new Set([
    ...existingRows.map((entry) => entry.promotionId),
    ...pending.map((entry) => entry.promotionId),
  ])].sort();

  for (const promotionId of promotionIds) {
    const [promotion] = await tx.select().from(promotions)
      .where(and(eq(promotions.id, promotionId), eq(promotions.tenantId, tenantId)))
      .for("update");
    const existing = existingByPromotion.get(promotionId);
    const desired = desiredByPromotion.get(promotionId);

    if (!desired) {
      if (existing) {
        await tx.delete(promotionRedemptions).where(eq(promotionRedemptions.id, existing.id));
      }
      continue;
    }
    if (!promotion || !promotion.isActive) {
      throw new ValidationError("Promotion is no longer available");
    }

    if (!existing) {
      if (promotion.maxUsesTotal != null) {
        const [count] = await tx.select({ value: sql<number>`count(*)::int` }).from(promotionRedemptions)
          .where(eq(promotionRedemptions.promotionId, promotion.id));
        if ((count?.value ?? 0) >= promotion.maxUsesTotal) {
          throw new ValidationError(`${promotion.name} has reached its usage limit`);
        }
      }
      if (promotion.maxUsesPerCustomer != null) {
        if (!desired.customerId) {
          throw new ValidationError(`${promotion.name} requires an identified customer`);
        }
        const [count] = await tx.select({ value: sql<number>`count(*)::int` }).from(promotionRedemptions)
          .where(and(eq(promotionRedemptions.promotionId, promotion.id), eq(promotionRedemptions.customerId, desired.customerId)));
        if ((count?.value ?? 0) >= promotion.maxUsesPerCustomer) {
          throw new ValidationError(`${promotion.name} has reached this customer's usage limit`);
        }
      }
      await tx.insert(promotionRedemptions).values({
        promotionId: promotion.id,
        orderId,
        customerId: desired.customerId ?? null,
        discountAmount: desired.discountAmount.toFixed(2),
      });
      continue;
    }

    await tx.update(promotionRedemptions).set({
      customerId: desired.customerId ?? null,
      discountAmount: desired.discountAmount.toFixed(2),
    }).where(eq(promotionRedemptions.id, existing.id));
  }
}
