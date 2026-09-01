import { describe, expect, it } from "vitest";
import { loginSchema, signupSchema } from "../auth";

const validSignup = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  password: "password123",
};

describe("signupSchema", () => {
  it("accepts valid standalone signup data", () => {
    expect(signupSchema.parse(validSignup)).toEqual(validSignup);
  });
  it.each([
    ["firstName", ""],
    ["lastName", ""],
    ["email", "not-an-email"],
    ["password", "short"],
  ])("rejects invalid %s", (field, value) => {
    expect(
      signupSchema.safeParse({ ...validSignup, [field]: value }).success,
    ).toBe(false);
  });
  it("enforces password and name upper bounds", () => {
    expect(
      signupSchema.safeParse({ ...validSignup, firstName: "a".repeat(51) })
        .success,
    ).toBe(false);
    expect(
      signupSchema.safeParse({ ...validSignup, password: "p".repeat(101) })
        .success,
    ).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts a valid email and non-empty password", () => {
    expect(
      loginSchema.safeParse({ email: "ada@example.com", password: "x" })
        .success,
    ).toBe(true);
  });
  it("rejects an invalid email or empty password", () => {
    expect(loginSchema.safeParse({ email: "bad", password: "x" }).success).toBe(
      false,
    );
    expect(
      loginSchema.safeParse({ email: "ada@example.com", password: "" }).success,
    ).toBe(false);
  });
});
