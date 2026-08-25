import { describe, expect, it, vi } from "vitest";
vi.mock("elysia", () => {
  class FakeElysia {
    name: string;
    constructor(options: any = {}) {
      this.name = options.name ?? "";
    }
    onBeforeHandle() {
      return this;
    }
  }
  return { Elysia: FakeElysia };
});
import { menuAuthorizationPlugin } from "../menu-authorization-plugin";
describe("menu authorization plugin", () => {
  it("creates the named Elysia plugin", () => {
    const plugin: any = menuAuthorizationPlugin();
    expect(plugin).toBeTruthy();
    expect(plugin.name).toBe("menu-authorization");
  });
});
