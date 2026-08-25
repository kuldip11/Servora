import { beforeEach, describe, expect, it, vi } from "vitest";
const { list, create, update, remove, listRoles } = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  listRoles: vi.fn(),
}));
vi.mock("../staff.service", () => ({
  staffService: { list, create, update, remove, listRoles },
}));
import { staffController } from "../staff.controller";
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
describe("staff controller", () => {
  it("delegates list/create/update and uses response envelopes", async () => {
    list.mockResolvedValue([{ id: "m1" }]);
    create.mockResolvedValue({ id: "m1" });
    update.mockResolvedValue({ id: "m1", firstName: "New" });
    expect(await staffController.list(auth)).toEqual({
      success: true,
      data: [{ id: "m1" }],
    });
    expect(
      await staffController.create(auth, { firstName: "A" } as any),
    ).toEqual({ success: true, data: { id: "m1" } });
    expect(
      await staffController.update(auth, "u2", { firstName: "New" }),
    ).toEqual({ success: true, data: { id: "m1", firstName: "New" } });
    expect(list).toHaveBeenCalledWith(auth);
    expect(create).toHaveBeenCalledWith(auth, { firstName: "A" });
    expect(update).toHaveBeenCalledWith(auth, "u2", { firstName: "New" });
  });
  it("returns null after removal and delegates role listing", async () => {
    remove.mockResolvedValue(undefined);
    listRoles.mockResolvedValue([{ name: "CASHIER" }]);
    expect(await staffController.remove(auth, "u2")).toEqual({
      success: true,
      data: null,
    });
    expect(await staffController.listRoles(auth)).toEqual({
      success: true,
      data: [{ name: "CASHIER" }],
    });
  });
});
