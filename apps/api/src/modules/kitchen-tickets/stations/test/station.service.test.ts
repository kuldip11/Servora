import { beforeEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({
  list: vi.fn(),
  findById: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  findRoutingResources: vi.fn(),
  setRoute: vi.fn(),
  removeRoute: vi.fn(),
  listRoutes: vi.fn(),
}));
vi.mock("../station.repository", () => ({ stationRepository: repository }));
import {
  stationResolver,
  stationService,
} from "@/modules/kitchen-tickets/stations/station.service";

const auth = {
  userId: "u1",
  tenantId: "t1",
  branchId: "b1",
  email: "x@y.test",
  roles: [],
  permissions: ["menu:read", "menu:update"],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("kitchen stations", () => {
  it("returns null when no station routing is configured", async () => {
    repository.listRoutes.mockResolvedValue([]);
    await expect(
      stationResolver.resolveForOrderItem("t1", "i1", ["o1"]),
    ).resolves.toBeNull();
  });

  it("prefers a selected modifier route over the item default", async () => {
    repository.listRoutes.mockResolvedValue([
      { stationId: "default", modifierOptionId: null },
      { stationId: "dessert", modifierOptionId: "o1" },
    ]);
    await expect(
      stationResolver.resolveForOrderItem("t1", "i1", []),
    ).resolves.toBe("default");
    await expect(
      stationResolver.resolveForOrderItem("t1", "i1", ["o1"]),
    ).resolves.toBe("dessert");
  });

  it("creates a station in the active tenant and branch", async () => {
    repository.create.mockResolvedValue({
      id: "s1",
      tenantId: "t1",
      branchId: "b1",
      name: "Grill",
    });
    await expect(
      stationService.create(auth, { name: "Grill" }),
    ).resolves.toMatchObject({ id: "s1" });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: "t1",
        branchId: "b1",
        name: "Grill",
      }),
    );
  });

  it("rejects cross-branch item routing", async () => {
    repository.findRoutingResources.mockResolvedValue({
      item: { id: "i1", branchId: "b2" },
      station: { id: "s1", branchId: "b1" },
      modifier: null,
    });
    await expect(
      stationService.setRoute(auth, "i1", { stationId: "s1" }),
    ).rejects.toThrow("Station branch does not match");
  });
});
