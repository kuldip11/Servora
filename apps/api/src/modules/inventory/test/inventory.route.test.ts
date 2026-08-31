vi.mock("elysia", async (importOriginal) => {
  const actual = await importOriginal<typeof import("elysia")>();
  class FakeElysia {
    routes: any[] = [];
    name: string;
    constructor(options: any = {}) {
      this.name = options.name ?? "";
    }
    use(plugin: any) {
      return this;
    }
    get(path: string, handler?: unknown) {
      this.routes.push({ method: "GET", path, handler });
      return this;
    }
    post(path: string, handler?: unknown) {
      this.routes.push({ method: "POST", path, handler });
      return this;
    }
    put(path: string) {
      this.routes.push({ method: "PUT", path });
      return this;
    }
    patch(path: string, handler?: unknown) {
      this.routes.push({ method: "PATCH", path, handler });
      return this;
    }
    delete(path: string) {
      this.routes.push({ method: "DELETE", path });
      return this;
    }
    ws(path: string) {
      this.routes.push({ method: "WS", path });
      return this;
    }
  }
  return { ...actual, Elysia: FakeElysia };
});
vi.mock("../../../core/auth", () => ({ requireAuthPlugin: () => ({}) }));
import { describe, expect, it, vi } from "vitest";
const {
  list,
  create,
  updateStock,
  lowStockAlerts,
  recentTransactions,
  logWaste,
} = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  updateStock: vi.fn(),
  lowStockAlerts: vi.fn(),
  recentTransactions: vi.fn(),
  logWaste: vi.fn(),
}));
vi.mock("../inventory.controller", () => ({
  inventoryController: {
    list,
    create,
    updateStock,
    lowStockAlerts,
    recentTransactions,
    logWaste,
  },
}));
import { inventoryRouter } from "@/modules/inventory/inventory.route";
describe("inventory routes", () => {
  it("registers item, stock, and low-stock endpoints", () => {
    expect((inventoryRouter as any).routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          method: "GET",
          path: "/api/inventory/items",
        }),
        expect.objectContaining({
          method: "POST",
          path: "/api/inventory/items",
        }),
        expect.objectContaining({
          method: "PATCH",
          path: "/api/inventory/items/:id/stock",
        }),
        expect.objectContaining({
          method: "GET",
          path: "/api/inventory/alerts/low-stock",
        }),
        expect.objectContaining({
          method: "GET",
          path: "/api/inventory/transactions",
        }),
        expect.objectContaining({
          method: "GET",
          path: "/api/inventory/items/:id/recipe-impact",
        }),
        expect.objectContaining({
          method: "POST",
          path: "/api/inventory/items/:id/waste",
        }),
      ]),
    );
  });

  it("forwards the reason-coded waste payload through the HTTP endpoint", async () => {
    logWaste.mockResolvedValue({
      success: true,
      data: { transaction: { wasteReasonId: "wr1" } },
    });
    const route = (
      inventoryRouter as {
        routes: Array<{
          method: string;
          path: string;
          handler?: (context: unknown) => unknown;
        }>;
      }
    ).routes.find(
      (candidate) =>
        candidate.method === "POST" &&
        candidate.path === "/api/inventory/items/:id/waste",
    );
    expect(route?.handler).toBeTypeOf("function");

    const body = { quantity: 2, wasteReasonId: "wr1", notes: "Trim loss" };
    await route!.handler!({
      auth: { tenantId: "t1" },
      params: { id: "i1" },
      body,
    });

    expect(logWaste).toHaveBeenCalledWith({ tenantId: "t1" }, "i1", body);
  });
});
