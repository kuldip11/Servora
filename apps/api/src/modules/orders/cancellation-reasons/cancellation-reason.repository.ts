import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { cancellationReasons } from "@/db/schema";

import { DEFAULT_CANCELLATION_REASONS } from "./constants";

export const cancellationReasonRepository = {
  async ensureDefaults(tenantId: string) {
    await db
      .insert(cancellationReasons)
      .values(
        DEFAULT_CANCELLATION_REASONS.map((label) => ({ tenantId, label })),
      )
      .onConflictDoNothing();
  },
  list(tenantId: string, activeOnly = false) {
    return db.query.cancellationReasons.findMany({
      where: and(
        eq(cancellationReasons.tenantId, tenantId),
        activeOnly ? eq(cancellationReasons.isActive, true) : undefined,
      ),
      orderBy: asc(cancellationReasons.label),
    });
  },
  findById(tenantId: string, id: string) {
    return db.query.cancellationReasons.findFirst({
      where: and(
        eq(cancellationReasons.tenantId, tenantId),
        eq(cancellationReasons.id, id),
      ),
    });
  },
  findActiveByIds(tenantId: string, ids: string[]) {
    if (!ids.length) return Promise.resolve([]);
    return db.query.cancellationReasons.findMany({
      where: and(
        eq(cancellationReasons.tenantId, tenantId),
        eq(cancellationReasons.isActive, true),
        inArray(cancellationReasons.id, ids),
      ),
    });
  },
  async create(tenantId: string, label: string) {
    const [row] = await db
      .insert(cancellationReasons)
      .values({ tenantId, label })
      .returning();
    return row;
  },
  async update(
    tenantId: string,
    id: string,
    patch: { label?: string; isActive?: boolean },
  ) {
    const [row] = await db
      .update(cancellationReasons)
      .set({ ...patch, updatedAt: new Date() })
      .where(
        and(
          eq(cancellationReasons.tenantId, tenantId),
          eq(cancellationReasons.id, id),
        ),
      )
      .returning();
    return row;
  },
};
