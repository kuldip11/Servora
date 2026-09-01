import { describe, expect, it } from "vitest";
import {
  mergeRealtimeTicket,
  shouldApplyRealtime,
} from "@/features/orders/utils/realtime";

describe("waiter realtime stale-event protection", () => {
  it("accepts newer/equal events and rejects older events", () => {
    const current = { updatedAt: "2026-08-27T12:00:00.000Z" };
    expect(
      shouldApplyRealtime(current, { updatedAt: "2026-08-27T13:00:00.000Z" }),
    ).toBe(true);
    expect(shouldApplyRealtime(current, current)).toBe(true);
    expect(
      shouldApplyRealtime(current, { updatedAt: "2026-08-27T11:00:00.000Z" }),
    ).toBe(false);
  });

  it("does not roll a ready ticket back to preparing", () => {
    const current = [
      { id: "t1", status: "READY", updatedAt: "2026-08-27T12:00:00.000Z" },
    ];
    const stale = {
      id: "t1",
      status: "PREPARING",
      updatedAt: "2026-08-27T11:00:00.000Z",
    };
    expect(mergeRealtimeTicket(current, stale)).toEqual(current);
  });
});
