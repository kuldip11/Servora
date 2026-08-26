import { describe, expect, it, vi } from "vitest";
const api = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));
vi.mock("../../../../shared/lib/api-client", () => ({ apiClient: api }));
import { branchesService } from "../branches.service";
const input = {
  name: "Main",
  dineInEnabled: true,
  takeawayEnabled: true,
  deliveryEnabled: false,
  onlineEnabled: true,
  tablesEnabled: true,
};

describe("branchesService", () => {
  it("lists branches", async () => {
    api.get.mockResolvedValue({ data: { data: ["b"] } });
    await expect(branchesService.list()).resolves.toEqual(["b"]);
    expect(api.get).toHaveBeenCalledWith("/branches");
  });
  it("creates a branch", async () => {
    api.post.mockResolvedValue({ data: { data: { id: "b1" } } });
    await expect(branchesService.create(input)).resolves.toEqual({ id: "b1" });
    expect(api.post).toHaveBeenCalledWith("/branches", input);
  });
  it("updates a branch", async () => {
    api.patch.mockResolvedValue({ data: { data: { id: "b1" } } });
    await expect(branchesService.update("b1", input)).resolves.toEqual({
      id: "b1",
    });
    expect(api.patch).toHaveBeenCalledWith("/branches/b1", input);
  });
  it("deactivates a branch", async () => {
    api.delete.mockResolvedValue({});
    await branchesService.deactivate("b1");
    expect(api.delete).toHaveBeenCalledWith("/branches/b1");
  });
});
