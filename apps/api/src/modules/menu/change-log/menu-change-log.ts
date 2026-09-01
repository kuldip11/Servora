import { and, desc, eq, inArray, lt, lte } from "drizzle-orm";
import type { AuthContext } from "@/core/auth";
import { db } from "@/db";
import { menuChangeEvents } from "@/db/schema";

export type MenuChangeEntityType =
  | "MENU_ITEM"
  | "VARIANT"
  | "MODIFIER_GROUP"
  | "MODIFIER_OPTION"
  | "CATEGORY"
  | "MENU"
  | "MENU_MEMBERSHIP"
  | "PRICE_RULE"
  | "PROMOTION"
  | "RECIPE"
  | "SUB_RECIPE"
  | "TEMPLATE"
  | "AVAILABILITY"
  | "TAG";
export type MenuChangeType =
  "CREATED" | "UPDATED" | "PUBLISHED" | "ARCHIVED" | "DELETED";

export type ChangeDiff = Record<
  string,
  { old: unknown; new: unknown } | unknown
>;

export const buildDiff = (
  before: object | null,
  after: object | null,
): ChangeDiff => {
  const oldRecord = before as Record<string, unknown> | null;
  const newRecord = after as Record<string, unknown> | null;
  const result: ChangeDiff = {};
  for (const key of new Set([
    ...Object.keys(oldRecord ?? {}),
    ...Object.keys(newRecord ?? {}),
  ])) {
    const oldValue = oldRecord?.[key];
    const newValue = newRecord?.[key];
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      result[key] = { old: oldValue ?? null, new: newValue ?? null };
    }
  }
  return result;
};

export const menuChangeLog = {
  async record(
    auth: Pick<AuthContext, "tenantId" | "userId">,
    entityType: MenuChangeEntityType,
    entityId: string,
    changeType: MenuChangeType,
    diff: object,
  ) {
    const [event] = await db
      .insert(menuChangeEvents)
      .values({
        tenantId: auth.tenantId,
        changedBy: auth.userId,
        entityType,
        entityId,
        changeType,
        diff: diff as ChangeDiff,
      })
      .returning();
    return event;
  },

  async recordMany(
    auth: Pick<AuthContext, "tenantId" | "userId">,
    events: Array<{
      entityType: MenuChangeEntityType;
      entityId: string;
      changeType: MenuChangeType;
      diff: object;
    }>,
  ) {
    if (!events.length) return [];
    return db
      .insert(menuChangeEvents)
      .values(
        events.map((event) => ({
          ...event,
          diff: event.diff as ChangeDiff,
          tenantId: auth.tenantId,
          changedBy: auth.userId,
        })),
      )
      .returning();
  },

  async list(
    tenantId: string,
    filters: {
      entityType?: MenuChangeEntityType;
      entityId?: string;
      changeType?: MenuChangeType;
      before?: Date;
      limit?: number;
    },
  ) {
    return db.query.menuChangeEvents.findMany({
      where: and(
        eq(menuChangeEvents.tenantId, tenantId),
        filters.entityType
          ? eq(menuChangeEvents.entityType, filters.entityType)
          : undefined,
        filters.entityId
          ? eq(menuChangeEvents.entityId, filters.entityId)
          : undefined,
        filters.changeType
          ? eq(menuChangeEvents.changeType, filters.changeType)
          : undefined,
        filters.before
          ? lt(menuChangeEvents.changedAt, filters.before)
          : undefined,
      ),
      orderBy: [desc(menuChangeEvents.changedAt), desc(menuChangeEvents.id)],
      limit: Math.min(filters.limit ?? 50, 100),
    });
  },

  async latestForItems(tenantId: string, itemIds: string[], asOf: Date) {
    if (!itemIds.length) return new Map<string, string>();
    const rows = await db
      .select({ id: menuChangeEvents.id, entityId: menuChangeEvents.entityId })
      .from(menuChangeEvents)
      .where(
        and(
          eq(menuChangeEvents.tenantId, tenantId),
          eq(menuChangeEvents.entityType, "MENU_ITEM"),
          inArray(menuChangeEvents.entityId, [...new Set(itemIds)]),
          lte(menuChangeEvents.changedAt, asOf),
        ),
      )
      .orderBy(desc(menuChangeEvents.changedAt), desc(menuChangeEvents.id));
    const latest = new Map<string, string>();
    for (const row of rows)
      if (!latest.has(row.entityId)) latest.set(row.entityId, row.id);
    return latest;
  },
};
