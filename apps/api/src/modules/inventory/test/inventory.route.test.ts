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
    get(path: string) {
      this.routes.push({ method: "GET", path });
      return this;
    }
    post(path: string) {
      this.routes.push({ method: "POST", path });
      return this;
    }
    put(path: string) {
      this.routes.push({ method: "PUT", path });
      return this;
    }
    patch(path: string) {
      this.routes.push({ method: "PATCH", path });
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
const { list, create, updateStock, lowStockAlerts } = vi.hoisted(() => ({
  list: vi.fn(),
  create: vi.fn(),
  updateStock: vi.fn(),
  lowStockAlerts: vi.fn(),
}));
vi.mock("../inventory.controller", () => ({
  inventoryController: { list, create, updateStock, lowStockAlerts },
}));
import { inventoryRouter } from "../inventory.route";
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
      ]),
    );
  });
});
