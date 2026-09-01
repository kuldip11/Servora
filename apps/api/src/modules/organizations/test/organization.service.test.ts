import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForbiddenError } from "@/core/errors";
import { organizationNotFound } from "@/modules/organizations/organization.errors";

const repository = vi.hoisted(() => ({
  findMembershipsByUserId: vi.fn(),
  findMembership: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  findTenant: vi.fn(),
  listTenants: vi.fn(),
  listMenus: vi.fn(),
  createMenu: vi.fn(),
  updateMenu: vi.fn(),
  deleteMenu: vi.fn(),
}));

vi.mock("../organization.repository", () => ({
  organizationRepository: repository,
}));

const { writeAudit } = vi.hoisted(() => ({ writeAudit: vi.fn() }));
vi.mock("../../../core/audit", () => ({ writeAudit }));

import { organizationService } from "@/modules/organizations/organization.service";

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
      { id: "org-1", name: "Acme" },
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

describe("G7 organization inheritance authorization", () => {
  const orgAuth = {
    ...auth,
    tenantId: "tenant-1",
    roles: ["MANAGER"],
    permissions: ["organization:manage"],
  };

  beforeEach(() => {
    repository.findMembership.mockResolvedValue({
      id: "membership-1",
      organizationId: "org-1",
      status: "ACTIVE",
    });
    repository.findTenant.mockResolvedValue({
      id: "tenant-1",
      organizationId: "org-1",
    });
    writeAudit.mockResolvedValue(undefined);
  });

  it("requires organization:manage even for an active organization member", async () => {
    await expect(
      organizationService.listMenus({ ...orgAuth, permissions: [] }, "org-1"),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(repository.listMenus).not.toHaveBeenCalled();
  });

  it("allows an organization member to manage it independently of the selected franchise", async () => {
    repository.findTenant.mockResolvedValue({
      id: "tenant-1",
      organizationId: "org-2",
    });
    await expect(
      organizationService.listMenus(orgAuth, "org-1"),
    ).resolves.toBeUndefined();
    expect(repository.listMenus).toHaveBeenCalledWith("org-1");
  });

  it("creates an organization menu by stable SKU and writes an audit record", async () => {
    repository.createMenu.mockResolvedValue({
      id: "menu-org",
      status: "PUBLISHED",
      organizationItems: [{ itemSku: "PIZZA-1" }],
    });
    await expect(
      organizationService.createMenu(orgAuth, "org-1", {
        name: "Group menu",
        status: "PUBLISHED",
        items: [{ itemSku: " PIZZA-1 " }],
      }),
    ).resolves.toMatchObject({ id: "menu-org" });
    expect(repository.createMenu).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        items: [expect.objectContaining({ itemSku: "PIZZA-1" })],
      }),
    );
    expect(writeAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ORGANIZATION_MENU_CREATED",
        metadata: expect.objectContaining({ organizationId: "org-1" }),
      }),
    );
  });
});
