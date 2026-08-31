import { describe, expect, it } from "vitest";
import { buildDiff } from "../menu-change-log";

describe("menu change log", () => {
  it("records old and new values only for changed fields", () => {
    expect(buildDiff(
      { id: "item-1", name: "Tea", basePrice: "20.00" },
      { id: "item-1", name: "Tea", basePrice: "25.00" },
    )).toEqual({ basePrice: { old: "20.00", new: "25.00" } });
  });

  it("represents creation and deletion without losing null values", () => {
    expect(buildDiff(null, { name: "Lunch", description: null })).toEqual({
      name: { old: null, new: "Lunch" },
      description: { old: null, new: null },
    });
  });
});
