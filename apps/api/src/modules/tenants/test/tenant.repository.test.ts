import { beforeEach, describe, expect, it, vi } from "vitest";

const { transaction, insert } = vi.hoisted(() => {
  const insert = vi.fn();
  const transaction = vi.fn(
    async (callback: (tx: { insert: typeof insert }) => unknown) =>
      callback({ insert }),
  );
  return { transaction, insert };
});

vi.mock("@/db", () => ({
  db: { transaction },
}));

import { menus, tenants } from "@/db/schema";
import { tenantRepository } from "@/modules/tenants/tenant.repository";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("tenant repository", () => {
  it("creates every new franchise with a published automatic Default Menu", async () => {
    const tenant = {
      id: "tenant-1",
      name: "KKS",
      createdBy: "user-1",
      organizationId: "org-1",
    };
    const tenantReturning = vi.fn().mockResolvedValue([tenant]);
    const tenantValues = vi
      .fn()
      .mockReturnValue({ returning: tenantReturning });
    const menuValues = vi.fn().mockResolvedValue(undefined);

    insert.mockImplementation((table) => {
      if (table === tenants) return { values: tenantValues };
      if (table === menus) return { values: menuValues };
      throw new Error("Unexpected insert target");
    });

    await expect(
      tenantRepository.create({
        name: "KKS",
        createdBy: "user-1",
        organizationId: "org-1",
      }),
    ).resolves.toEqual(tenant);

    expect(menuValues).toHaveBeenCalledWith({
      tenantId: "tenant-1",
      name: "Default Menu",
      status: "PUBLISHED",
      isDefault: true,
    });
  });
});
