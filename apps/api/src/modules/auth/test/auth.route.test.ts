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
import { describe, expect, it, vi } from "vitest";
const { signup, login, refresh, logout, me, memberships } = vi.hoisted(() => ({
  signup: vi.fn(),
  login: vi.fn(),
  refresh: vi.fn(),
  logout: vi.fn(),
  me: vi.fn(),
  memberships: vi.fn(),
}));
vi.mock("../auth.controller", () => ({
  authController: { signup, me, memberships },
}));
vi.mock("../../../core/auth", () => ({ requireAuthPlugin: () => ({}) }));
vi.mock("../auth.service", () => ({ authService: { login, refresh, logout } }));
import { authRouter, authMeRouter } from "../auth.route";
describe("auth routes", () => {
  it("registers public signup/login/refresh routes", () => {
    expect((authRouter as any).routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ method: "POST", path: "/api/auth/signup" }),
        expect.objectContaining({ method: "POST", path: "/api/auth/login" }),
        expect.objectContaining({ method: "POST", path: "/api/auth/refresh" }),
      ]),
    );
  });
  it("registers protected me and memberships routes", () => {
    expect((authMeRouter as any).routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ method: "GET", path: "/api/auth/me" }),
        expect.objectContaining({
          method: "GET",
          path: "/api/auth/memberships",
        }),
      ]),
    );
  });
});
