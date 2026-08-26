import { describe, expect, it } from "vitest";
import { Value } from "@sinclair/typebox/value";
import {
  createScheduleBody,
  updateScheduleBody,
  itemIdParams,
  scheduleIdParams,
  itemBranchParams,
  currentStatusQuery,
  holidayQuery,
  createHolidayBody,
  updateHolidayBody,
  holidayIdParams,
  upsertOverrideBody,
} from "../availability.validator";

describe("availability.validator validators", () => {
  it("requires scheduleType for schedule creation", () => {
    expect(Value.Check(createScheduleBody, {})).toBe(false);
    expect(Value.Check(createScheduleBody, { scheduleType: "DAILY" })).toBe(
      true,
    );
    expect(Value.Check(updateScheduleBody, {})).toBe(true);
  });
  it("validates required params and allows optional query/body fields", () => {
    expect(Value.Check(itemIdParams, {})).toBe(false);
    expect(Value.Check(itemIdParams, { id: "i1" })).toBe(true);
    expect(Value.Check(scheduleIdParams, { scheduleId: "s1" })).toBe(true);
    expect(Value.Check(itemBranchParams, { id: "i1", branchId: "b1" })).toBe(
      true,
    );
    expect(Value.Check(currentStatusQuery, {})).toBe(true);
    expect(Value.Check(holidayQuery, {})).toBe(true);
    expect(Value.Check(createHolidayBody, {})).toBe(false);
    expect(Value.Check(updateHolidayBody, {})).toBe(true);
    expect(Value.Check(holidayIdParams, {})).toBe(false);
    expect(Value.Check(upsertOverrideBody, {})).toBe(true);
  });
});
