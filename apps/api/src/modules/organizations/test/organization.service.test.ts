import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "../../../core/errors";
import { organizationNotFound } from "../organization.errors";

const repository = vi.hoisted(() => ({
  findMembershipsByUserId: vi.fn(),
  findMembership: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}));

vi.mock("../organization.repository", () => ({
  organizationRepository: repository,
}));

import { organizationService } from "../organization.service";

const auth = {
  userId: "user-1",
  tenantId: "",
  branchId: null,
  email: "owner@example.com",
  roles: ["OWNER"],
  permissions: [],
  tenantWide: true,
  authorizedBranchIds: [],
} as any;

describe("organizationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists organizations for the authenticated user", async () => {
    repository.findMembershipsByUserId.mockResolvedValue([
      { id: "membership-1", organization: { id: "org-1", name: "Acme" } },
    ]);

    await expect(organizationService.list(auth)).resolves.toEqual([
      { id: "membership-1", organization: { id: "org-1", name: "Acme" } },
    ]);
    expect(repository.findMembershipsByUserId).toHaveBeenCalledWith("user-1");
  });

  it("creates an organization only for the global owner", async () => {
    repository.create.mockResolvedValue({
      organization: { id: "org-1", name: "Acme" },
      membership: { id: "membership-1" },
    });

    await expect(
      organizationService.create(auth, { name: " Acme " }),
    ).resolves.toEqual({
      organization: { id: "org-1", name: "Acme" },
      membershipId: "membership-1",
    });
    expect(repository.create).toHaveBeenCalledWith({
      name: "Acme",
      createdBy: "user-1",
    });
  });

  it("rejects organization creation for non-owners", async () => {
    await expect(
      organizationService.create(
        { ...auth, roles: ["MANAGER"] },
        { name: "Acme" },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(repository.create).not.toHaveBeenCalled();
  });

  it("requires active membership before update or archive", async () => {
    repository.findMembership.mockResolvedValue(undefined);

    await expect(
      organizationService.update(auth, "org-missing", { name: "New" }),
    ).rejects.toEqual(organizationNotFound("org-missing"));
    await expect(
      organizationService.archive(auth, "org-missing"),
    ).rejects.toEqual(organizationNotFound("org-missing"));
    expect(repository.update).not.toHaveBeenCalled();
  });
});
