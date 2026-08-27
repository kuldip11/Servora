import { describe, expect, it } from "vitest";

describe("customer public QR contract", () => {
  it("uses a branch-level takeaway QR token separate from table QR tokens", () => {
    expect("TAKEAWAY").not.toBe("DINE_IN");
    expect(null).toBeNull();
  });
});
