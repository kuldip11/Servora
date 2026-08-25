import { describe, expect, it } from "vitest";
import { Value } from "@sinclair/typebox/value";
import {
  exportItemsQuery,
  exportQuery,
  importFileBody,
} from "../import-export.validator";

describe("import-export.validator validators", () => {
  it("allows optional export query fields", () => {
    expect(Value.Check(exportItemsQuery, {})).toBe(true);
    expect(
      Value.Check(exportItemsQuery, { format: "csv", branchId: "b1" }),
    ).toBe(true);
    expect(Value.Check(exportQuery, {})).toBe(true);
    expect(Value.Check(exportQuery, { format: "xlsx" })).toBe(true);
  });
  it("requires an uploaded file for import", () => {
    expect(Value.Check(importFileBody, {})).toBe(false);
  });
});
