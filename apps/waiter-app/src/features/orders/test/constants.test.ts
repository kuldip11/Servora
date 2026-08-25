import { describe, expect, it } from "vitest";
import {
  orderKeys,
  ORDERS_POLL_INTERVAL_MS,
  ORDER_DETAIL_POLL_INTERVAL_MS,
  STATUS_CONFIG,
  TICKET_STATUS_LABEL,
} from "../constants";

describe("orders constants", () => {
  it("builds stable query keys and polling intervals", () => {
    expect(orderKeys.all).toEqual(["orders"]);
    expect(orderKeys.detail("o1")).toEqual(["order", "o1"]);
    expect(ORDERS_POLL_INTERVAL_MS).toBe(15_000);
    expect(ORDER_DETAIL_POLL_INTERVAL_MS).toBe(10_000);
  });

  it("exposes billing and ticket status labels", () => {
    expect(STATUS_CONFIG.OPEN.label).toBe("Open");
    expect(STATUS_CONFIG.CANCELLED.label).toBe("Cancelled");
    expect(TICKET_STATUS_LABEL).toEqual({
      FIRED: "Waiting",
      PREPARING: "Cooking",
      READY: "Ready",
      SERVED: "Served",
    });
  });
});
