import { describe, expect, it } from "vitest";
import {
  BOARD_COLUMNS,
  STATUS_CONFIG,
  TICKETS_POLL_INTERVAL_MS,
  URGENT_THRESHOLD_MS,
} from "@/features/kitchen/constants";
describe("kitchen constants", () => {
  it("defines workflow and board", () => {
    expect(STATUS_CONFIG.FIRED.next).toBe("PREPARING");
    expect(STATUS_CONFIG.PREPARING.next).toBe("READY");
    expect(STATUS_CONFIG.READY.next).toBeNull();
    expect(STATUS_CONFIG.HELD.next).toBe("FIRED");
    expect(BOARD_COLUMNS.map((x) => x.status)).toEqual([
      "HELD",
      "FIRED",
      "PREPARING",
      "READY",
    ]);
    expect(URGENT_THRESHOLD_MS).toBe(900000);
    expect(TICKETS_POLL_INTERVAL_MS).toBe(20000);
  });
});
