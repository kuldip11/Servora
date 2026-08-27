import { describe, expect, it } from "vitest";
import { canTransitionOrder } from "../../orders/order-status.machine";
import { canTransition, KITCHEN_TICKET_TRANSITIONS } from "../../kitchen-tickets/ticket-status.machine";

describe("customer ordering end-to-end contract", () => {
  it("keeps a dine-in tab open while rounds are added", () => {
    expect(canTransitionOrder("OPEN", "BILL_REQUESTED")).toBe(true);
    expect(canTransitionOrder("OPEN", "PAID")).toBe(false);
    expect(canTransitionOrder("BILL_REQUESTED", "OPEN")).toBe(true);
  });

  it("requires bill request before final dine-in payment", () => {
    expect(canTransitionOrder("OPEN", "PAID")).toBe(false);
    expect(canTransitionOrder("BILL_REQUESTED", "PAID")).toBe(true);
  });

  it("releases a paid tab only through the normal terminal lifecycle", () => {
    expect(canTransitionOrder("PAID", "CLOSED")).toBe(true);
    expect(canTransitionOrder("CLOSED", "OPEN")).toBe(false);
  });

  it("supports payment-gated takeaway tickets", () => {
    expect(KITCHEN_TICKET_TRANSITIONS.PENDING_PAYMENT).toEqual(["FIRED"]);
    expect(canTransition("PENDING_PAYMENT", "FIRED")).toBe(true);
    expect(canTransition("PENDING_PAYMENT", "PREPARING")).toBe(false);
  });

  it("keeps kitchen progression ordered after payment", () => {
    expect(canTransition("FIRED", "PREPARING")).toBe(true);
    expect(canTransition("PREPARING", "READY")).toBe(true);
    expect(canTransition("READY", "SERVED")).toBe(true);
    expect(canTransition("FIRED", "READY")).toBe(false);
  });
});
