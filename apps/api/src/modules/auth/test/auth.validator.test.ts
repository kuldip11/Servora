import { describe, expect, it } from "vitest";
import { Value } from "@sinclair/typebox/value";
import { signupBody, loginBody, refreshBody } from "../auth.validator";
describe("auth validators", () => {
  it("accepts valid signup payloads and enforces required fields", () => {
    expect(
      Value.Check(signupBody, {
        firstName: "A",
        lastName: "B",
        email: "a@example.com",
        password: "password123",
      }),
    ).toBe(true);
    expect(
      Value.Check(signupBody, {
        firstName: "",
        lastName: "B",
        email: "a@example.com",
        password: "password123",
      }),
    ).toBe(false);
    expect(
      Value.Check(signupBody, {
        firstName: "A",
        lastName: "B",
        email: "bad",
        password: "password123",
      }),
    ).toBe(false);
  });
  it("validates login and refresh token bodies", () => {
    expect(
      Value.Check(loginBody, { email: "a@example.com", password: "x" }),
    ).toBe(true);
    expect(Value.Check(loginBody, { email: "bad", password: "x" })).toBe(false);
    expect(Value.Check(refreshBody, { refreshToken: "token" })).toBe(true);
    expect(Value.Check(refreshBody, { refreshToken: "" })).toBe(false);
  });
});
