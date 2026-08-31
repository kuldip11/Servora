import { describe, expect, it, vi } from "vitest";
import {
  calculateElapsedMs,
  formatTicketAge,
  groupTicketsByStatus,
  isUrgent,
  filterTicketForStation,
  voidUrgency,
} from "../ticket";
import { URGENT_THRESHOLD_MS } from "../../constants";
import { ticket } from "../../test/fixtures";
describe("ticket utils", () => {
  it("calculates age and urgency", () => {
    const now = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(now);
    expect(calculateElapsedMs(new Date(now - 1000).toISOString())).toBe(1000);
    expect(
      isUrgent(new Date(now - URGENT_THRESHOLD_MS - 1).toISOString()),
    ).toBe(true);
    vi.restoreAllMocks();
  });
  it("formats and groups tickets", () => {
    expect(formatTicketAge(ticket.firedAt)).toContain("minute");
    expect(
      groupTicketsByStatus(
        [ticket, { ...ticket, id: "2", status: "READY" }],
        "FIRED",
      ),
    ).toHaveLength(1);
    expect(groupTicketsByStatus(undefined, "READY")).toEqual([]);
  });
  it("projects station lines while retaining unassigned fallback lines", () => {
    const multi = { ...ticket, items: [
      { ...ticket.items[0]!, id: "grill", stationId: "grill" },
      { ...ticket.items[0]!, id: "bar", stationId: "bar" },
      { ...ticket.items[0]!, id: "fallback", stationId: null },
    ] };
    expect(filterTicketForStation(multi, "grill")?.items.map((item) => item.id)).toEqual(["grill", "fallback"]);
    expect(filterTicketForStation(multi, "dessert")?.items.map((item) => item.id)).toEqual(["fallback"]);
    expect(filterTicketForStation(multi)).toEqual(multi);
  });

  it("classifies in-progress voids as urgent", () => {
    const voided = { ...ticket, status: "PREPARING" as const, items: [{ ...ticket.items[0]!, itemStatus: "VOIDED" as const }] };
    expect(voidUrgency(voided)).toBe("danger");
    expect(voidUrgency({ ...voided, status: "FIRED" })).toBe("warning");
  });

});
