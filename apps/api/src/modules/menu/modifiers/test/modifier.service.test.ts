import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  findModifierGroup,
  findModifierOption,
  updateModifierGroup,
  createModifierGroup,
} = vi.hoisted(() => ({
  findModifierGroup: vi.fn(),
  findModifierOption: vi.fn(),
  updateModifierGroup: vi.fn(),
  createModifierGroup: vi.fn(),
}));

vi.mock("../modifier.repository", () => ({
  modifierRepository: {
    findModifierGroup,
    findModifierOption,
    updateModifierGroup,
    createModifierGroup,
    setModifierGroupOptions: vi.fn(),
  },
}));
vi.mock("../../../../core/auth", () => ({
  requirePermission: vi.fn(),
}));
vi.mock("../../menu-authorization", () => ({
  assertMenuResourceBranch: vi.fn(),
  resolveMenuBranch: vi.fn(() => "branch-1"),
}));
vi.mock("../../change-log/menu-change-log", () => ({
  buildDiff: vi.fn(() => ({})),
  menuChangeLog: { record: vi.fn() },
}));

import { modifierService } from "../modifier.service";

const auth = {
  tenantId: "tenant-1",
  branchId: "branch-1",
  userId: "user-1",
} as never;

beforeEach(() => {
  vi.clearAllMocks();
  updateModifierGroup.mockResolvedValue({
    id: "group-a",
    branchId: "branch-1",
    dependsOnOptionId: null,
    groupType: "ADDON",
  });
});

describe("modifierService conditional dependency validation", () => {
  it("rejects an arbitrary-depth circular dependency at write time", async () => {
    findModifierGroup.mockImplementation(async (_tenantId: string, groupId: string) => {
      if (groupId === "group-a") return { id: "group-a", branchId: "branch-1", dependsOnOptionId: null, groupType: "ADDON" };
      if (groupId === "group-b") return { id: "group-b", branchId: "branch-1", dependsOnOptionId: "option-c", groupType: "ADDON" };
      if (groupId === "group-c") return { id: "group-c", branchId: "branch-1", dependsOnOptionId: "option-a", groupType: "ADDON" };
      return undefined;
    });
    findModifierOption.mockImplementation(async (_tenantId: string, optionId: string) => {
      if (optionId === "option-b") return { id: optionId, modifierGroupId: "group-b" };
      if (optionId === "option-c") return { id: optionId, modifierGroupId: "group-c" };
      if (optionId === "option-a") return { id: optionId, modifierGroupId: "group-a" };
      return undefined;
    });

    await expect(
      modifierService.updateGroup(auth, "group-a", {
        dependsOnOptionId: "option-b",
      }),
    ).rejects.toThrow("Circular modifier group dependency");
    expect(updateModifierGroup).not.toHaveBeenCalled();
  });

  it("allows an acyclic dependency chain and persists the dependency", async () => {
    findModifierGroup.mockImplementation(async (_tenantId: string, groupId: string) => {
      if (groupId === "group-a") return { id: "group-a", branchId: "branch-1", dependsOnOptionId: null, groupType: "ADDON" };
      if (groupId === "group-b") return { id: "group-b", branchId: "branch-1", dependsOnOptionId: "option-c", groupType: "ADDON" };
      if (groupId === "group-c") return { id: "group-c", branchId: "branch-1", dependsOnOptionId: null, groupType: "ADDON" };
      return undefined;
    });
    findModifierOption.mockImplementation(async (_tenantId: string, optionId: string) => {
      if (optionId === "option-b") return { id: optionId, modifierGroupId: "group-b" };
      if (optionId === "option-c") return { id: optionId, modifierGroupId: "group-c" };
      return undefined;
    });

    await expect(
      modifierService.updateGroup(auth, "group-a", {
        dependsOnOptionId: "option-b",
      }),
    ).resolves.toBeTruthy();
    expect(updateModifierGroup).toHaveBeenCalledWith(
      "tenant-1",
      "group-a",
      expect.objectContaining({ dependsOnOptionId: "option-b" }),
    );
  });

  it("persists dependency and group type on create", async () => {
    createModifierGroup.mockResolvedValue({ id: "group-new" });
    await modifierService.createGroup(auth, {
      name: "Swap side",
      groupType: "SUBSTITUTION",
      dependsOnOptionId: "option-parent",
    });
    expect(createModifierGroup).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "tenant-1",
        branchId: "branch-1",
        groupType: "SUBSTITUTION",
        dependsOnOptionId: "option-parent",
      }),
    );
  });
});
