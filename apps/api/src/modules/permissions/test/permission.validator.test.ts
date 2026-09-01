import { describe, expect, it } from "vitest";
import { Value } from "@sinclair/typebox/value";
import { setRolePermissionsBody } from "@/modules/permissions/permission.validator";

describe("permission validator", () => {
  it("accepts unique UUID permission ids", () => {
    expect(
      Value.Check(setRolePermissionsBody, {
        permissionIds: ["11111111-1111-4111-8111-111111111111"],
      }),
    ).toBe(true);
  });
  it("rejects duplicate permission ids", () => {
    const id = "11111111-1111-4111-8111-111111111111";
    expect(
      Value.Check(setRolePermissionsBody, { permissionIds: [id, id] }),
    ).toBe(false);
  });
});
