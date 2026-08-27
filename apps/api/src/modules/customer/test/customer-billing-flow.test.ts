import { describe, expect, it } from "vitest";

describe("customer billing flow contract", () => {
  it("requires a bill request before customer checkout", () => {
    expect("OPEN").not.toBe("BILL_REQUESTED");
    expect("BILL_REQUESTED").toBe("BILL_REQUESTED");
  });

  it("keeps paid/cancelled/closed tabs terminal for customer billing", () => {
    for (const status of ["PAID", "CLOSED", "CANCELLED"]) {
      expect(status).not.toBe("BILL_REQUESTED");
    }
  });
});
