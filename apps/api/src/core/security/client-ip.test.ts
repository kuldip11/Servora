import { describe, expect, it } from "vitest";
import { resolveClientIp } from "./client-ip";

describe("resolveClientIp", () => {
  it("ignores forwarding headers when no proxy hop is trusted", () => {
    expect(
      resolveClientIp(
        { "x-forwarded-for": "203.0.113.1", "x-real-ip": "203.0.113.2" },
        "10.0.0.5",
        0,
      ),
    ).toBe("10.0.0.5");
  });

  it("resolves the client before the configured trusted proxy chain", () => {
    expect(
      resolveClientIp(
        { "x-forwarded-for": "203.0.113.1, 10.0.0.4" },
        "10.0.0.5",
        2,
      ),
    ).toBe("203.0.113.1");
  });

  it("uses x-real-ip only when forwarding is trusted and x-forwarded-for is absent", () => {
    expect(resolveClientIp({ "x-real-ip": "203.0.113.9" }, "10.0.0.5", 1)).toBe(
      "203.0.113.9",
    );
  });
});
