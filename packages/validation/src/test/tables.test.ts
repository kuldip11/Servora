import { describe, expect, it } from "vitest";
import {
  createTableSchema,
  tableFormSchema,
  updateTableStatusSchema,
} from "../tables";

const uuid = "550e8400-e29b-41d4-a716-446655440000";

describe("createTableSchema", () => {
  it("accepts valid table data", () =>
    expect(
      createTableSchema.safeParse({ name: "T1", capacity: 4, branchId: uuid })
        .success,
    ).toBe(true));
  it("enforces capacity and field boundaries", () => {
    expect(
      createTableSchema.safeParse({ name: "T1", capacity: 1, branchId: uuid })
        .success,
    ).toBe(true);
    expect(
      createTableSchema.safeParse({ name: "T1", capacity: 100, branchId: uuid })
        .success,
    ).toBe(true);
    expect(
      createTableSchema.safeParse({ name: "T1", capacity: 0, branchId: uuid })
        .success,
    ).toBe(false);
    expect(
      createTableSchema.safeParse({ name: "T1", capacity: 101, branchId: uuid })
        .success,
    ).toBe(false);
  });
});

describe("tableFormSchema", () => {
  const valid = { name: " T1 ", capacity: "4", section: "", branchId: uuid };
  it("trims the name and accepts numeric capacity strings", () =>
    expect(tableFormSchema.parse(valid)).toEqual({ ...valid, name: "T1" }));
  it("allows an empty branch only for form compatibility", () =>
    expect(tableFormSchema.safeParse({ ...valid, branchId: "" }).success).toBe(
      true,
    ));
  it("rejects non-integer/out-of-range capacities", () => {
    expect(
      tableFormSchema.safeParse({ ...valid, capacity: "1.5" }).success,
    ).toBe(false);
    expect(
      tableFormSchema.safeParse({ ...valid, capacity: "101" }).success,
    ).toBe(false);
  });
});

describe("updateTableStatusSchema", () => {
  it("accepts supported table statuses and rejects unknown values", () => {
    for (const status of [
      "AVAILABLE",
      "OCCUPIED",
      "CLEANING",
      "RESERVED",
    ] as const) {
      expect(updateTableStatusSchema.safeParse({ status }).success).toBe(true);
    }
    expect(updateTableStatusSchema.safeParse({ status: "FREE" }).success).toBe(
      false,
    );
  });
});
