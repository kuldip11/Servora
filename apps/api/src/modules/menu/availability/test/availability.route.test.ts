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
vi.mock("../../../../core/auth", () => ({ requireAuthPlugin: () => ({}) }));
import { describe, expect, it, vi } from "vitest";
import * as mod from "@/modules/menu/availability/availability.route";

describe("availability.route routes", () => {
  it("registers a non-empty Elysia router", () => {
    const routers = Object.values(mod).filter(
      (v: any) => v && Array.isArray(v.routes),
    );
    expect(routers.length).toBeGreaterThan(0);
    const routes = (
      routers[0] as { routes: Array<{ method: string; path: string }> }
    ).routes;
    expect(routes.length).toBeGreaterThan(0);
    expect(routes).toEqual(
      expect.arrayContaining([
        { method: "PUT", path: "/items/:id/manual-override" },
        { method: "DELETE", path: "/items/:id/manual-override" },
      ]),
    );
  });
});
