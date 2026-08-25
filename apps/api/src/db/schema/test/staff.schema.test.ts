import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import { staffShifts, attendanceLogs } from "../staff.schema";
function expectTable(table: any, name: string, columns: string[]) {
  const actual = Object.keys(table[Symbol.for("drizzle:Columns")]);
  expect(getTableConfig(table).name).toBe(name);
  expect(actual).toEqual(expect.arrayContaining(columns));
  expect(actual).toHaveLength(columns.length);
}
describe("staff.schema.ts", () => {
  it("defines staff_shifts", () =>
    expectTable(staffShifts, "staff_shifts", [
      "id",
      "userId",
      "branchId",
      "startTime",
      "endTime",
      "notes",
      "createdAt",
    ]));
  it("defines attendance_logs", () =>
    expectTable(attendanceLogs, "attendance_logs", [
      "id",
      "userId",
      "branchId",
      "checkIn",
      "checkOut",
    ]));
});
