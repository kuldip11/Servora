import { beforeEach, describe, expect, it, vi } from "vitest";
const { list, create, update, updateStatus, remove } = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  updateStatus: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("../table.service", () => ({
  tableService: { list, create, update, updateStatus, remove },
}));
import { tableController } from "../table.controller";
const auth: any = { tenantId: "t1", branchId: "b1" };
beforeEach(() => {
  vi.clearAllMocks();
});
describe("table controller", () => {
  it("delegates list/create/update and returns response envelopes", async () => {
    list.mockResolvedValue([{ id: "t1" }]);
    create.mockResolvedValue({ id: "t1" });
    update.mockResolvedValue({ id: "t1", name: "A" });
    expect(await tableController.list(auth)).toEqual({
      success: true,
      data: [{ id: "t1" }],
    });
    expect(await tableController.create(auth, { name: "A" })).toEqual({
      success: true,
      data: { id: "t1" },
    });
    expect(await tableController.update(auth, "t1", { name: "A" })).toEqual({
      success: true,
      data: { id: "t1", name: "A" },
    });
    expect(list).toHaveBeenCalledWith(auth);
    expect(create).toHaveBeenCalledWith(auth, { name: "A" });
    expect(update).toHaveBeenCalledWith(auth, "t1", { name: "A" });
  });
  it("delegates status changes and removal", async () => {
    updateStatus.mockResolvedValue({ id: "t1", status: "OCCUPIED" });
    remove.mockResolvedValue(undefined);
    expect(
      await tableController.updateStatus(auth, "t1", "OCCUPIED" as any),
    ).toEqual({ success: true, data: { id: "t1", status: "OCCUPIED" } });
    expect(await tableController.remove(auth, "t1")).toEqual({
      success: true,
      data: null,
    });
  });
});
