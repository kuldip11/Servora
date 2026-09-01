import { describe, expect, it } from "vitest";
import {
  ORDER_STATUS_TRANSITIONS,
  assertValidOrderTransition,
  canTransitionOrder,
} from "@/modules/orders/order-status.machine";

describe("order status machine", () => {
  it("allows exactly the documented forward/back transitions", () => {
    expect(canTransitionOrder("OPEN", "BILL_REQUESTED")).toBe(true);
    expect(canTransitionOrder("OPEN", "CANCELLED")).toBe(true);
    expect(canTransitionOrder("BILL_REQUESTED", "OPEN")).toBe(true);
    expect(canTransitionOrder("BILL_REQUESTED", "PAID")).toBe(true);
    expect(canTransitionOrder("PAID", "CLOSED")).toBe(true);
    expect(ORDER_STATUS_TRANSITIONS.CLOSED).toEqual([]);
    expect(ORDER_STATUS_TRANSITIONS.CANCELLED).toEqual([]);
  });
  it("rejects invalid and terminal-state transitions with domain details", () => {
    expect(canTransitionOrder("OPEN", "PAID")).toBe(false);
    expect(canTransitionOrder("PAID", "OPEN")).toBe(false);
    expect(() => assertValidOrderTransition("CLOSED", "OPEN")).toThrow(
      "Cannot transition order",
    );
    expect(() => assertValidOrderTransition("OPEN", "PAID")).toThrow(
      "Cannot transition order",
    );
  });
});
