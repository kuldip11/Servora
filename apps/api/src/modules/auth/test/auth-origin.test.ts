import { describe, expect, it } from "vitest";
import { assertTrustedAuthOrigin } from "@/modules/auth/auth-origin";


describe("auth origin policy", () => {
  it("accepts configured browser origins", () => {
    expect(() =>
      assertTrustedAuthOrigin("http://localhost:5173"),
    ).not.toThrow();
  });

  it("rejects untrusted browser origins", () => {
    expect(() => assertTrustedAuthOrigin("https://evil.example")).toThrow(
      "Request origin is not allowed",
    );
  });
});
