import { describe, expect, it } from "vitest";
import { createStaffSchema, updateStaffSchema } from "../staff";

const uuid = "550e8400-e29b-41d4-a716-446655440000";
const valid = {
  firstName: "Ada",
  lastName: "Lovelace",
  email: "ada@example.com",
  password: "password123",
  roleId: uuid,
};

describe("createStaffSchema", () => {
  it("accepts valid staff data and an optional branch", () =>
    expect(
      createStaffSchema.safeParse({ ...valid, branchId: uuid }).success,
    ).toBe(true));
  it("validates email, password, names, and UUIDs", () => {
    expect(
      createStaffSchema.safeParse({ ...valid, email: "bad" }).success,
    ).toBe(false);
    expect(
      createStaffSchema.safeParse({ ...valid, password: "short" }).success,
    ).toBe(false);
    expect(
      createStaffSchema.safeParse({ ...valid, roleId: "bad" }).success,
    ).toBe(false);
  });
});

describe("updateStaffSchema", () => {
  it("allows partial updates without a password", () => {
    expect(updateStaffSchema.parse({ firstName: "Grace" })).toEqual({
      firstName: "Grace",
    });
    const result = updateStaffSchema.parse({ password: "newpassword" });
    expect(result).toEqual({});
  });
  it("still validates supplied update fields", () =>
    expect(updateStaffSchema.safeParse({ email: "bad" }).success).toBe(false));
});
