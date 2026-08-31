import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findApplicableTier,
  findOrganizationCustomerIdentity,
  createCustomer,
  setOrganizationCustomerIdentity,
} = vi.hoisted(() => ({
  findApplicableTier: vi.fn(),
  findOrganizationCustomerIdentity: vi.fn(),
  createCustomer: vi.fn(),
  setOrganizationCustomerIdentity: vi.fn(),
}));
vi.mock("../loyalty.repository", () => ({
  loyaltyRepository: {
    findApplicableTier,
    findOrganizationCustomerIdentity,
    createCustomer,
    setOrganizationCustomerIdentity,
  },
}));
vi.mock("../../../core/auth", () => ({ requirePermission: vi.fn() }));
vi.mock("../../../core/audit", () => ({ writeAudit: vi.fn() }));

import { loyaltyService } from "../loyalty.service";

const auth = {
  tenantId: "tenant-b",
  branchId: "branch-b",
  userId: "user",
  roles: [],
  permissions: [],
} as never;

const created = {
  id: "customer-b",
  tenantId: "tenant-b",
  name: "Guest",
  email: null,
  phone: "+919999999999",
  loyaltyTierId: "org-tier",
  organizationCustomerId: "customer-a",
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("H5 organization-level loyalty identity", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findApplicableTier.mockResolvedValue({ id: "org-tier", tenantId: null, organizationId: "org" });
    findOrganizationCustomerIdentity.mockResolvedValue("customer-a");
    createCustomer.mockResolvedValue(created);
    setOrganizationCustomerIdentity.mockResolvedValue(created);
  });

  it("accepts an organization-scoped tier and links a matching phone to the sibling customer identity", async () => {
    await loyaltyService.createCustomer(auth, {
      name: "Guest",
      phone: "+919999999999",
      loyaltyTierId: "org-tier",
    });
    expect(findApplicableTier).toHaveBeenCalledWith("tenant-b", "org-tier");
    expect(findOrganizationCustomerIdentity).toHaveBeenCalledWith("tenant-b", "+919999999999");
    expect(createCustomer).toHaveBeenCalledWith(expect.objectContaining({
      tenantId: "tenant-b",
      loyaltyTierId: "org-tier",
      organizationCustomerId: "customer-a",
    }));
    expect(setOrganizationCustomerIdentity).not.toHaveBeenCalled();
  });

  it("seeds a stable shared identity for the first customer when no sibling match exists", async () => {
    findOrganizationCustomerIdentity.mockResolvedValue(null);
    createCustomer.mockResolvedValue({ ...created, organizationCustomerId: null });
    await loyaltyService.createCustomer(auth, {
      name: "Guest",
      phone: "+919999999999",
      loyaltyTierId: "org-tier",
    });
    expect(setOrganizationCustomerIdentity).toHaveBeenCalledWith(
      "tenant-b",
      "customer-b",
      "customer-b",
    );
  });
});
