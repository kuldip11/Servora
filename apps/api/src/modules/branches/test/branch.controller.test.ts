import { describe, expect, it, vi, beforeEach } from "vitest";
const { list, create, update, deactivate } = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  deactivate: vi.fn(),
}));
vi.mock("../branch.service", () => ({
  branchService: { list, create, update, deactivate },
}));
import { branchController } from "@/modules/branches/branch.controller";
const auth = {
  userId: "u1",
  tenantId: "t1",
  branchId: "b1",
  email: "u@example.com",
  roles: [],
  permissions: [],
} as any;
beforeEach(() => {
  vi.clearAllMocks();
});
describe("branch controller", () => {
  it("delegates list and wraps the result", async () => {
    list.mockResolvedValue([{ id: "b1" }]);
    await expect(branchController.list(auth)).resolves.toEqual({
      success: true,
      data: [{ id: "b1" }],
    });
    expect(list).toHaveBeenCalledWith(auth);
  });
  it("delegates create/update and uses the correct response envelopes", async () => {
    const input = { name: "Main" } as any;
    create.mockResolvedValue({ id: "b1" });
    update.mockResolvedValue({ id: "b1", name: "Updated" });
    await expect(branchController.create(auth, input)).resolves.toEqual({
      success: true,
      data: { id: "b1" },
    });
    await expect(branchController.update(auth, "b1", input)).resolves.toEqual({
      success: true,
      data: { id: "b1", name: "Updated" },
    });
    expect(create).toHaveBeenCalledWith(auth, input);
    expect(update).toHaveBeenCalledWith(auth, "b1", input);
  });
  it("delegates deactivation and returns a null success payload", async () => {
    deactivate.mockResolvedValue({ id: "b1", isActive: false });
    await expect(branchController.deactivate(auth, "b1")).resolves.toEqual({
      success: true,
      data: null,
    });
    expect(deactivate).toHaveBeenCalledWith(auth, "b1");
  });
});
