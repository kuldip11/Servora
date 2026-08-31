import { describe, expect, it } from "vitest";
import { highestPriorityActiveSchedule, scheduleMatches } from "./schedule-precedence";

const daily = { scheduleType: "DAILY" as const, startTime: "06:00:00", endTime: "11:00:00", dayOfWeek: null, startDate: null, endDate: null, holidayName: null, isActive: true };
const noHoliday = async () => false;

describe("shared schedule precedence", () => {
  it("uses inclusive daypart boundaries", async () => {
    expect(await scheduleMatches(daily, new Date(2026, 7, 29, 6, 0), noHoliday)).toBe(true);
    expect(await scheduleMatches(daily, new Date(2026, 7, 29, 11, 0), noHoliday)).toBe(true);
    expect(await scheduleMatches(daily, new Date(2026, 7, 29, 11, 0, 1), noHoliday)).toBe(false);
  });
  it("chooses holiday over an overlapping weekly window", async () => {
    const weekly = { ...daily, scheduleType: "WEEKLY" as const, dayOfWeek: 6 };
    const holiday = { ...daily, scheduleType: "HOLIDAY" as const, startTime: null, endTime: null, holidayName: "Festival" };
    expect(await highestPriorityActiveSchedule([weekly, holiday], new Date(2026, 7, 29, 8), async () => true)).toBe(holiday);
  });
});
