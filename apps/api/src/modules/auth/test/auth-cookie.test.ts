import { describe, expect, it } from "vitest";
import {
  REFRESH_COOKIE_NAME,
  clearRefreshCookie,
  readRefreshCookie,
  serializeRefreshCookie,
} from "@/modules/auth/auth-cookie";

describe("refresh cookie", () => {
  it("is HttpOnly and scoped to auth endpoints", () => {
    const value = serializeRefreshCookie("token value");
    expect(value).toContain(`${REFRESH_COOKIE_NAME}=token%20value`);
    expect(value).toContain("Path=/api/auth");
    expect(value).toContain("HttpOnly");
    expect(value).not.toContain("Domain=");
  });

  it("reads only the named refresh cookie", () => {
    expect(
      readRefreshCookie("other=x; servora_refresh_web=abc%20123; foo=y"),
    ).toBe("abc 123");
    expect(readRefreshCookie("other=x")).toBeNull();
  });

  it("isolates refresh cookies by application", () => {
    const web = serializeRefreshCookie("web-token", "web");
    const kitchen = serializeRefreshCookie("kitchen-token", "kitchen");
    const waiter = serializeRefreshCookie("waiter-token", "waiter");

    expect(web).toContain("servora_refresh_web=web-token");
    expect(kitchen).toContain("servora_refresh_kitchen=kitchen-token");
    expect(waiter).toContain("servora_refresh_waiter=waiter-token");
    expect(
      readRefreshCookie(
        "servora_refresh_web=owner; servora_refresh_kitchen=chef",
        "web",
      ),
    ).toBe("owner");
    expect(
      readRefreshCookie(
        "servora_refresh_web=owner; servora_refresh_kitchen=chef",
        "kitchen",
      ),
    ).toBe("chef");
  });

  it("clears only the requested application cookie", () => {
    expect(clearRefreshCookie("kitchen")).toContain(
      "servora_refresh_kitchen=",
    );
    expect(clearRefreshCookie("kitchen")).toContain("Max-Age=0");
  });
});
