import { describe, expect, it } from "vitest";
import { Value } from "@sinclair/typebox/value";
import {
  updateTicketStatusBody,
  ticketIdParams,
} from "@/modules/kitchen-tickets/ticket.validator";

describe("kitchen ticket validators", () => {
  it("accepts supported statuses and rejects unknown values", () => {
    expect(Value.Check(updateTicketStatusBody, { status: "READY" })).toBe(true);
    expect(Value.Check(updateTicketStatusBody, { status: "COOKING" })).toBe(
      false,
    );
    expect(Value.Check(updateTicketStatusBody, {})).toBe(false);
  });
  it("requires a ticket id parameter", () => {
    expect(Value.Check(ticketIdParams, { id: "t1" })).toBe(true);
    expect(Value.Check(ticketIdParams, {})).toBe(false);
  });
});
