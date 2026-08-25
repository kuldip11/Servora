import { describe, expect, it } from "vitest";
import { getOrderStatusColor, getOrderStatusLabel } from "../order-status";

describe("getOrderStatusColor", () => {
  it.each([
    ["OPEN", "bg-info-surface text-info"],
    ["BILL_REQUESTED", "bg-warning-surface text-warning"],
    ["PAID", "bg-primary-surface text-primary"],
    ["CLOSED", "bg-surface-secondary text-text-secondary"],
    ["CANCELLED", "bg-danger-surface text-danger"],
  ])("maps %s to its semantic status classes", (status, expected) => {
    expect(getOrderStatusColor(status)).toBe(expected);
  });

  it("uses the neutral fallback for an unknown status", () => {
    expect(getOrderStatusColor("UNKNOWN")).toBe(
      "bg-surface-secondary text-text-secondary",
    );
  });
});

describe("getOrderStatusLabel", () => {
  it("replaces status separators with spaces", () => {
    expect(getOrderStatusLabel("BILL_REQUESTED")).toBe("BILL REQUESTED");
  });
});
