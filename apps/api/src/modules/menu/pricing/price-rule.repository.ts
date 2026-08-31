import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { priceRules, tenants } from "@/db/schema";
import { compact } from "@/lib/object-utils";

export type NewPriceRule = typeof priceRules.$inferInsert;

const organizationIdForTenant = async (tenantId: string) => {
  const tenant = await db.query.tenants.findFirst({
    where: eq(tenants.id, tenantId),
    columns: { organizationId: true },
  });
  return tenant?.organizationId ?? null;
};

export const priceRuleRepository = {
  async findCandidates(
    tenantId: string,
    menuItemIds: string[],
    menuItemSkus: string[] = [],
  ) {
    if (menuItemIds.length === 0) return [];
    const organizationId = await organizationIdForTenant(tenantId);
    return db.query.priceRules.findMany({
      where: and(
        eq(priceRules.isActive, true),
        or(
          and(
            eq(priceRules.tenantId, tenantId),
            inArray(priceRules.menuItemId, menuItemIds),
          ),
          organizationId && menuItemSkus.length
            ? and(
                eq(priceRules.organizationId, organizationId),
                inArray(priceRules.menuItemSku, menuItemSkus),
              )
            : undefined,
        ),
      ),
    });
  },

  async findPerCoverRule(tenantId: string, ruleId: string) {
    const organizationId = await organizationIdForTenant(tenantId);
    return db.query.priceRules.findFirst({
      where: and(
        eq(priceRules.id, ruleId),
        eq(priceRules.isActive, true),
        eq(priceRules.isPerCover, true),
        or(
          eq(priceRules.tenantId, tenantId),
          organizationId
            ? eq(priceRules.organizationId, organizationId)
            : undefined,
        ),
      ),
    });
  },

  async list(tenantId: string, menuItemId?: string) {
    return db.query.priceRules.findMany({
      where: and(
        eq(priceRules.tenantId, tenantId),
        menuItemId ? eq(priceRules.menuItemId, menuItemId) : undefined,
      ),
      orderBy: (t, { desc }) => [desc(t.priority), desc(t.createdAt)],
    });
  },

  async listOrganization(organizationId: string, menuItemSku?: string) {
    return db.query.priceRules.findMany({
      where: and(
        eq(priceRules.organizationId, organizationId),
        menuItemSku ? eq(priceRules.menuItemSku, menuItemSku) : undefined,
      ),
      orderBy: (t, { desc }) => [desc(t.priority), desc(t.createdAt)],
    });
  },

  async findById(tenantId: string, id: string) {
    const organizationId = await organizationIdForTenant(tenantId);
    return db.query.priceRules.findFirst({
      where: and(
        eq(priceRules.id, id),
        or(
          eq(priceRules.tenantId, tenantId),
          organizationId
            ? eq(priceRules.organizationId, organizationId)
            : undefined,
        ),
      ),
    });
  },

  async create(data: NewPriceRule) {
    const [created] = await db.insert(priceRules).values(data).returning();
    return created!;
  },

  async createMany(data: NewPriceRule[]) {
    if (data.length === 0) return [];
    return db.insert(priceRules).values(data).returning();
  },

  async update(tenantId: string, id: string, data: Partial<NewPriceRule>) {
    const existing = await priceRuleRepository.findById(tenantId, id);
    if (!existing) return undefined;
    const [updated] = await db
      .update(priceRules)
      .set(compact({ ...data, updatedAt: new Date() }))
      .where(eq(priceRules.id, existing.id))
      .returning();
    return updated;
  },

  async remove(tenantId: string, id: string) {
    const existing = await priceRuleRepository.findById(tenantId, id);
    if (!existing) return undefined;
    const [deleted] = await db
      .delete(priceRules)
      .where(eq(priceRules.id, existing.id))
      .returning({ id: priceRules.id });
    return deleted;
  },

  organizationIdForTenant,
};
