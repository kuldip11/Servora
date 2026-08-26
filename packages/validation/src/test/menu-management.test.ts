import { describe, expect, it } from "vitest";
import {
  applyTemplateSchema,
  createHolidaySchema,
  createMenuTagSchema,
  saveTemplateSchema,
} from "../menu-management";

describe("menu management schemas", () => {
  it("validates menu tags and their six-digit hex colors", () => {
    expect(
      createMenuTagSchema.parse({ name: " Popular ", color: "#A1b2C3" }).name,
    ).toBe("Popular");
    expect(
      createMenuTagSchema.safeParse({ name: "x", color: "blue" }).success,
    ).toBe(false);
  });
  it("validates holidays and trims names/regions", () => {
    expect(
      createHolidaySchema.parse({
        name: " New Year ",
        holidayDate: "2026-01-01",
        region: " East ",
      }).name,
    ).toBe("New Year");
    expect(
      createHolidaySchema.safeParse({ name: "", holidayDate: "2026-01-01" })
        .success,
    ).toBe(false);
  });
  it("requires a category name when applying a template", () => {
    expect(
      applyTemplateSchema.safeParse({
        branchId: "branch-1",
        categoryName: " Mains ",
      }).success,
    ).toBe(true);
    expect(
      applyTemplateSchema.safeParse({ branchId: "branch-1", categoryName: " " })
        .success,
    ).toBe(false);
  });
  it("validates template names and optional descriptions", () => {
    expect(
      saveTemplateSchema.parse({ name: " Dinner ", description: " Menu " }),
    ).toEqual({ name: "Dinner", description: "Menu" });
    expect(
      saveTemplateSchema.safeParse({ name: "x", description: "a".repeat(501) })
        .success,
    ).toBe(false);
  });
});
