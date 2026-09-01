import { describe, expect, it } from "vitest";
import { Value } from "@sinclair/typebox/value";
import {
  createStaffBody,
  updateStaffBody,
  staffIdParams,
} from "@/modules/staff/staff.validator";
describe("staff validators", () => {
  it("accepts valid create payloads and rejects invalid required fields", () => {
    expect(
      Value.Check(createStaffBody, {
        firstName: "A",
        lastName: "B",
        email: "a@example.com",
        password: "password1",
        roleId: "r1",
      }),
    ).toBe(true);
    expect(
      Value.Check(createStaffBody, {
        firstName: "",
        lastName: "B",
        email: "a@example.com",
        password: "password1",
        roleId: "r1",
      }),
    ).toBe(false);
    expect(
      Value.Check(createStaffBody, {
        firstName: "A",
        lastName: "B",
        email: "bad",
        password: "password1",
        roleId: "r1",
      }),
    ).toBe(false);
    expect(
      Value.Check(createStaffBody, {
        firstName: "A",
        lastName: "B",
        email: "a@example.com",
        password: "short",
        roleId: "r1",
      }),
    ).toBe(false);
  });
  it("validates optional update fields and ids", () => {
    expect(
      Value.Check(updateStaffBody, {
        status: "ACTIVE",
        roleId: "r1",
        branchIds: ["b1"],
      }),
    ).toBe(true);
    expect(Value.Check(updateStaffBody, { status: "NOPE" })).toBe(false);
    expect(Value.Check(updateStaffBody, { branchIds: [1] })).toBe(false);
    expect(Value.Check(staffIdParams, { id: "u1" })).toBe(true);
    expect(Value.Check(staffIdParams, { id: 1 })).toBe(false);
  });
});
