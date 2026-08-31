import { describe, expect, it } from "vitest";
import {
  assertAppRoleAccess,
  assertTokenApp,
  hasAppRoleAccess,
  parseAuthApp,
} from "@/modules/auth/auth-app";


describe("auth application policy", () => {
  it("parses supported applications and rejects missing/unknown clients", () => {
    expect(parseAuthApp("WEB")).toBe("web");
    expect(parseAuthApp("kitchen")).toBe("kitchen");
    expect(() => parseAuthApp(undefined)).toThrow(
      "Application identity is missing or invalid",
    );
    expect(() => parseAuthApp("customer")).toThrow(
      "Application identity is missing or invalid",
    );
  });

  it("keeps Chef and Waiter accounts in their intended applications", () => {
    expect(hasAppRoleAccess("web", ["CHEF"])).toBe(false);
    expect(hasAppRoleAccess("kitchen", ["CHEF"])).toBe(true);
    expect(hasAppRoleAccess("web", ["WAITER"])).toBe(false);
    expect(hasAppRoleAccess("waiter", ["WAITER"])).toBe(true);
    expect(() => assertAppRoleAccess("web", ["CHEF"])).toThrow(
      "Account does not have access to this application",
    );
  });

  it("rejects an access token issued for another Servora application", () => {
    expect(() => assertTokenApp("kitchen", "web")).toThrow(
      "Session is not valid for this application",
    );
    expect(() => assertTokenApp("web", "web")).not.toThrow();
  });
});
