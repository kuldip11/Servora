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
    expect(readRefreshCookie("other=x; servora_refresh=abc%20123; foo=y")).toBe(
      "abc 123",
    );
    expect(readRefreshCookie("other=x")).toBeNull();
  });

  it("clears the cookie with an immediate expiry", () => {
    expect(clearRefreshCookie()).toContain("Max-Age=0");
  });
});
