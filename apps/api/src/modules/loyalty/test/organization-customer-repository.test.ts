import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  customerFindMany,
  customerFindFirst,
  tenantFindFirst,
  siblingLimit,
  updateWhere,
  insertValues,
  insertReturning,
} = vi.hoisted(() => ({
  customerFindMany: vi.fn(),
  customerFindFirst: vi.fn(),
  tenantFindFirst: vi.fn(),
  siblingLimit: vi.fn(),
  updateWhere: vi.fn(),
  insertValues: vi.fn(),
  insertReturning: vi.fn(),
}));

vi.mock("../../../db", () => ({
  db: {
    query: {
      customers: { findMany: customerFindMany, findFirst: customerFindFirst },
      tenants: { findFirst: tenantFindFirst },
    },
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        innerJoin: vi.fn(() => ({
          where: vi.fn(() => ({ limit: siblingLimit })),
        })),
      })),
    })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: updateWhere })) })),
    insert: vi.fn(() => ({
      values: insertValues.mockImplementation(() => ({
        returning: insertReturning,
      })),
    })),
  },
}));

import { loyaltyRepository } from "@/modules/loyalty/loyalty.repository";

describe("H5 organization customer first-visit recognition", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    tenantFindFirst.mockResolvedValue({ organizationId: "org-1" });
    updateWhere.mockResolvedValue(undefined);
    insertReturning.mockResolvedValue([{ id: "customer-b" }]);
    customerFindFirst.mockResolvedValue({
      id: "customer-b",
      tenantId: "tenant-b",
      name: "Guest",
      email: null,
      phone: "+919999999999",
      loyaltyTierId: null,
      organizationCustomerId: "customer-a",
      loyaltyTier: null,
    });
  });

  it("materializes a tenant-local customer linked to the sibling identity", async () => {
    customerFindMany.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    siblingLimit.mockResolvedValue([
      {
        id: "customer-a",
        tenantId: "tenant-a",
        name: "Guest",
        email: "guest@example.com",
        phone: "+919999999999",
        organizationCustomerId: null,
      },
    ]);

    const result = await loyaltyRepository.findCustomersByPhone(
      "tenant-b",
      "+919999999999",
    );

    expect(insertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-b",
        phone: "+919999999999",
        organizationCustomerId: "customer-a",
        loyaltyTierId: null,
      }),
    );
    expect(updateWhere).toHaveBeenCalledOnce();
    expect(result).toEqual([expect.objectContaining({ id: "customer-b" })]);
  });

  it("does not guess when the phone matches multiple sibling identities", async () => {
    customerFindMany.mockResolvedValueOnce([]);
    siblingLimit.mockResolvedValue([
      {
        id: "customer-a",
        tenantId: "tenant-a",
        name: "A",
        email: null,
        phone: "+919999999999",
        organizationCustomerId: "identity-a",
      },
      {
        id: "customer-c",
        tenantId: "tenant-c",
        name: "C",
        email: null,
        phone: "+919999999999",
        organizationCustomerId: "identity-c",
      },
    ]);

    const result = await loyaltyRepository.findCustomersByPhone(
      "tenant-b",
      "+919999999999",
    );

    expect(result).toEqual([]);
    expect(insertValues).not.toHaveBeenCalled();
  });
});
