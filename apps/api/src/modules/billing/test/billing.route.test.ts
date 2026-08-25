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

const { createPayment } = vi.hoisted(() => ({ createPayment: vi.fn() }));
const { createRefund } = vi.hoisted(() => ({ createRefund: vi.fn() }));
const { getBill } = vi.hoisted(() => ({ getBill: vi.fn() }));
vi.mock("../billing.controller", () => ({
  billingController: { createPayment, createRefund, getBill },
}));
import { billingRouter } from "../billing.route";

describe("billing routes", () => {
  it("registers the payment, refund, and bill endpoints", () => {
    const routes = (billingRouter as any).routes;
    expect(routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ method: "POST", path: "/api/payments" }),
        expect.objectContaining({ method: "POST", path: "/api/refunds" }),
        expect.objectContaining({ method: "GET", path: "/api/bills/:id" }),
      ]),
    );
  });
});
