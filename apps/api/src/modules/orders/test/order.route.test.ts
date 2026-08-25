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
vi.mock("../order.controller", () => ({
  orderController: {
    list: vi.fn(),
    getById: vi.fn(),
    getInventoryImpact: vi.fn(),
    create: vi.fn(),
    updateStatus: vi.fn(),
    fireTicket: vi.fn(),
  },
}));
import { ordersRouter } from "../order.route";

describe("orders routes", () => {
  it("registers all documented order endpoints", () => {
    expect((ordersRouter as any).routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ method: "GET", path: "/api/orders/" }),
        expect.objectContaining({ method: "GET", path: "/api/orders/:id" }),
        expect.objectContaining({
          method: "GET",
          path: "/api/orders/:id/inventory-impact",
        }),
        expect.objectContaining({ method: "POST", path: "/api/orders/" }),
        expect.objectContaining({
          method: "PATCH",
          path: "/api/orders/:id/status",
        }),
        expect.objectContaining({
          method: "POST",
          path: "/api/orders/:id/items",
        }),
      ]),
    );
  });
});
