import { describe, expect, it } from "vitest";
import { shouldDeliverRealtimeEvent } from "../delivery-scope";

describe("realtime delivery scope", () => {
  it("allows tenant-wide sockets to receive tenant events regardless of branch", () => {
    expect(shouldDeliverRealtimeEvent(null, "b1")).toBe(true);
    expect(shouldDeliverRealtimeEvent(undefined, "b2")).toBe(true);
    expect(shouldDeliverRealtimeEvent("", "b3")).toBe(true);
  });

  it("allows a branch-scoped socket only its exact branch events", () => {
    expect(shouldDeliverRealtimeEvent("b1", "b1")).toBe(true);
    expect(shouldDeliverRealtimeEvent("b1", "b2")).toBe(false);
    expect(shouldDeliverRealtimeEvent("b1", null)).toBe(false);
    expect(shouldDeliverRealtimeEvent("b1", undefined)).toBe(false);
  });
});
