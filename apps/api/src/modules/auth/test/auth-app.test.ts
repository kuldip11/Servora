import { describe, expect, it } from "vitest";
import {
  assertAppRoleAccess,
  assertTokenApp,
  hasAppRoleAccess,
  hasMembershipAppAccess,
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


  it("does not trust custom roles that spoof system role names", () => {
    expect(
      hasMembershipAppAccess(
        "waiter",
        [{ name: "WAITER", isSystem: false }],
        [],
      ),
    ).toBe(false);
    expect(
      hasMembershipAppAccess(
        "waiter",
        [{ name: "Floor Captain", isSystem: false }],
        ["menu:read", "orders:read", "orders:update_status"],
      ),
    ).toBe(true);
    expect(
      hasMembershipAppAccess(
        "kitchen",
        [{ name: "Line Cook", isSystem: false }],
        ["kitchen:read", "kitchen:update"],
      ),
    ).toBe(true);
  });

  it("rejects an access token issued for another Servora application", () => {
    expect(() => assertTokenApp("kitchen", "web")).toThrow(
      "Session is not valid for this application",
    );
    expect(() => assertTokenApp("web", "web")).not.toThrow();
  });
});
