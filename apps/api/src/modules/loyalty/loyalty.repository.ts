import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "../../db";
import { customerLoyaltyTiers, customers, tenants } from "../../db/schema";
import { compact } from "../../lib/object-utils";

export type LoyaltyTierRow = Omit<
  typeof customerLoyaltyTiers.$inferSelect,
  "organizationId"
> & { organizationId?: string | null };
export type CustomerRow = typeof customers.$inferSelect;
export type NewLoyaltyTier = typeof customerLoyaltyTiers.$inferInsert;
export type NewCustomer = typeof customers.$inferInsert;

export const loyaltyRepository = {

  async listApplicableTiers(tenantId: string) {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
      columns: { organizationId: true },
    });
    return db.query.customerLoyaltyTiers.findMany({
      where: or(
        eq(customerLoyaltyTiers.tenantId, tenantId),
        tenant?.organizationId
          ? eq(customerLoyaltyTiers.organizationId, tenant.organizationId)
          : undefined,
      ),
      orderBy: (t, { asc }) => [asc(t.name)],
    });
  },
  async findApplicableTier(tenantId: string, id: string) {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
      columns: { organizationId: true },
    });
    return db.query.customerLoyaltyTiers.findFirst({
      where: and(
        eq(customerLoyaltyTiers.id, id),
        or(
          eq(customerLoyaltyTiers.tenantId, tenantId),
          tenant?.organizationId
            ? eq(customerLoyaltyTiers.organizationId, tenant.organizationId)
            : undefined,
        ),
      ),
    });
  },
  listTiers(tenantId: string) {
    return db.query.customerLoyaltyTiers.findMany({
      where: eq(customerLoyaltyTiers.tenantId, tenantId),
      orderBy: (t, { asc }) => [asc(t.name)],
    });
  },
  findTier(tenantId: string, id: string) {
    return db.query.customerLoyaltyTiers.findFirst({
      where: and(
        eq(customerLoyaltyTiers.tenantId, tenantId),
        eq(customerLoyaltyTiers.id, id),
      ),
    });
  },
  async createTier(data: NewLoyaltyTier) {
    const [row] = await db
      .insert(customerLoyaltyTiers)
      .values(data)
      .returning();
    return row!;
  },
  async updateTier(
    tenantId: string,
    id: string,
    data: Partial<NewLoyaltyTier>,
  ) {
    const [row] = await db
      .update(customerLoyaltyTiers)
      .set(compact({ ...data, updatedAt: new Date() }))
      .where(
        and(
          eq(customerLoyaltyTiers.tenantId, tenantId),
          eq(customerLoyaltyTiers.id, id),
        ),
      )
      .returning();
    return row;
  },
  async removeTier(tenantId: string, id: string) {
    await db
      .delete(customerLoyaltyTiers)
      .where(
        and(
          eq(customerLoyaltyTiers.tenantId, tenantId),
          eq(customerLoyaltyTiers.id, id),
        ),
      );
  },
  listCustomers(tenantId: string) {
    return db.query.customers.findMany({
      where: eq(customers.tenantId, tenantId),
      orderBy: (t, { asc }) => [asc(t.name)],
      with: { loyaltyTier: true },
    });
  },
  findCustomer(tenantId: string, id: string) {
    return db.query.customers.findFirst({
      where: and(eq(customers.tenantId, tenantId), eq(customers.id, id)),
      with: { loyaltyTier: true },
    });
  },
  async findOrganizationTierForCustomer(tenantId: string, customerId: string) {
    const customer = await db.query.customers.findFirst({
      where: and(
        eq(customers.tenantId, tenantId),
        eq(customers.id, customerId),
      ),
    });
    if (!customer) return undefined;
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
      columns: { organizationId: true },
    });
    if (!tenant?.organizationId) return undefined;

    // Restrict identity matching to sibling tenants in the same Organization.
    // Phone is the explicit cross-tenant identity fallback for customers created
    // before H5 populated organizationCustomerId.
    const candidateRows = await db
      .select({ id: customers.id })
      .from(customers)
      .innerJoin(tenants, eq(tenants.id, customers.tenantId))
      .where(
        and(
          eq(tenants.organizationId, tenant.organizationId),
          or(
            customer.organizationCustomerId
              ? eq(
                  customers.organizationCustomerId,
                  customer.organizationCustomerId,
                )
              : undefined,
            customer.phone ? eq(customers.phone, customer.phone) : undefined,
            eq(customers.id, customer.id),
          ),
        ),
      );
    if (!candidateRows.length) return undefined;
    const identityCandidates = await db.query.customers.findMany({
      where: inArray(
        customers.id,
        candidateRows.map((candidate) => candidate.id),
      ),
      with: { loyaltyTier: true },
    });
    return identityCandidates
      .map((candidate) => candidate.loyaltyTier)
      .find((tier) => tier?.organizationId === tenant.organizationId);
  },
  listOrganizationTiers(organizationId: string) {
    return db.query.customerLoyaltyTiers.findMany({
      where: eq(customerLoyaltyTiers.organizationId, organizationId),
      orderBy: (t, { asc }) => [asc(t.name)],
    });
  },
  async createOrganizationTier(
    organizationId: string,
    data: Omit<NewLoyaltyTier, "tenantId" | "organizationId">,
  ) {
    const [row] = await db
      .insert(customerLoyaltyTiers)
      .values({ ...data, tenantId: null, organizationId })
      .returning();
    return row!;
  },
  findOrganizationTier(organizationId: string, id: string) {
    return db.query.customerLoyaltyTiers.findFirst({
      where: and(
        eq(customerLoyaltyTiers.organizationId, organizationId),
        eq(customerLoyaltyTiers.id, id),
      ),
    });
  },
  async updateOrganizationTier(
    organizationId: string,
    id: string,
    data: Partial<NewLoyaltyTier>,
  ) {
    const [row] = await db
      .update(customerLoyaltyTiers)
      .set(compact({ ...data, tenantId: null, organizationId, updatedAt: new Date() }))
      .where(and(
        eq(customerLoyaltyTiers.organizationId, organizationId),
        eq(customerLoyaltyTiers.id, id),
      ))
      .returning();
    return row;
  },
  async removeOrganizationTier(organizationId: string, id: string) {
    await db.delete(customerLoyaltyTiers).where(and(
      eq(customerLoyaltyTiers.organizationId, organizationId),
      eq(customerLoyaltyTiers.id, id),
    ));
  },
  async findCustomersByPhone(tenantId: string, phone: string) {
    const local = await db.query.customers.findMany({
      where: and(eq(customers.tenantId, tenantId), eq(customers.phone, phone)),
      with: { loyaltyTier: true },
      limit: 2,
    });
    if (local.length || !phone) return local;

    // H5 first-visit recognition: when the customer is known only at a
    // sibling tenant, materialize a tenant-local customer row linked to the
    // shared organization identity. Orders therefore keep tenant-local FKs
    // while stage 6 can discover the organization tier earned elsewhere.
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
      columns: { organizationId: true },
    });
    if (!tenant?.organizationId) return [];

    const siblingRows = await db
      .select({
        id: customers.id,
        tenantId: customers.tenantId,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        organizationCustomerId: customers.organizationCustomerId,
      })
      .from(customers)
      .innerJoin(tenants, eq(tenants.id, customers.tenantId))
      .where(
        and(
          eq(tenants.organizationId, tenant.organizationId),
          eq(customers.phone, phone),
        ),
      )
      .limit(2);
    if (siblingRows.length !== 1) return [];

    const sibling = siblingRows[0]!;
    const identityId = sibling.organizationCustomerId ?? sibling.id;
    if (!sibling.organizationCustomerId) {
      await db
        .update(customers)
        .set({ organizationCustomerId: identityId, updatedAt: new Date() })
        .where(
          and(
            eq(customers.tenantId, sibling.tenantId),
            eq(customers.id, sibling.id),
          ),
        );
    }

    // Re-check after the sibling lookup to avoid creating a duplicate when a
    // concurrent request materialized this tenant-local identity first.
    const concurrentlyCreated = await db.query.customers.findMany({
      where: and(eq(customers.tenantId, tenantId), eq(customers.phone, phone)),
      with: { loyaltyTier: true },
      limit: 2,
    });
    if (concurrentlyCreated.length) return concurrentlyCreated;

    const [created] = await db
      .insert(customers)
      .values({
        tenantId,
        name: sibling.name,
        email: sibling.email,
        phone,
        organizationCustomerId: identityId,
        loyaltyTierId: null,
      })
      .returning();
    if (!created) return [];
    const hydrated = await db.query.customers.findFirst({
      where: and(eq(customers.tenantId, tenantId), eq(customers.id, created.id)),
      with: { loyaltyTier: true },
    });
    return hydrated ? [hydrated] : [];
  },
  async findOrganizationCustomerIdentity(tenantId: string, phone: string) {
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
      columns: { organizationId: true },
    });
    if (!tenant?.organizationId) return null;
    const [match] = await db
      .select({
        id: customers.id,
        tenantId: customers.tenantId,
        organizationCustomerId: customers.organizationCustomerId,
      })
      .from(customers)
      .innerJoin(tenants, eq(tenants.id, customers.tenantId))
      .where(
        and(
          eq(tenants.organizationId, tenant.organizationId),
          eq(customers.phone, phone),
        ),
      )
      .limit(1);
    if (!match) return null;
    const identityId = match.organizationCustomerId ?? match.id;
    // H5 first-visit linking: customers may not yet have an organization identity link.
    // Link the first matched sibling lazily so a newly-created customer at
    // another tenant can immediately discover that sibling's org-tier assignment.
    if (!match.organizationCustomerId) {
      await db.update(customers)
        .set({ organizationCustomerId: identityId, updatedAt: new Date() })
        .where(and(eq(customers.tenantId, match.tenantId), eq(customers.id, match.id)));
    }
    return identityId;
  },
  async setOrganizationCustomerIdentity(tenantId: string, customerId: string, organizationCustomerId: string | null) {
    const [row] = await db
      .update(customers)
      .set({ organizationCustomerId, updatedAt: new Date() })
      .where(and(eq(customers.tenantId, tenantId), eq(customers.id, customerId)))
      .returning();
    return row;
  },
  async createCustomer(data: NewCustomer) {
    const [row] = await db.insert(customers).values(data).returning();
    return row!;
  },
  async updateCustomer(
    tenantId: string,
    id: string,
    data: Partial<NewCustomer>,
  ) {
    const [row] = await db
      .update(customers)
      .set(compact({ ...data, updatedAt: new Date() }))
      .where(and(eq(customers.tenantId, tenantId), eq(customers.id, id)))
      .returning();
    return row;
  },
};
